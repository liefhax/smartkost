import { useDashboard } from '../context/DashboardContext';
import EnergyChart from '../components/dashboard/EnergyChart';
import EnergyCost from '../components/dashboard/EnergyCost';
import { Zap, TrendingUp, DollarSign, Calendar, BarChart3, Gauge, Activity, RefreshCw } from 'lucide-react';

export default function Energy() {
  const { state } = useDashboard();
  const { sensors, settings } = state;

  // Kalkulasi
  const kwhNow = sensors.daya.watt / 1000;
  const costPerHour = kwhNow * settings.tarifPerKwh;
  const costPerDay = costPerHour * 24;
  const costPerMonth = costPerDay * 30;
  
  const percentage = (sensors.daya.watt / settings.overloadLimit) * 100;
  const isOverload = percentage > 100;

  // Ambil data real dari powerHistory MQTT
  const realTimeData = sensors.powerHistory?.length > 0 
    ? sensors.powerHistory.map(d => ({
        timestamp: d.timestamp,
        hour: new Date(d.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        value: d.value,
      }))
    : [];

  // Average from history
  const validPowerData = sensors.powerHistory?.filter(d => d.value > 0) || [];
  const avgWatt = validPowerData.length > 0
    ? validPowerData.reduce((sum, d) => sum + d.value, 0) / validPowerData.length
    : 0;
  const peakWatt = validPowerData.length > 0
    ? Math.max(...validPowerData.map(d => d.value))
    : 0;

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Energy Monitor</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time power consumption & cost analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${isOverload ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {isOverload ? 'Overload!' : 'Live'}
            </span>
          </div>
        </div>
      </div>

      {/* Top Stats Cards - REAL DATA */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl -mr-5 -mt-5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] font-medium text-slate-500 uppercase">Real-time</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{sensors.daya.watt}</p>
            <p className="text-xs text-slate-500 mt-1">Watt</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl -mr-5 -mt-5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px] font-medium text-slate-500 uppercase">Average</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{avgWatt.toFixed(0)}</p>
            <p className="text-xs text-slate-500 mt-1">Watt (avg)</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl -mr-5 -mt-5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-[11px] font-medium text-slate-500 uppercase">Peak</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{peakWatt}</p>
            <p className="text-xs text-slate-500 mt-1">Watt (max)</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-xl -mr-5 -mt-5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-red-500" />
              <span className="text-[11px] font-medium text-slate-500 uppercase">Daily Cost</span>
            </div>
            <p className="text-3xl font-bold text-red-500">Rp {costPerDay.toLocaleString('id-ID')}</p>
            <p className="text-xs text-slate-500 mt-1">Estimate</p>
          </div>
        </div>
      </div>

      {/* Chart - PAKE REAL DATA DARI MQTT */}
      <EnergyChart data={realTimeData} />

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <EnergyCost currentWatt={sensors.daya.watt} tariff={settings.tarifPerKwh} />
        
        {/* Monthly Projection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl transition-all">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Projection</h3>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">Monthly Energy</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {(kwhNow * 720).toFixed(0)} kWh
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Monthly Cost</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  Rp {costPerMonth.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl text-center">
                <p className="text-[10px] text-slate-500 mb-1">kWh Now</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{kwhNow.toFixed(3)}</p>
                <p className="text-[10px] text-slate-400">kilowatt-hour</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl text-center">
                <p className="text-[10px] text-slate-500 mb-1">Per Minute</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">Rp {(costPerHour / 60).toFixed(1)}</p>
                <p className="text-[10px] text-slate-400">cost</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}