import { useState, useEffect, useRef } from 'react';
import { BarChart3 } from 'lucide-react';

export default function EnergyChart({ data: realData }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  // Kalo ada real data, pake real data. Kalo ga ada, chart kosong aja (jangan dummy)
  const chartData = realData && realData.length > 1 
    ? realData.map(d => ({
        timestamp: d.timestamp || Date.now(),
        hour: d.hour || new Date(d.timestamp).getHours().toString().padStart(2, '0') + ':00',
        watt: d.value || d.avg_wattage || 0,
        cost: ((d.value || d.avg_wattage || 0) / 1000) * 1444.70,
      }))
    : [];

  const hasData = chartData.length > 0;

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !hasData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const values = chartData.map(d => d.watt).filter(v => v > 0);
    const maxWatt = values.length > 0 ? Math.max(...values, 1) * 1.2 : 100;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(6, 182, 212, 0.03)');
    bgGradient.addColorStop(1, 'rgba(139, 92, 246, 0.03)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Grid horizontal
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      const value = maxWatt - (maxWatt / gridLines) * i;
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.strokeStyle = i === 0 ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(value) + 'W', padding.left - 10, y + 3);
    }
    
    // X-axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    if (chartData.length <= 6) {
      chartData.forEach((d, i) => {
        const x = padding.left + (chartWidth / (chartData.length - 1 || 1)) * i;
        ctx.fillText(d.hour, x, height - padding.bottom + 20);
      });
    } else {
      const step = Math.max(1, Math.floor(chartData.length / 6));
      for (let i = 0; i < chartData.length; i += step) {
        const x = padding.left + (chartWidth / (chartData.length - 1)) * i;
        ctx.fillText(chartData[i].hour, x, height - padding.bottom + 20);
      }
    }
    
    // Draw bars
    const barWidth = Math.max((chartWidth / chartData.length) * 0.7, 3);
    
    chartData.forEach((point, i) => {
      if (point.watt <= 0) return;
      
      const x = padding.left + (chartWidth / (chartData.length - 1 || 1)) * i - barWidth / 2;
      const barHeight = (point.watt / maxWatt) * chartHeight;
      const y = padding.top + chartHeight - barHeight;
      
      // Bar gradient
      const barGradient = ctx.createLinearGradient(x, y, x, padding.top + chartHeight);
      barGradient.addColorStop(0, '#06b6d4');
      barGradient.addColorStop(0.5, '#3b82f6');
      barGradient.addColorStop(1, '#8b5cf6');
      
      const radius = Math.min(barWidth / 2, 4);
      
      ctx.beginPath();
      ctx.moveTo(x, padding.top + chartHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, padding.top + chartHeight);
      ctx.closePath();
      
      ctx.fillStyle = barGradient;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    
    // Draw line chart overlay
    if (chartData.length > 1) {
      ctx.beginPath();
      const lineGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      lineGradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
      lineGradient.addColorStop(1, 'rgba(139, 92, 246, 0.8)');
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.setLineDash([4, 4]);
      
      let firstPoint = true;
      chartData.forEach((point, i) => {
        if (point.watt <= 0) return;
        const x = padding.left + (chartWidth / (chartData.length - 1 || 1)) * i;
        const y = padding.top + chartHeight - (point.watt / maxWatt) * chartHeight;
        
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Last point dot (cari point terakhir yang > 0)
      let lastValidPoint = null;
      let lastValidIndex = 0;
      for (let i = chartData.length - 1; i >= 0; i--) {
        if (chartData[i].watt > 0) {
          lastValidPoint = chartData[i];
          lastValidIndex = i;
          break;
        }
      }
      
      if (lastValidPoint) {
        const lx = padding.left + (chartWidth / (chartData.length - 1 || 1)) * lastValidIndex;
        const ly = padding.top + chartHeight - (lastValidPoint.watt / maxWatt) * chartHeight;
        
        // Glow
        const glowGradient = ctx.createRadialGradient(lx, ly, 0, lx, ly, 12);
        glowGradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
        glowGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.3)');
        glowGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.beginPath();
        ctx.arc(lx, ly, 12, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
        
        // Dot
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

  }, [chartData, hasData]);

  // Kalkulasi dari real data
  const totalKwh = hasData 
    ? chartData.reduce((sum, d) => sum + (d.watt / 1000) * (1 / 60), 0)
    : 0;
  const totalCost = totalKwh * 1444.70;
  const validValues = chartData.filter(d => d.watt > 0).map(d => d.watt);
  const avgWatt = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
  const peakWatt = validValues.length > 0 ? Math.max(...validValues) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-500/20 dark:to-blue-500/20 rounded-xl">
            <BarChart3 className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Energy Consumption</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasData ? 'Real-time data' : 'Waiting for data...'}
            </p>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gradient-to-b from-cyan-500 to-blue-500" />
            <span className="text-slate-500">Bars</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 border-t-2 border-dashed border-transparent" />
            <span className="text-slate-500">Trend</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={containerRef} className="relative w-full h-64 lg:h-80 mb-4">
        {hasData ? (
          <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-slate-400 dark:text-slate-500">No data available yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Connect ESP32 to see real-time chart
              </p>
            </div>
          </div>
        )}
        
        {/* Tooltip */}
        {tooltip && (
          <div 
            className="absolute bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none z-10"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p className="font-bold">{tooltip.watt} W</p>
            <p className="text-slate-300">Rp {tooltip.cost.toFixed(0)}/h</p>
            <p className="text-slate-400 text-[10px]">{tooltip.hour}</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-500/10 dark:to-blue-500/10 rounded-xl border border-cyan-200 dark:border-cyan-500/20">
            <p className="text-[10px] text-slate-500 mb-1">Total Energy</p>
            <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{totalKwh.toFixed(3)} kWh</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
            <p className="text-[10px] text-slate-500 mb-1">Total Cost</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Rp {totalCost.toFixed(0)}</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
            <p className="text-[10px] text-slate-500 mb-1">Average</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{avgWatt.toFixed(0)} W</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-500/10 dark:to-pink-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
            <p className="text-[10px] text-slate-500 mb-1">Peak</p>
            <p className="text-lg font-bold text-red-500">{peakWatt} W</p>
          </div>
        </div>
      )}
    </div>
  );
}