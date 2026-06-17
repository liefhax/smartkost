export default function ProgressBar({ value, max = 100, color = 'cyan', showLabel = false, size = 'md' }) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const heightMap = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  
  const colorMap = {
    cyan: 'from-cyan-400 to-blue-500',
    red: 'from-red-400 to-red-600',
    amber: 'from-amber-400 to-orange-500',
    emerald: 'from-emerald-400 to-green-500',
    blue: 'from-blue-400 to-cyan-500',
  };
  
  return (
    <div className="w-full">
      <div className={`w-full ${heightMap[size]} bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden`}>
        <div
          className={`h-full bg-gradient-to-r ${colorMap[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">0</span>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{Math.round(percentage)}%</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{max}</span>
        </div>
      )}
    </div>
  );
}