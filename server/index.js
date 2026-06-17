import express from 'express';
import cors from 'cors';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ==================== ENERGY LOGS ====================

// Get energy logs (last 24 hours)
app.get('/api/energy/logs', (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM energy_logs 
    WHERE timestamp >= datetime('now', '-24 hours')
    ORDER BY timestamp ASC
  `).all();
  
  res.json(logs);
});

// Get today's summary
app.get('/api/energy/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total_readings,
      ROUND(AVG(wattage), 2) as avg_wattage,
      ROUND(MAX(wattage), 2) as max_wattage,
      ROUND(MIN(CASE WHEN wattage > 0 THEN wattage END), 2) as min_wattage,
      ROUND(SUM(kwh), 4) as total_kwh,
      ROUND(SUM(cost_rupiah), 2) as total_cost
    FROM energy_logs 
    WHERE date(timestamp) = ?
  `).get(today);
  
  res.json(summary || { total_readings: 0, avg_wattage: 0, max_wattage: 0, min_wattage: 0, total_kwh: 0, total_cost: 0 });
});

// Get hourly average (for chart)
app.get('/api/energy/hourly', (req, res) => {
  const hourly = db.prepare(`
    SELECT 
      strftime('%H', timestamp) as hour,
      ROUND(AVG(wattage), 2) as avg_wattage,
      ROUND(SUM(kwh), 4) as total_kwh,
      ROUND(SUM(cost_rupiah), 2) as total_cost
    FROM energy_logs 
    WHERE timestamp >= datetime('now', '-24 hours')
    GROUP BY hour
    ORDER BY hour ASC
  `).all();
  
  res.json(hourly);
});

// Get weekly summary
app.get('/api/energy/weekly', (req, res) => {
  const weekly = db.prepare(`
    SELECT 
      date(timestamp) as date,
      ROUND(AVG(wattage), 2) as avg_wattage,
      ROUND(MAX(wattage), 2) as max_wattage,
      ROUND(SUM(kwh), 4) as total_kwh,
      ROUND(SUM(cost_rupiah), 2) as total_cost
    FROM energy_logs 
    WHERE timestamp >= datetime('now', '-7 days')
    GROUP BY date
    ORDER BY date ASC
  `).all();
  
  res.json(weekly);
});

// Add energy log (dipanggil tiap menit dari frontend atau scheduler)
app.post('/api/energy/log', (req, res) => {
  const { wattage, voltage, ampere } = req.body;
  
  // Skip kalo watt 0 (ga ada beban)
  if (!wattage || wattage <= 0) {
    return res.json({ skipped: true, reason: 'No load' });
  }
  
  // Get tariff
  const tariff = db.prepare('SELECT value FROM settings WHERE key = ?').get('tarif_per_kwh');
  const tarifPerKwh = tariff ? parseFloat(tariff.value) : 1444.70;
  
  // Calculate kWh for 1 minute
  const kwh = (wattage / 1000) * (1 / 60);
  const costRupiah = kwh * tarifPerKwh;
  
  const stmt = db.prepare(`
    INSERT INTO energy_logs (wattage, voltage, ampere, kwh, cost_rupiah)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(wattage, voltage, ampere, kwh, costRupiah);
  
  res.json({ 
    id: result.lastInsertRowid,
    kwh: kwh.toFixed(6),
    cost: costRupiah.toFixed(2)
  });
});

// Cleanup old logs (keep last 24 hours only)
app.post('/api/energy/cleanup', (req, res) => {
  const result = db.prepare(`
    DELETE FROM energy_logs 
    WHERE timestamp < datetime('now', '-24 hours')
  `).run();
  
  res.json({ deleted: result.changes, message: 'Old logs cleaned' });
});

// Reset today's logs
app.post('/api/energy/reset', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const result = db.prepare(`
    DELETE FROM energy_logs 
    WHERE date(timestamp) = ?
  `).run(today);
  
  res.json({ deleted: result.changes, message: 'Today logs reset' });
});

// ==================== SCHEDULES ====================

app.get('/api/schedules', (req, res) => {
  const schedules = db.prepare('SELECT * FROM schedules ORDER BY time').all();
  res.json(schedules);
});

app.post('/api/schedules', (req, res) => {
  const { device, action, time, days, active = 1 } = req.body;
  const stmt = db.prepare('INSERT INTO schedules (device, action, time, days, active) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(device, action, time, days, active);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  const { device, action, time, days, active } = req.body;
  db.prepare('UPDATE schedules SET device=?, action=?, time=?, days=?, active=? WHERE id=?')
    .run(device, action, time, days, active, id);
  res.json({ success: true });
});

app.delete('/api/schedules/:id', (req, res) => {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== SETTINGS ====================

app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all();
  const settingsObj = {};
  settings.forEach(s => { settingsObj[s.key] = s.value; });
  res.json(settingsObj);
});

app.put('/api/settings/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `).run(key, value, value);
  res.json({ success: true });
});

// ==================== HEALTH ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 SmartKost Server running on http://localhost:${PORT}`);
  
  // Auto cleanup setiap jam
  setInterval(() => {
    const result = db.prepare("DELETE FROM energy_logs WHERE timestamp < datetime('now', '-24 hours')").run();
    if (result.changes > 0) {
      console.log(`🧹 Auto cleanup: ${result.changes} old logs deleted`);
    }
  }, 3600000); // 1 jam
  
  // Log energy dummy kalo ga ada data (buat testing)
  console.log('📊 Server ready for energy logging');
});