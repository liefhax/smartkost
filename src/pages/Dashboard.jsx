import { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import useWeather from '../hooks/useWeather'; 
import {
  Thermometer, Droplets, Shield, Activity, Zap, AlertTriangle,
  Clock, MapPin, CloudSun, TrendingDown, 
  BarChart3, Gauge, DollarSign, Maximize2, Timer
} from 'lucide-react';

// ==================== WELCOME BANNER ====================
function WelcomeBanner() {
  const [time, setTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [bounce, setBounce] = useState(false);
  const { temp, loading } = useWeather();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setBounce(prev => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = time.getHours();
    if (hour < 11) setGreeting('Selamat Pagi');
    else if (hour < 15) setGreeting('Selamat Siang');
    else if (hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');
  }, [time]);

  return (
    <div className="relative w-full overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-[2rem] p-6 lg:p-8 text-white shadow-xl border border-slate-800">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[50%] -right-[10%] w-[80%] h-[150%] bg-gradient-to-b from-cyan-500/10 to-blue-600/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-[50%] -left-[10%] w-[60%] h-[120%] bg-gradient-to-t from-indigo-500/10 to-purple-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-cyan-300">{greeting}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">SmartKost Area</p>
            </div>
          </div>
          <div className="font-sans">
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl lg:text-6xl font-bold tracking-tighter text-white transition-transform duration-300 ${bounce ? 'scale-[1.02]' : 'scale-100'}`}>
                {time.getHours().toString().padStart(2, '0')}
              </span>
              <span className={`text-4xl lg:text-5xl font-medium text-cyan-400 mx-1 transition-opacity duration-500 ${bounce ? 'opacity-40' : 'opacity-100'}`}>:</span>
              <span className={`text-5xl lg:text-6xl font-bold tracking-tighter text-white transition-transform duration-300 ${bounce ? 'scale-[1.02]' : 'scale-100'}`}>
                {time.getMinutes().toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors w-full sm:w-auto">
          <CloudSun className="w-10 h-10 text-amber-400" />
          <div>
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <p className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">Sukabumi</p>
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-white/10 rounded-lg animate-pulse mt-1" />
            ) : temp !== null ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{temp}</span>
                <span className="text-sm text-cyan-400 font-medium">°C</span>
              </div>
            ) : (
              <p className="text-lg text-slate-400">--°C</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SENSOR CARD ====================
function SensorCard({ icon: Icon, label, value, unit, color, min, max, avg, status }) {
  const [pulseValue, setPulseValue] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setPulseValue(true);
      const timer = setTimeout(() => setPulseValue(false), 800);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const schemes = {
    orange: { 
      text: 'text-orange-500 dark:text-orange-400', 
      iconBg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
      bar: 'from-orange-400 to-red-500',
    },
    blue: { 
      text: 'text-blue-500 dark:text-cyan-400', 
      iconBg: 'bg-blue-50 dark:bg-cyan-500/10 border-blue-200 dark:border-cyan-500/20',
      bar: 'from-cyan-400 to-blue-500',
    },
    emerald: { 
      text: 'text-emerald-500 dark:text-emerald-400', 
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
      bar: 'from-emerald-400 to-green-500',
    },
    red: { 
      text: 'text-red-500 dark:text-red-400', 
      iconBg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
      bar: 'from-red-400 to-rose-500',
    },
    amber: { 
      text: 'text-amber-500 dark:text-amber-400', 
      iconBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
      bar: 'from-amber-400 to-yellow-500',
    },
  };
  const scheme = schemes[color] || schemes.blue;

  return (
    <div className="w-full group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
          <div className={`p-2.5 rounded-xl border ${scheme.iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className={`w-4 h-4 ${scheme.text}`} />
          </div>
        </div>
        
        <div className={`flex items-baseline gap-1.5 transition-transform duration-300 ${pulseValue ? 'scale-105' : ''}`}>
          <span className={`text-4xl font-bold text-slate-900 dark:text-white tracking-tight ${pulseValue ? scheme.text : ''}`}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
        </div>

        <div className="mt-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${scheme.bar} rounded-full transition-all duration-700 ease-out`}
                style={{ width: status === 'normal' ? '100%' : status === 'warning' ? '60%' : '30%' }} 
              />
            </div>
            <span className={`text-[9px] font-bold px-2 py-1 rounded-md tracking-wider uppercase ${
              status === 'normal' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 
              status === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' : 
              'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
            }`}>
              {status === 'normal' ? 'Normal' : status === 'warning' ? 'Warning' : 'Alert'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
              <TrendingDown className="w-3 h-3 text-cyan-500" />
              <span>Min</span>
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {min !== null && min !== undefined ? (typeof min === 'number' ? min.toFixed(1) : min) : '--'}
            </p>
          </div>
          <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
              <Maximize2 className="w-3 h-3 text-rose-500" />
              <span>Max</span>
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {max !== null && max !== undefined ? (typeof max === 'number' ? max.toFixed(1) : max) : '--'}
            </p>
          </div>
          <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
              <Gauge className="w-3 h-3 text-purple-500" />
              <span>Avg</span>
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {avg !== null && avg !== undefined ? (typeof avg === 'number' ? avg.toFixed(1) : avg) : '--'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== REALTIME CHART ====================
function RealtimeChart({ data, color }) {
  const canvasRef = useRef(null);
  const maxValue = useRef(0);
  
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 10, right: 10, bottom: 20, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const values = data.map(d => d.value);
    const currentMax = Math.max(...values, 1);
    maxValue.current = Math.max(maxValue.current, currentMax * 1.1);
    const yMax = maxValue.current;
    
    ctx.clearRect(0, 0, width, height);

    if (data.length > 1) {
      const lineGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      lineGradient.addColorStop(0, '#06b6d4'); 
      lineGradient.addColorStop(0.5, '#3b82f6'); 
      lineGradient.addColorStop(1, '#8b5cf6'); 
      
      ctx.beginPath();
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      data.forEach((point, i) => {
        const x = padding.left + (chartWidth / (data.length - 1 || 1)) * i;
        const y = padding.top + chartHeight - (point.value / yMax) * chartHeight;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.closePath();
      
      const fillGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      fillGradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
      fillGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
      fillGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = fillGradient;
      ctx.fill();
      
      const lastPoint = data[data.length - 1];
      const lx = padding.left + chartWidth;
      const ly = padding.top + chartHeight - (lastPoint.value / yMax) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 animate-pulse" />
          <p className="text-xs text-slate-400">Menunggu data sensor...</p>
        </div>
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full drop-shadow-xl"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ==================== POWER MONITOR (UPDATED) ====================
function PowerMonitor({ data, limit, history, controls, timers, sensors, settings }) {
  const percentage = Math.min((data.watt / limit) * 100, 100);
  const isOverload = data.watt > limit;
  const prevWatt = useRef(data.watt);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (prevWatt.current !== data.watt) {
      setChanged(true);
      const t = setTimeout(() => setChanged(false), 600);
      prevWatt.current = data.watt;
      return () => clearTimeout(t);
    }
  }, [data.watt]);

  // Timer countdown helper
  const getTimerRemaining = (device) => {
    const timer = timers?.[device];
    if (!timer?.active || !timer?.endTime) return null;
    const remaining = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
    if (remaining <= 0) return null;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const relay1Timer = getTimerRemaining('relay1');
  const relay2Timer = getTimerRemaining('relay2');
  const fanTimer = getTimerRemaining('fan');
  const fanSpeedPercent = Math.round(((controls?.fanSpeed || 0) / 255) * 100);

  return (
    <div className={`relative w-full bg-white dark:bg-slate-900 border rounded-[2rem] p-6 lg:p-8 transition-all duration-500 overflow-hidden ${
      isOverload ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 'border-slate-200 dark:border-slate-800 shadow-sm'
    }`}>
      
      {isOverload && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-600/5 animate-pulse pointer-events-none" />
      )}

      <div className="relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-start w-full">
        {/* Left Column: Stats & Progress */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl border ${isOverload ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-500' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-500'}`}>
                <Zap className={`w-6 h-6 ${isOverload ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Konsumsi Listrik</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Real-time Monitor • PZEM-004T</p>
              </div>
            </div>
            {isOverload && (
              <div className="px-4 py-1.5 bg-red-500 text-white text-[11px] font-bold rounded-lg animate-pulse flex items-center gap-1.5 shadow-lg shadow-red-500/30">
                <AlertTriangle className="w-4 h-4" />
                OVERLOAD
              </div>
            )}
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <p className="text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wider">Wattage</p>
              <div className="flex items-baseline gap-1">
                <p className={`text-3xl font-bold tracking-tight transition-all duration-300 ${isOverload ? 'text-red-500' : 'text-slate-900 dark:text-white'} ${changed ? 'scale-110 text-cyan-500' : ''}`}>{data.watt}</p>
                <span className="text-xs text-slate-400 font-medium">W</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <p className="text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wider">Voltage</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{data.volt}</p>
                <span className="text-xs text-slate-400 font-medium">V</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <p className="text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wider">Current</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{data.ampere}</p>
                <span className="text-xs text-slate-400 font-medium">A</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-medium text-slate-500">0 W</span>
              <div className="text-center">
                <span className={`text-lg font-bold ${isOverload ? 'text-red-500' : 'text-cyan-500 dark:text-cyan-400'}`}>{percentage.toFixed(0)}%</span>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Load</p>
              </div>
              <span className="text-xs font-medium text-slate-500">Limit: {limit} W</span>
            </div>
            <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${isOverload ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-500' : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500'}`}
                style={{ width: `${Math.min(percentage, 100)}%` }} />
              {!isOverload && (
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              )}
            </div>
          </div>

          {/* ==================== RELAY & FAN STATUS BARU ==================== */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Status Perangkat</h4>
            <div className="grid grid-cols-3 gap-3">
              {/* Socket 1 */}
              <div className={`p-3 rounded-xl border transition-all ${controls?.relay1 ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${controls?.relay1 ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-400'}`} />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Socket 1</span>
                </div>
                <p className={`text-xs font-bold ${controls?.relay1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                  {controls?.relay1 ? 'ON' : 'OFF'}
                </p>
                {relay1Timer && (
                  <div className="flex items-center gap-1 mt-1">
                    <Timer size={10} className="text-cyan-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-cyan-500 font-mono">{relay1Timer}</span>
                  </div>
                )}
              </div>

              {/* Socket 2 / Lamp */}
              <div className={`p-3 rounded-xl border transition-all ${controls?.relay2 ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${controls?.relay2 ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-400'}`} />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Lamp</span>
                </div>
                <p className={`text-xs font-bold ${controls?.relay2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                  {controls?.relay2 ? 'ON' : 'OFF'}
                </p>
                {relay2Timer && (
                  <div className="flex items-center gap-1 mt-1">
                    <Timer size={10} className="text-cyan-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-cyan-500 font-mono">{relay2Timer}</span>
                  </div>
                )}
              </div>

              {/* Fan */}
              <div className={`p-3 rounded-xl border transition-all ${(controls?.fanSpeed || 0) > 0 ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${(controls?.fanSpeed || 0) > 0 ? 'bg-purple-400 shadow-lg shadow-purple-400/50' : 'bg-slate-400'}`} />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Fan</span>
                </div>
                <p className={`text-xs font-bold ${(controls?.fanSpeed || 0) > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}>
                  {controls?.fanAuto ? 'AUTO' : `${fanSpeedPercent}%`}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  {controls?.fanAuto ? `Target: ${settings?.targetSuhu || 26}°C` : `Speed: ${controls?.fanSpeed || 0}/255`}
                </p>
                {fanTimer && (
                  <div className="flex items-center gap-1 mt-1">
                    <Timer size={10} className="text-cyan-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-cyan-500 font-mono">{fanTimer}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chart & Info */}
        <div className="flex flex-col h-full justify-between gap-6 w-full">
          <div className="h-40 lg:h-48 w-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-2 relative">
            <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Live Graph</span>
            </div>
            <RealtimeChart data={history} color="cyan" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Est. Biaya Harian</p>
              </div>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                Rp {((data.watt / 1000) * 24 * 1444.70).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <p className="text-[11px] font-semibold text-blue-800 dark:text-cyan-300 uppercase tracking-wider">Pemakaian (kWh)</p>
              </div>
              <p className="text-xl font-bold text-blue-700 dark:text-cyan-400">
                {(data.watt / 1000).toFixed(3)} <span className="text-sm font-medium opacity-70">kWh</span>
              </p>
            </div>
          </div>

          {/* Suhu & Kelembaban Quick Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center gap-2">
              <Thermometer size={16} className="text-orange-500" />
              <div>
                <p className="text-[10px] text-slate-500">Suhu Ruangan</p>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{sensors?.suhu || 0}°C</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center gap-2">
              <Droplets size={16} className="text-blue-500" />
              <div>
                <p className="text-[10px] text-slate-500">Kelembaban</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{sensors?.kelembaban || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN DASHBOARD ====================
export default function Dashboard() {
  const { state } = useDashboard();
  const { sensors, settings, controls, timers } = state;

  const suhuAvg = sensors.suhuHistory?.length > 0 
    ? (sensors.suhuHistory.reduce((s, d) => s + d.value, 0) / sensors.suhuHistory.length) 
    : null;

  return (
    <div className="w-full p-4 lg:p-6 space-y-4 lg:space-y-6 pb-24 lg:pb-6">
      
      <WelcomeBanner />

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 w-full">
        <SensorCard
          icon={Thermometer}
          label="Temperature"
          value={sensors.suhu}
          unit="°C"
          color="orange"
          min={sensors.suhuMin}
          max={sensors.suhuMax}
          avg={suhuAvg}
          status={sensors.suhu > 30 ? 'warning' : 'normal'}
        />
        <SensorCard
          icon={Droplets}
          label="Humidity"
          value={sensors.kelembaban}
          unit="%"
          color="blue"
          min={sensors.kelembabanMin}
          max={sensors.kelembabanMax}
          avg={null}
          status={sensors.kelembaban > 70 ? 'warning' : 'normal'}
        />
        <SensorCard
          icon={Shield}
          label="Air Quality"
          value={sensors.gas ? 'Safe' : 'Alert'}
          color={sensors.gas ? 'emerald' : 'red'}
          min="OK"
          max="Alert"
          avg={null}
          status={sensors.gas ? 'normal' : 'critical'}
        />
        <SensorCard
          icon={Activity}
          label="Security"
          value={sensors.gerak ? 'Motion' : 'Clear'}
          color={sensors.gerak ? 'amber' : 'emerald'}
          min="Clear"
          max="Motion"
          avg={null}
          status={sensors.gerak ? 'warning' : 'normal'}
        />
      </div>

      {/* Premium Power Monitor dengan Relay Status */}
      <PowerMonitor 
        data={sensors.daya} 
        limit={settings.overloadLimit} 
        history={sensors.powerHistory}
        controls={controls}
        timers={timers}
        sensors={sensors}
        settings={settings}
      />
    </div>
  );
}