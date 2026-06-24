import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../context/DashboardContext';
import { Zap, Wind, Timer, X, Thermometer } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, type: 'spring', stiffness: 280, damping: 28 } }),
};

function formatCountdown(seconds) {
  if (!seconds || seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function RelayCard({ device, name, subtitle, icon: Icon, enabled, onToggle, timer, onSetTimer, onClearTimer }) {
  const [showTimer, setShowTimer] = useState(false);
  const [timerInput, setTimerInput] = useState('');
  const [remaining, setRemaining] = useState(null);
  const intervalRef = useRef(null);

  const presets = [1, 5, 15, 30, 60, 120];

  // Update countdown setiap detik
  useEffect(() => {
    if (timer?.active && timer?.endTime) {
      const updateRemaining = () => {
        const now = Date.now();
        const left = Math.max(0, Math.ceil((timer.endTime - now) / 1000));
        if (left <= 0) {
          setRemaining(null);
          clearInterval(intervalRef.current);
        } else {
          setRemaining(left);
        }
      };
      updateRemaining();
      intervalRef.current = setInterval(updateRemaining, 1000);
      return () => clearInterval(intervalRef.current);
    } else {
      setRemaining(null);
    }
  }, [timer]);

  const handleSetTimer = (minutes) => {
    onSetTimer(device, minutes);
    setShowTimer(false);
    setTimerInput('');
  };

  return (
    <motion.div variants={fadeUp} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            enabled ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/20' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
          }`}>
            <Icon size={18} className={enabled ? 'text-cyan-500' : 'text-slate-400'} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{name}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</div>
          </div>
        </div>

        <button onClick={onToggle} className={`relative w-12 h-6 rounded-full transition-all duration-300 active:scale-95 ${
          enabled ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}>
          <motion.div animate={{ x: enabled ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {/* Status & Timer Bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-3 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-400'}`} />
          <span className={`text-xs font-semibold ${enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
            {enabled ? 'Menyala' : 'Mati'}
          </span>
        </div>
        {remaining !== null && remaining > 0 && (
          <div className="flex items-center gap-1.5">
            <Timer size={12} className="text-cyan-500 animate-pulse" />
            <span className="text-xs font-semibold text-cyan-500 font-mono">{formatCountdown(remaining)}</span>
            <button onClick={() => onClearTimer(device)} className="ml-1 p-0.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded transition-colors">
              <X size={12} className="text-red-400" />
            </button>
          </div>
        )}
      </div>

      {/* Timer Button */}
      <button onClick={() => setShowTimer(!showTimer)}
        className={`w-full flex items-center gap-2 text-xs transition-colors ${showTimer ? 'text-cyan-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
        <Timer size={13} />
        <span>{remaining ? 'Atur Ulang Timer' : showTimer ? 'Tutup Timer' : 'Atur Timer Auto-Off'}</span>
      </button>

      <AnimatePresence>
        {showTimer && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 mb-2">Pilih durasi atau masukkan custom:</p>
              {/* Preset Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {presets.map(p => (
                  <button key={p} onClick={() => handleSetTimer(p)}
                    className="py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:border-cyan-300 active:scale-95 transition-all">
                    {p < 60 ? `${p} menit` : p === 60 ? '1 jam' : `${p / 60} jam`}
                  </button>
                ))}
              </div>
              {/* Custom Input */}
              <div className="flex gap-2">
                <input type="number" placeholder="Menit custom..." value={timerInput}
                  onChange={e => setTimerInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
                  min="1" max="480" />
                <button onClick={() => timerInput && handleSetTimer(parseInt(timerInput))}
                  disabled={!timerInput || parseInt(timerInput) < 1}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold active:scale-95 disabled:opacity-40 transition-all">
                  Set
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FanCard({ speed, autoMode, currentTemp, targetTemp, onSpeedChange, onAutoToggle, timer, onSetTimer, onClearTimer }) {
  const [showTimer, setShowTimer] = useState(false);
  const [timerInput, setTimerInput] = useState('');
  const [remaining, setRemaining] = useState(null);
  const intervalRef = useRef(null);

  const presetSpeeds = [
    { label: 'Off', value: 0 },
    { label: 'Low', value: 30 },
    { label: 'Med', value: 60 },
    { label: 'High', value: 100 },
  ];
  const timerPresets = [1, 5, 15, 30, 60, 120];

  const speedPercent = Math.round((speed / 255) * 100);
  const speedColor = speed === 0 ? '#94a3b8' : speedPercent < 40 ? '#34d399' : speedPercent < 70 ? '#fb923c' : '#f87171';
  const spinDuration = speed > 0 ? Math.max(0.3, 3 - (speed / 255) * 2.5) : 0;

  useEffect(() => {
    if (timer?.active && timer?.endTime) {
      const updateRemaining = () => {
        const left = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
        setRemaining(left > 0 ? left : null);
        if (left <= 0) clearInterval(intervalRef.current);
      };
      updateRemaining();
      intervalRef.current = setInterval(updateRemaining, 1000);
      return () => clearInterval(intervalRef.current);
    } else {
      setRemaining(null);
    }
  }, [timer]);

  const handleSetTimer = (minutes) => {
    onSetTimer('fan', minutes);
    setShowTimer(false);
    setTimerInput('');
  };

  return (
    <motion.div variants={fadeUp} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${speed > 0 ? 'bg-purple-500/20 border border-purple-500/30 shadow-lg shadow-purple-500/20' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
            <motion.div animate={{ rotate: speed > 0 ? 360 : 0 }}
              transition={{ repeat: speed > 0 ? Infinity : 0, duration: spinDuration, ease: 'linear' }}>
              <Wind size={18} className={speed > 0 ? 'text-purple-500' : 'text-slate-400'} />
            </motion.div>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Kipas Angin</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">PWM • 0-255</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: speedColor }}>{speedPercent}%</div>
          {remaining !== null && remaining > 0 && (
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <Timer size={10} className="text-cyan-500" />
              <span className="text-[10px] font-semibold text-cyan-500 font-mono">{formatCountdown(remaining)}</span>
              <button onClick={() => onClearTimer('fan')} className="p-0.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded">
                <X size={10} className="text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auto Mode */}
      <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
        <div className="flex items-center gap-2">
          <Thermometer size={14} className="text-orange-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Auto Mode</span>
        </div>
        <button onClick={onAutoToggle} className={`relative w-10 h-5 rounded-full transition-all active:scale-95 ${autoMode ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
          <motion.div animate={{ x: autoMode ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {autoMode && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
          <Thermometer size={14} className="text-blue-500" />
          <span className="text-xs text-blue-600 dark:text-blue-400">Suhu: {currentTemp}°C | Target: {targetTemp}°C</span>
        </div>
      )}

      {/* Speed Control */}
      {!autoMode && (
        <>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-[11px] text-slate-500">Kecepatan PWM</span>
              <span className="text-[11px] text-slate-500 font-mono">{speed} / 255</span>
            </div>
            <input type="range" min="0" max="255" step="5" value={speed}
              onChange={e => onSpeedChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-full cursor-pointer accent-cyan-500"
              style={{ background: `linear-gradient(to right, ${speedColor} ${speedPercent}%, #e2e8f0 ${speedPercent}%)` }} />
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {presetSpeeds.map(ps => (
              <button key={ps.value} onClick={() => onSpeedChange(Math.round((ps.value / 100) * 255))}
                className={`py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${speedPercent === ps.value && ps.value > 0 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-600' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                {ps.label}
              </button>
            ))}
          </div>
          {/* Speed visualization */}
          <div className="flex items-center gap-0.5 mb-4">
            {Array.from({ length: 20 }, (_, i) => {
              const threshold = ((i + 1) / 20) * 255;
              return (
                <div key={i} className="flex-1 rounded-sm transition-all duration-300"
                  style={{ height: `${8 + (i / 19) * 16}px`, backgroundColor: speed >= threshold ? speedColor : '#e2e8f0', opacity: speed >= threshold ? 1 : 0.4 }} />
              );
            })}
          </div>
        </>
      )}

      {/* Timer Section */}
      <button onClick={() => setShowTimer(!showTimer)}
        className={`w-full flex items-center gap-2 text-xs transition-colors ${showTimer ? 'text-cyan-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
        <Timer size={13} />
        <span>{remaining ? 'Atur Ulang Timer' : showTimer ? 'Tutup Timer' : 'Atur Timer Auto-Off'}</span>
      </button>

      <AnimatePresence>
        {showTimer && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {timerPresets.map(p => (
                  <button key={p} onClick={() => handleSetTimer(p)}
                    className="py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 active:scale-95 transition-all">
                    {p < 60 ? `${p} menit` : p === 60 ? '1 jam' : `${p / 60} jam`}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="Menit..." value={timerInput}
                  onChange={e => setTimerInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50"
                  min="1" max="480" />
                <button onClick={() => timerInput && handleSetTimer(parseInt(timerInput))}
                  disabled={!timerInput}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold active:scale-95 disabled:opacity-40">
                  Set
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Controls() {
  const { state, actions } = useDashboard();
  const { controls, sensors, settings, timers } = state;

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      className="p-4 lg:p-6 pb-24 lg:pb-6 flex flex-col gap-4 w-full">
      <motion.div custom={0} variants={fadeUp}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Kontrol Perangkat</h2>
        <p className="text-xs text-slate-500 mt-1">Relay & PWM • Real-time Control</p>
      </motion.div>

      <motion.div custom={1} variants={fadeUp}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className={`w-2 h-2 rounded-full ${controls.relay1 ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-400'}`} />
              <div className={`w-2 h-2 rounded-full ${controls.relay2 ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-400'}`} />
              <div className={`w-2 h-2 rounded-full ${controls.fanSpeed > 0 ? 'bg-purple-400 shadow-lg shadow-purple-400/50' : 'bg-slate-400'}`} />
            </div>
            <span className="text-xs text-slate-500">{(controls.relay1 ? 1 : 0) + (controls.relay2 ? 1 : 0) + (controls.fanSpeed > 0 ? 1 : 0)} perangkat aktif</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </motion.div>

      <motion.div custom={2} variants={fadeUp}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Relay AC</h3>
        <div className="flex flex-col gap-3">
          <RelayCard device="relay1" name="Socket 1" subtitle="Relay AC · Port 1" icon={Zap}
            enabled={controls.relay1} onToggle={() => actions.toggleControl('relay1')}
            timer={timers.relay1} onSetTimer={actions.setTimer} onClearTimer={actions.clearTimer} />
          <RelayCard device="relay2" name="Lamp" subtitle="Relay AC · Port 2" icon={Zap}
            enabled={controls.relay2} onToggle={() => actions.toggleControl('relay2')}
            timer={timers.relay2} onSetTimer={actions.setTimer} onClearTimer={actions.clearTimer} />
        </div>
      </motion.div>

      <motion.div custom={3} variants={fadeUp}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Kipas Angin 5V</h3>
        <FanCard speed={controls.fanSpeed} autoMode={controls.fanAuto}
          currentTemp={sensors.suhu} targetTemp={settings.targetSuhu}
          onSpeedChange={actions.setFanSpeed} onAutoToggle={() => actions.setFanAuto(!controls.fanAuto)}
          timer={timers.fan} onSetTimer={actions.setTimer} onClearTimer={actions.clearTimer} />
      </motion.div>
    </motion.div>
  );
}