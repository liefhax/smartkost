import { useNavigate, useLocation } from 'react-router-dom';
import { useDashboard } from '../../context/DashboardContext';
import { 
  LayoutDashboard, Power, BarChart3, Settings, 
  Zap, ChevronLeft, Wifi, WifiOff 
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'controls', label: 'Controls', icon: Power, path: '/controls' },
  { id: 'energy', label: 'Energy', icon: BarChart3, path: '/energy' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { state, actions } = useDashboard();
  const navigate = useNavigate();
  const location = useLocation();
  const { mqttStatus, sensors } = state;

  return (
    <>
      {/* Mobile Overlay */}
      {state.sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={actions.toggleSidebar} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full
        bg-white dark:bg-slate-900 
        border-r border-slate-200 dark:border-slate-800
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        ${state.sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white">SmartKost</h1>
                <p className="text-[10px] text-slate-500">IoT Dashboard</p>
              </div>
            </div>
          )}
          
          <button onClick={onToggle} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hidden lg:block">
            <ChevronLeft className={`w-4 h-4 text-slate-500 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>

          <button onClick={actions.toggleSidebar} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-6 px-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 1024) actions.toggleSidebar();
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-500' : ''}`} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                {isActive && <div className="absolute right-2 w-1.5 h-1.5 bg-cyan-500 rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom Status */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className={`p-3 rounded-xl border ${
            mqttStatus === 'connected' 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' 
              : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {mqttStatus === 'connected' ? (
                <Wifi className="w-4 h-4 text-emerald-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${mqttStatus === 'connected' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {mqttStatus === 'connected' ? 'Connected' : 'Offline'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">MQTT Broker</p>
                </div>
              )}
            </div>
          </div>

          {!collapsed && mqttStatus === 'connected' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-[10px] text-slate-500">Power</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{sensors.daya.watt}W</p>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-[10px] text-slate-500">Temp</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{sensors.suhu}°C</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}