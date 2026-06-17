import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Zap, Calendar, Clock } from 'lucide-react';

export default function EnergyCost({ currentWatt, tariff = 1444.70 }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Kalkulasi lengkap
  const kwhPerSecond = currentWatt / 1000 / 3600;
  const kwhPerMinute = currentWatt / 1000 / 60;
  const kwhPerHour = currentWatt / 1000;
  const kwhPerDay = kwhPerHour * 24;
  const kwhPerMonth = kwhPerDay * 30;
  const kwhPerYear = kwhPerDay * 365;
  
  const costPerMinute = kwhPerMinute * tariff;
  const costPerHour = kwhPerHour * tariff;
  const costPerDay = kwhPerDay * tariff;
  const costPerMonth = kwhPerMonth * tariff;
  const costPerYear = kwhPerYear * tariff;

  const periods = [
    { label: 'Per Minute', kwh: kwhPerMinute.toFixed(4), cost: costPerMinute, icon: Clock, color: 'slate' },
    { label: 'Per Hour', kwh: kwhPerHour.toFixed(2), cost: costPerHour, icon: TrendingUp, color: 'blue' },
    { label: 'Per Day', kwh: kwhPerDay.toFixed(1), cost: costPerDay, icon: Calendar, color: 'emerald' },
    { label: 'Per Month', kwh: kwhPerMonth.toFixed(0), cost: costPerMonth, icon: DollarSign, color: 'purple' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-500/20 dark:to-green-500/20 rounded-xl">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Cost Calculator</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Based on current usage</p>
          </div>
        </div>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-[10px] text-cyan-500 hover:text-cyan-400 transition-colors"
        >
          {showBreakdown ? 'Simple' : 'Detail'}
        </button>
      </div>

      {/* Main Cost Display */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 mb-4 text-white shadow-lg shadow-emerald-500/25">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-5 -mb-5" />
        
        <div className="relative">
          <p className="text-xs font-medium text-emerald-100 mb-2">ESTIMATED MONTHLY COST</p>
          <p className="text-4xl font-bold">Rp {costPerMonth.toLocaleString('id-ID')}</p>
          <div className="flex items-center gap-2 mt-3">
            <Zap className="w-4 h-4 text-emerald-200" />
            <p className="text-xs text-emerald-100">{kwhPerMonth.toFixed(0)} kWh/month</p>
          </div>
        </div>
      </div>

      {/* Period Breakdown */}
      <div className="space-y-2">
        {periods.map((period, i) => (
          <div 
            key={i}
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg bg-${period.color}-100 dark:bg-${period.color}-500/20 group-hover:scale-110 transition-transform`}>
                <period.icon className={`w-3.5 h-3.5 text-${period.color}-500`} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{period.label}</p>
                {showBreakdown && (
                  <p className="text-[10px] text-slate-500">{period.kwh} kWh</p>
                )}
              </div>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Rp {period.cost.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            </p>
          </div>
        ))}
      </div>

      {/* Yearly Projection */}
      {showBreakdown && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl border border-purple-200 dark:border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Yearly Projection</p>
                <p className="text-[10px] text-slate-500">{kwhPerYear.toFixed(0)} kWh</p>
              </div>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                Rp {costPerYear.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tariff Info */}
      <div className="mt-3 text-center">
        <p className="text-[10px] text-slate-400">
          Tariff: Rp {tariff.toLocaleString('id-ID')}/kWh
        </p>
      </div>
    </div>
  );
}