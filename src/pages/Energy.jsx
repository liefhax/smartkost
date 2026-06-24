import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDashboard } from '../context/DashboardContext';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Zap, Activity, Gauge, TrendingUp, DollarSign, 
  Clock, ChevronDown, ChevronUp
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, type: 'spring', stiffness: 280, damping: 28 },
  }),
};

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function LiveMetric({ label, value, unit, color, icon: Icon }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
          {value}
        </span>
        <span className="text-sm font-medium text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

const TooltipStyle = {
  contentStyle: {
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    fontSize: '12px',
    padding: '8px 12px',
    backdropFilter: 'blur(8px)',
  },
  labelStyle: { color: '#94a3b8', marginBottom: '4px', fontWeight: 500 },
  itemStyle: { color: '#f8fafc', fontWeight: 600, padding: 0 },
};

export default function Energy() {
  const { state } = useDashboard();
  const { sensors, settings } = state;
  const [showTable, setShowTable] = useState(false);

  // 1. Data mapping
  const powerData = {
    power: sensors.daya?.watt || 0,
    voltage: sensors.daya?.volt || 0,
    current: sensors.daya?.ampere || 0,
    apparentPower: (sensors.daya?.volt * sensors.daya?.ampere) || 1,
    frequency: 50.0,
    energy: sensors.powerHistory?.reduce((s, p) => s + (p.value * (5 / 60 / 1000)), 0) || 0
  };
  powerData.powerFactor = Math.min((powerData.power / powerData.apparentPower), 1) || 0;

  // 2. Parse History from Context
  const recentHistory = useMemo(() => {
    if (!sensors.powerHistory || sensors.powerHistory.length === 0) return [];
    return sensors.powerHistory.slice(-24).map(d => ({
      time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      watt: d.value,
      voltage: sensors.daya.volt || 220, 
      current: (d.value / (sensors.daya.volt || 220)),
    }));
  }, [sensors.powerHistory, sensors.daya.volt]);

  // 3. Averages for STABLE calculation
  const validHistory = recentHistory.filter(p => p.watt > 0);
  const avgWatt = validHistory.length > 0 ? validHistory.reduce((s, p) => s + p.watt, 0) / validHistory.length : 0;
  const peakWatt = validHistory.length > 0 ? Math.max(...validHistory.map(p => p.watt)) : 0;
  
  // Estimate logic using Average
  const cost2Hours = validHistory.reduce((s, p) => s + (p.watt * (5 / 60 / 1000)), 0) * settings.tarifPerKwh;
  const dailyEstimate = (avgWatt * 24 / 1000) * settings.tarifPerKwh;
  const monthlyEstimate = dailyEstimate * 30;

  // 4. Hourly Aggregation
  const hourlyData = useMemo(() => {
    if (recentHistory.length === 0) return [];
    return Array.from({ length: 24 }, (_, h) => {
      const pts = recentHistory.filter(p => parseInt(p.time.split(':')[0]) === h);
      const avg = pts.length > 0 ? pts.reduce((s, p) => s + p.watt, 0) / pts.length : 0;
      return { hour: `${String(h).padStart(2, '0')}:00`, watt: Math.round(avg) };
    }).filter(d => d.watt > 0);
  }, [recentHistory]);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="p-4 lg:p-6 pb-24 lg:pb-6 flex flex-col gap-4 lg:gap-6 w-full"
    >
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Energy Monitor</h2>
          <p className="text-xs font-medium text-slate-500 mt-1">PZEM-004T · Real-time & Stable Avg</p>
        </div>
      </motion.div>

      {/* Live Metrics Grid */}
      <motion.div custom={1} variants={fadeUp}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <LiveMetric label="Voltage" value={powerData.voltage.toFixed(1)} unit="V" color="#0ea5e9" icon={Zap} />
          <LiveMetric label="Current" value={powerData.current.toFixed(2)} unit="A" color="#8b5cf6" icon={Activity} />
          <LiveMetric label="Active Power" value={powerData.power.toFixed(0)} unit="W" color="#f97316" icon={Gauge} />
          <LiveMetric label="Frequency" value={powerData.frequency.toFixed(1)} unit="Hz" color="#10b981" icon={TrendingUp} />
        </div>
      </motion.div>

      {/* Power Factor + Energy Row */}
      <motion.div custom={2} variants={fadeUp}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Energy & Power Factor</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">Power Factor (PF)</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{powerData.powerFactor.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  animate={{ width: `${powerData.powerFactor * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                />
              </div>
            </div>
            <div className="text-center pl-6 border-l border-slate-200 dark:border-slate-800">
              <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {powerData.energy.toFixed(3)}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Total kWh</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Watt Area Chart */}
        <motion.div custom={3} variants={fadeUp}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-5 h-full shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Power (Recent Data)</h3>
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-1 rounded-md">
                Avg: {Math.round(avgWatt)}W
              </span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recentHistory} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="wattAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={30} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip {...TooltipStyle} formatter={(v) => [`${Number(v).toFixed(0)} W`, 'Power']} />
                  <Area type="monotone" dataKey="watt" stroke="#0ea5e9" strokeWidth={3} fill="url(#wattAreaGrad)" dot={false} activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Current & Voltage Line Chart */}
        <motion.div custom={4} variants={fadeUp}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-5 h-full shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Current & Voltage</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentHistory} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={30} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[200, 240]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={TooltipStyle.contentStyle}
                    labelStyle={TooltipStyle.labelStyle}
                    formatter={(v, name) => [
                      name === 'current' ? `${Number(v).toFixed(2)} A` : `${Number(v).toFixed(1)} V`,
                      name === 'current' ? 'Current' : 'Voltage',
                    ]}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="current" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="voltage" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 rounded-full bg-purple-500" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Current (A)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Voltage (V)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Hourly Bar Chart */}
        {hourlyData.length > 0 && (
          <motion.div custom={5} variants={fadeUp}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-5 h-full shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Hourly Average</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={20} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip {...TooltipStyle} formatter={(v) => [`${v} W`, 'Average']} />
                    <Bar dataKey="watt" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {hourlyData.map((entry, index) => (
                        <Cell key={index} fill={entry.watt > settings.overloadLimit * 0.8 ? '#ef4444' : '#0ea5e9'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cost Breakdown */}
        <motion.div custom={6} variants={fadeUp} className="h-full">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-5 h-full flex flex-col shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <DollarSign size={16} className="text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Stable Cost Estimation</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3 flex-1">
              <div className="flex flex-col justify-center text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">{formatRupiah(cost2Hours)}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Past 2 Hours</div>
              </div>
              <div className="flex flex-col justify-center text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1">{formatRupiah(dailyEstimate)}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Daily Est.</div>
              </div>
              <div className="flex flex-col justify-center text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="text-sm font-bold text-blue-600 dark:text-cyan-400 mb-1">{formatRupiah(monthlyEstimate)}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Monthly Est.</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tariff: <span className="text-slate-900 dark:text-slate-300">{formatRupiah(settings.tarifPerKwh)}/kWh</span></span>
              <span className="text-xs font-medium text-slate-500">Peak Load: <span className="text-red-500">{Math.round(peakWatt)}W</span></span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 5-Min Data Table */}
      <motion.div custom={7} variants={fadeUp}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] overflow-hidden shadow-sm">
          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Clock size={16} className="text-slate-500" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Recent Data Log</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                {recentHistory.length} records
              </span>
            </div>
            {showTable ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>

          {showTable && (
            <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left py-3 px-5 font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                    <th className="text-right py-3 px-5 font-semibold text-slate-500 uppercase tracking-wider">Power (W)</th>
                    <th className="text-right py-3 px-5 font-semibold text-slate-500 uppercase tracking-wider">Current (A)</th>
                    <th className="text-right py-3 px-5 font-semibold text-slate-500 uppercase tracking-wider">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...recentHistory].reverse().map((pt, i) => {
                    const ptCost = (pt.watt * (5 / 60 / 1000)) * settings.tarifPerKwh;
                    const isHigh = pt.watt > settings.overloadLimit * 0.8;
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-5 text-slate-600 dark:text-slate-300 font-medium">{pt.time}</td>
                        <td className={`text-right py-3 px-5 font-bold ${isHigh ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                          {pt.watt.toFixed(0)} W
                        </td>
                        <td className="text-right py-3 px-5 text-slate-600 dark:text-slate-300 font-medium">{pt.current.toFixed(2)} A</td>
                        <td className="text-right py-3 px-5 text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(ptCost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}