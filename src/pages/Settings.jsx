import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDashboard } from '../context/DashboardContext';
import {
  Wind, Thermometer, Droplets, Zap, Bell, Cpu,
  DollarSign, Home, Save, RotateCcw, Wifi, Server
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, type: 'spring', stiffness: 280, damping: 28 },
  }),
};

function SectionHeader({ title, icon: Icon, color }) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
    red: 'bg-red-500/10 text-red-500',
  };
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
        <Icon size={12} />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
    </div>
  );
}

function SliderSetting({ label, value, min, max, unit, step = 1, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-semibold text-slate-900 dark:text-white font-mono">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-cyan-500"
        style={{ background: `linear-gradient(to right, #06b6d4 ${pct}%, #e2e8f0 ${pct}%)` }}
      />
      <div className="flex justify-between">
        <span className="text-[9px] text-slate-400">{min}{unit}</span>
        <span className="text-[9px] text-slate-400">{max}{unit}</span>
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div>
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</div>
        {description && <div className="text-[10px] text-slate-400 mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-all active:scale-95 flex-shrink-0 ${
          checked ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md"
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { state, actions } = useDashboard();
  const { settings, mqttStatus } = state;
  const [saved, setSaved] = useState(false);

  const [localSettings, setLocalSettings] = useState({
    overloadLimit: settings.overloadLimit,
    targetSuhu: settings.targetSuhu,
    tarifPerKwh: settings.tarifPerKwh,
    gasThreshold: settings.gasThreshold,
  });

  const handleSave = () => {
    Object.keys(localSettings).forEach(key => {
      actions.updateSetting(key, localSettings[key]);
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults = { overloadLimit: 500, targetSuhu: 26, tarifPerKwh: 1444.70, gasThreshold: 500 };
    setLocalSettings(defaults);
    Object.keys(defaults).forEach(key => actions.updateSetting(key, defaults[key]));
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="p-4 lg:p-6 pb-24 lg:pb-6 flex flex-col gap-4 w-full"
    >
      {/* Header */}
      <motion.div custom={0} variants={fadeUp}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Pengaturan</h2>
        <p className="text-xs text-slate-500 mt-1">Konfigurasi sensor & sistem</p>
      </motion.div>

      {/* System Info */}
      <motion.div custom={1} variants={fadeUp}>
        <SectionHeader title="Informasi Sistem" icon={Server} color="blue" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-slate-400">MQTT Status</div>
              <div className={`text-xs font-semibold ${mqttStatus === 'connected' ? 'text-emerald-500' : 'text-red-500'}`}>
                {mqttStatus === 'connected' ? 'Terhubung' : 'Terputus'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Firmware</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">v1.0.0</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Perangkat</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">ESP32-001</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Broker</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">HiveMQ Cloud</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tariff */}
      <motion.div custom={2} variants={fadeUp}>
        <SectionHeader title="Tarif Listrik" icon={DollarSign} color="emerald" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <label className="text-[11px] text-slate-500 block mb-1">Harga per kWh (Rupiah)</label>
          <input
            type="number"
            value={localSettings.tarifPerKwh}
            onChange={e => setLocalSettings({ ...localSettings, tarifPerKwh: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
            min="0" step="0.01"
          />
          <div className="mt-2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[11px] text-slate-500">
              Saat ini: <span className="font-semibold text-slate-900 dark:text-white">Rp {settings.tarifPerKwh.toLocaleString('id-ID')}/kWh</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* Overload Limit */}
      <motion.div custom={3} variants={fadeUp}>
        <SectionHeader title="Proteksi Daya (PZEM-004T)" icon={Zap} color="red" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <SliderSetting
            label="Batas Daya Maksimum"
            value={localSettings.overloadLimit}
            min={200} max={2200} unit=" W" step={50}
            onChange={v => setLocalSettings({ ...localSettings, overloadLimit: v })}
          />
          <div className="flex gap-2 mt-3">
            {[450, 900, 1300].map(v => (
              <button key={v}
                onClick={() => setLocalSettings({ ...localSettings, overloadLimit: v })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                  localSettings.overloadLimit === v
                    ? 'bg-red-500/10 border border-red-500/30 text-red-500'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {v}W
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Gas Threshold */}
      <motion.div custom={4} variants={fadeUp}>
        <SectionHeader title="Sensor Gas (MQ-2)" icon={Wind} color="purple" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <SliderSetting
            label="Batas Bahaya"
            value={localSettings.gasThreshold}
            min={100} max={1000} unit=" ppm" step={10}
            onChange={v => setLocalSettings({ ...localSettings, gasThreshold: v })}
          />
          <div className="flex gap-2 mt-3">
            {[200, 300, 500].map(v => (
              <button key={v}
                onClick={() => setLocalSettings({ ...localSettings, gasThreshold: v })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                  localSettings.gasThreshold === v
                    ? 'bg-purple-500/10 border border-purple-500/30 text-purple-500'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {v} ppm
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Target Temperature */}
      <motion.div custom={5} variants={fadeUp}>
        <SectionHeader title="Suhu Target Kipas" icon={Thermometer} color="orange" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <SliderSetting
            label="Suhu Aktivasi Kipas"
            value={localSettings.targetSuhu}
            min={20} max={35} unit="°C" step={0.5}
            onChange={v => setLocalSettings({ ...localSettings, targetSuhu: v })}
          />
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div custom={6} variants={fadeUp}>
        <SectionHeader title="Notifikasi" icon={Bell} color="orange" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2">
          <ToggleSetting
            label="Alert Gas Berbahaya"
            description="Notifikasi saat gas melebihi batas"
            checked={settings.gasNotifications}
            onChange={v => actions.updateSetting('gasNotifications', v)}
          />
          <ToggleSetting
            label="Deteksi Gerakan"
            description="Notifikasi saat motion sensor aktif"
            checked={settings.motionNotifications}
            onChange={v => actions.updateSetting('motionNotifications', v)}
          />
          <ToggleSetting
            label="Daya Berlebih"
            description={`Alert saat watt > ${settings.overloadLimit}W`}
            checked={settings.overloadNotifications}
            onChange={v => actions.updateSetting('overloadNotifications', v)}
          />
          <ToggleSetting
            label="Notifikasi Browser"
            description="Tampilkan notifikasi di browser"
            checked={settings.notificationsEnabled}
            onChange={v => actions.updateSetting('notificationsEnabled', v)}
          />
        </div>
      </motion.div>

      {/* OTA Update Section */}
<motion.div custom={7} variants={fadeUp}>
  <SectionHeader title="OTA Update" icon={Cpu} color="purple" />
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
    <p className="text-xs text-slate-500 mb-3">
      Aktifkan mode OTA untuk upload firmware baru ke ESP32 via browser.
    </p>
    
    {/* OTA Toggle */}
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${state.systemInfo?.otaActive ? 'bg-orange-400 animate-pulse' : 'bg-slate-400'}`} />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Mode OTA: {state.systemInfo?.otaActive ? 'AKTIF' : 'NONAKTIF'}
        </span>
      </div>
      <button
        onClick={actions.toggleOTA}
        className={`relative w-14 h-7 rounded-full transition-all active:scale-95 ${
          state.systemInfo?.otaActive 
            ? 'bg-gradient-to-r from-orange-500 to-red-500' 
            : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <motion.div
          animate={{ x: state.systemInfo?.otaActive ? 28 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
        />
      </button>
    </div>

    {/* IP ESP32 */}
    {state.systemInfo?.otaActive && state.systemInfo?.espIP && (
      <div className="p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Wifi size={14} className="text-green-500" />
          <span className="text-xs font-semibold text-green-600 dark:text-green-400">ESP32 OTA Ready</span>
        </div>
        <p className="text-sm font-mono text-green-700 dark:text-green-300">
          http://{state.systemInfo.espIP}/update
        </p>
        <button
          onClick={() => window.open(`http://${state.systemInfo.espIP}/update`, '_blank')}
          className="mt-2 w-full py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-xl transition-all active:scale-95"
        >
          Buka Halaman Upload Firmware
        </button>
      </div>
    )}

    <p className="text-[10px] text-slate-400 text-center">
      {state.systemInfo?.otaActive 
        ? 'OTA aktif. Sensor berhenti membaca. Matikan OTA untuk kembali normal.' 
        : 'Aktifkan OTA untuk upload firmware baru ke ESP32.'}
    </p>
  </div>
</motion.div>

      {/* Actions */}
      <motion.div custom={7} variants={fadeUp} className="flex gap-2">
        <button onClick={handleReset}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all active:scale-95 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500"
        >
          <RotateCcw size={14} />
          Reset
        </button>
        <button onClick={handleSave}
          className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl transition-all active:scale-95 text-xs font-semibold text-white"
          style={{
            background: saved ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            border: saved ? '1px solid rgba(52,211,153,0.4)' : 'none',
            color: saved ? '#34d399' : 'white',
          }}
        >
          <Save size={14} />
          {saved ? 'Tersimpan!' : 'Simpan Pengaturan'}
        </button>
      </motion.div>

      {/* Footer */}
      <motion.div custom={8} variants={fadeUp}>
        <div className="text-center py-3">
          <div className="text-xs text-slate-400 font-semibold">SmartKost v1.0.0</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Smart Home untuk Penghuni Kost</div>
        </div>
      </motion.div>

      <div className="h-2" />
    </motion.div>
  );
  
}