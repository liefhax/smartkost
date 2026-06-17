import { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import useWeather from '../hooks/useWeather';
import {
  Thermometer, Droplets, Shield, Activity, Zap, AlertTriangle,
  Clock, MapPin, CloudSun, TrendingUp, TrendingDown, 
  BarChart3, Gauge, DollarSign, Maximize2
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
    if (hour < 12) setGreeting('Selamat Pagi');
    else if (hour < 15) setGreeting('Selamat Siang');
    else if (hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');
  }, [time]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 rounded-3xl p-5 lg:p-6 text-white shadow-2xl">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl -ml-10 -mb-10 animate-pulse delay-1000" />
      </div>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-cyan-300">{greeting}</p>
              <p className="text-xs text-slate-400">SmartKost System v1.0</p>
            </div>
          </div>
          <div className="font-mono">
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl lg:text-6xl font-bold tracking-tighter bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent transition-all ${bounce ? 'scale-105' : ''}`}>
                {time.getHours().toString().padStart(2, '0')}
              </span>
              <span className={`text-4xl lg:text-5xl font-bold text-cyan-400 transition-all ${bounce ? 'opacity-50' : 'opacity-100'}`}>:</span>
              <span className={`text-5xl lg:text-6xl font-bold tracking-tighter bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent transition-all ${bounce ? 'scale-105' : ''}`}>
                {time.getMinutes().toString().padStart(2, '0')}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-2 capitalize">
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all hover:scale-105">
          <CloudSun className="w-12 h-12 text-amber-400" />
          <div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs text-slate-300">Sukabumi</p>
            </div>
            {loading ? (
              <div className="h-10 w-20 bg-white/20 rounded-lg animate-pulse mt-1" />
            ) : temp !== null ? (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{temp}</span>
                <span className="text-lg text-slate-400">°C</span>
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

// ==================== SENSOR CARD (SIMPLE) ====================
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
      bg: 'bg-orange-50 dark:bg-orange-500/10', 
      text: 'text-orange-600 dark:text-orange-400', 
      iconBg: 'bg-orange-100 dark:bg-orange-500/20',
      bar: 'from-orange-400 to-red-500',
      glow: 'hover:shadow-orange-500/10 hover:border-orange-300/50',
    },
    blue: { 
      bg: 'bg-blue-50 dark:bg-blue-500/10', 
      text: 'text-blue-600 dark:text-blue-400', 
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      bar: 'from-blue-400 to-cyan-500',
      glow: 'hover:shadow-blue-500/10 hover:border-blue-300/50',
    },
    emerald: { 
      bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
      text: 'text-emerald-600 dark:text-emerald-400', 
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      bar: 'from-emerald-400 to-green-500',
      glow: 'hover:shadow-emerald-500/10 hover:border-emerald-300/50',
    },
    red: { 
      bg: 'bg-red-50 dark:bg-red-500/10', 
      text: 'text-red-600 dark:text-red-400', 
      iconBg: 'bg-red-100 dark:bg-red-500/20',
      bar: 'from-red-400 to-orange-500',
      glow: 'hover:shadow-red-500/10 hover:border-red-300/50',
    },
    amber: { 
      bg: 'bg-amber-50 dark:bg-amber-500/10', 
      text: 'text-amber-600 dark:text-amber-400', 
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      bar: 'from-amber-400 to-yellow-500',
      glow: 'hover:shadow-amber-500/10 hover:border-amber-300/50',
    },
  };
  const scheme = schemes[color];

  return (
    <div className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${scheme.glow} overflow-hidden`}>
      {/* Glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${scheme.bar} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          <div className={`p-2 rounded-xl ${scheme.iconBg} group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
            <Icon className={`w-4 h-4 ${scheme.text}`} />
          </div>
        </div>
        
        {/* Value */}
        <div className={`flex items-baseline gap-1 transition-all duration-300 ${pulseValue ? 'scale-110' : ''}`}>
          <span className={`text-3xl font-bold bg-gradient-to-r ${scheme.bar} bg-clip-text text-transparent ${pulseValue ? 'animate-pulse' : ''}`}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          {unit && <span className="text-sm text-slate-400">{unit}</span>}
        </div>

        {/* Status Bar */}
        <div className="mt-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${scheme.bar} rounded-full transition-all duration-700 ease-in-out`}
                style={{ width: status === 'normal' ? '100%' : status === 'warning' ? '60%' : '30%' }} 
              />
            </div>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              status === 'normal' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 
              status === 'warning' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' : 
              'bg-red-100 dark:bg-red-500/20 text-red-600'
            }`}>
              {status === 'normal' ? 'OK' : status === 'warning' ? 'WARN' : 'ALERT'}
            </span>
          </div>
        </div>

        {/* Min / Max / Avg */}
        <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-center p-1.5 bg-slate-50 dark:bg-slate-800/30 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <div className="flex items-center justify-center gap-0.5 text-[9px] text-slate-400 mb-0.5">
              <TrendingDown className="w-2.5 h-2.5 text-blue-400" />
              <span>Min</span>
            </div>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {min !== null && min !== undefined ? (typeof min === 'number' ? min.toFixed(1) : min) : '--'}
              {typeof min === 'number' && unit && <span className="text-[9px] text-slate-400 ml-0.5">{unit}</span>}
            </p>
          </div>
          <div className="text-center p-1.5 bg-slate-50 dark:bg-slate-800/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <div className="flex items-center justify-center gap-0.5 text-[9px] text-slate-400 mb-0.5">
              <Maximize2 className="w-2.5 h-2.5 text-red-400" />
              <span>Max</span>
            </div>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {max !== null && max !== undefined ? (typeof max === 'number' ? max.toFixed(1) : max) : '--'}
              {typeof max === 'number' && unit && <span className="text-[9px] text-slate-400 ml-0.5">{unit}</span>}
            </p>
          </div>
          <div className="text-center p-1.5 bg-slate-50 dark:bg-slate-800/30 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors">
            <div className="flex items-center justify-center gap-0.5 text-[9px] text-slate-400 mb-0.5">
              <Gauge className="w-2.5 h-2.5 text-purple-400" />
              <span>Avg</span>
            </div>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {avg !== null && avg !== undefined ? (typeof avg === 'number' ? avg.toFixed(1) : avg) : '--'}
              {typeof avg === 'number' && unit && <span className="text-[9px] text-slate-400 ml-0.5">{unit}</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== REALTIME CHART (WARNA GRADIEN) ====================
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
    const padding = { top: 5, right: 5, bottom: 15, left: 5 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const values = data.map(d => d.value);
    const currentMax = Math.max(...values, 1);
    maxValue.current = Math.max(maxValue.current, currentMax * 1.1);
    const yMax = maxValue.current;
    
    ctx.clearRect(0, 0, width, height);
    
    // Gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
    bgGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    if (data.length > 1) {
      // Gradient line
      const lineGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      lineGradient.addColorStop(0, '#06b6d4');
      lineGradient.addColorStop(0.5, '#3b82f6');
      lineGradient.addColorStop(1, '#8b5cf6');
      
      ctx.beginPath();
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      data.forEach((point, i) => {
        const x = padding.left + (chartWidth / (data.length - 1 || 1)) * i;
        const y = padding.top + chartHeight - (point.value / yMax) * chartHeight;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      // Fill gradient
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.closePath();
      
      const fillGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      fillGradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
      fillGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
      fillGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = fillGradient;
      ctx.fill();
      
      // Glow dot at the end
      const lastPoint = data[data.length - 1];
      const lx = padding.left + chartWidth;
      const ly = padding.top + chartHeight - (lastPoint.value / yMax) * chartHeight;
      
      // Outer glow
      const glowGradient = ctx.createRadialGradient(lx, ly, 0, lx, ly, 12);
      glowGradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
      glowGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.3)');
      glowGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.beginPath();
      ctx.arc(lx, ly, 12, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      // Inner dot
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 animate-pulse" />
          <p className="text-xs text-slate-400">Waiting for data...</p>
        </div>
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ==================== POWER MONITOR (SIMPLE UNTUK DASHBOARD) ====================
function PowerMonitor({ data, limit, history }) {
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

  return (
    <div className={`relative bg-white dark:bg-slate-900 border rounded-2xl p-5 transition-all hover:shadow-xl group overflow-hidden ${
      isOverload ? 'border-red-300 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5' : 'border-slate-200 dark:border-slate-800'
    }`}>
      {isOverload && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 animate-pulse" />
      )}

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isOverload ? 'bg-red-100 dark:bg-red-500/20' : 'bg-amber-100 dark:bg-amber-500/10'}`}>
              <Zap className={`w-5 h-5 ${isOverload ? 'text-red-500 animate-bounce' : 'text-amber-500 group-hover:animate-pulse'}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Power Monitor</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time • PZEM-004T</p>
            </div>
          </div>
          {isOverload && (
            <div className="px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-bounce flex items-center gap-1 shadow-lg shadow-red-500/25">
              <AlertTriangle className="w-3 h-3" />
              OVERLOAD
            </div>
          )}
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <p className="text-[10px] text-slate-500 mb-1">Wattage</p>
            <p className={`text-xl font-bold transition-all duration-300 ${isOverload ? 'text-red-500' : 'text-slate-900 dark:text-white'} ${changed ? 'scale-125 text-cyan-400' : ''}`}>
              {data.watt}
            </p>
            <p className="text-[10px] text-slate-400">Watt</p>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <p className="text-[10px] text-slate-500 mb-1">Voltage</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{data.volt}</p>
            <p className="text-[10px] text-slate-400">Volt</p>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <p className="text-[10px] text-slate-500 mb-1">Current</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{data.ampere}</p>
            <p className="text-[10px] text-slate-400">Ampere</p>
          </div>
        </div>

        {/* Progress Bar dengan Glow */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-slate-500">0 W</span>
            <span className={`font-bold ${isOverload ? 'text-red-500' : 'text-cyan-600 dark:text-cyan-400'}`}>
              {percentage.toFixed(0)}%
            </span>
            <span className="text-slate-500">{limit} W</span>
          </div>
          <div className="relative h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-in-out ${
                isOverload 
                  ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse' 
                  : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
            {/* Glow effect */}
            {!isOverload && (
              <div 
                className="absolute top-0 h-full bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent w-20 animate-shimmer"
                style={{ left: `${Math.min(percentage, 100) - 10}%` }}
              />
            )}
          </div>
        </div>

        {/* Realtime Chart */}
        <div className="h-32 mb-3 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-800/10 border border-slate-100 dark:border-slate-700/30">
          <RealtimeChart data={history} color="cyan" />
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-500/5 dark:to-green-500/5 rounded-lg border border-emerald-100 dark:border-emerald-500/10">
            <p className="text-[9px] text-slate-500">Est. Daily Cost</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Rp {((data.watt / 1000) * 24 * 1444.70).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/5 dark:to-cyan-500/5 rounded-lg border border-blue-100 dark:border-blue-500/10">
            <p className="text-[9px] text-slate-500">kWh Now</p>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {(data.watt / 1000).toFixed(3)} kWh
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN DASHBOARD ====================
export default function Dashboard() {
  const { state } = useDashboard();
  const { sensors, settings } = state;

  // Hitung average
  const suhuAvg = sensors.suhuHistory?.length > 0 
    ? (sensors.suhuHistory.reduce((s, d) => s + d.value, 0) / sensors.suhuHistory.length) 
    : null;

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <WelcomeBanner />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-medium text-slate-500 uppercase">Power</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{sensors.daya.watt} W</p>
          <p className="text-[10px] text-slate-500 mt-1">Real-time</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-blue-500" />
            <span className="text-[11px] font-medium text-slate-500 uppercase">Voltage</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{sensors.daya.volt} V</p>
          <p className="text-[10px] text-slate-500 mt-1">Stable</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-medium text-slate-500 uppercase">Daily Cost</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            Rp {((sensors.daya.watt / 1000) * 24 * settings.tarifPerKwh).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Estimate</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span className="text-[11px] font-medium text-slate-500 uppercase">Limit</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{settings.overloadLimit} W</p>
          <p className="text-[10px] text-slate-500 mt-1">Protection</p>
        </div>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
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

      {/* Power Monitor */}
      <PowerMonitor 
        data={sensors.daya} 
        limit={settings.overloadLimit} 
        history={sensors.powerHistory}
      />
    </div>
  );
}