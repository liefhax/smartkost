import mqtt from 'mqtt';
import db from './database.js';

// Array ini cuma numpang di RAM sementara. Tiap 5 menit dibersihin.
let powerBuffer = [];

// Fungsi bantu biar reset harian ngikutin jam Jakarta (WIB), bukan jam server (UTC)
function getCurrentDateWIB() {
  const date = new Date();
  const wibDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const year = wibDate.getFullYear();
  const month = String(wibDate.getMonth() + 1).padStart(2, '0');
  const day = String(wibDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // Hasil: 2026-06-22
}

export function initMqttService() {
  // Pake wss:// sesuai dengan settingan HiveMQ lo
  const client = mqtt.connect('wss://5e83bc92b0c643ccbc75e9a515c3e9cd.s1.eu.hivemq.cloud:8884/mqtt', {
    username: 'liefhax',
    password: 'Sukabumi123',
    clientId: 'backend_logger_' + Math.random().toString(16).substring(2, 8)
  });

  client.on('connect', () => {
    console.log('[MQTT-Backend] Connected & Ready to log data (5-Min Interval)');
    client.subscribe('kost/sensor/daya');
  });

  client.on('message', (topic, message) => {
    if (topic === 'kost/sensor/daya') {
      try {
        const data = JSON.parse(message.toString());
        if (data.watt >= 0) powerBuffer.push(data);
      } catch (err) {}
    }
  });

  // Jalanin eksekusi save ke DB tiap 5 menit (300.000 ms)
  setInterval(() => {
    if (powerBuffer.length === 0) return;

    let totalWatt = 0, totalVolt = 0, totalAmpere = 0, maxWatt = 0;

    // Kalkulasi rata-rata
    powerBuffer.forEach(d => {
      totalWatt += d.watt;
      totalVolt += d.volt;
      totalAmpere += d.ampere;
      if (d.watt > maxWatt) maxWatt = d.watt;
    });

    const count = powerBuffer.length;
    const avgWatt = totalWatt / count;
    const avgVolt = totalVolt / count;
    const avgAmpere = totalAmpere / count;

    // Hitung kWh untuk 5 menit
    const kwh5Min = (avgWatt / 1000) * (5 / 60);

    // Ambil tarif dari settings table
    let tarif = 1444.70;
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'tarif_per_kwh'").get();
      if (row) tarif = parseFloat(row.value);
    } catch (e) {
      console.error("[DB] Failed to fetch tariff", e);
    }

    const cost5Min = kwh5Min * tarif;
    const today = getCurrentDateWIB();

    const insertLog = db.prepare(`
      INSERT INTO energy_logs (wattage, voltage, ampere, kwh, cost_rupiah) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const updateDaily = db.prepare(`
      INSERT INTO daily_energy_summary (date, total_kwh, total_cost, peak_watt, avg_watt, readings_count)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(date) DO UPDATE SET
        total_kwh = total_kwh + excluded.total_kwh,
        total_cost = total_cost + excluded.total_cost,
        peak_watt = MAX(peak_watt, excluded.peak_watt),
        avg_watt = ((avg_watt * readings_count) + excluded.avg_watt) / (readings_count + 1),
        readings_count = readings_count + 1
    `);

    // Pakai transaksi biar SQLite nggak ngelock file kelamaan
    db.transaction(() => {
      insertLog.run(avgWatt, avgVolt, avgAmpere, kwh5Min, cost5Min);
      updateDaily.run(today, kwh5Min, cost5Min, maxWatt, avgWatt);
    })();

    console.log(`[DB] Logged 5-Min Avg: ${avgWatt.toFixed(1)}W | Cost: Rp ${cost5Min.toFixed(1)}`);
    
    // Kosongin buffer untuk 5 menit berikutnya
    powerBuffer = [];

  }, 5 * 60 * 1000); 
}