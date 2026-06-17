import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Power, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'controls', label: 'Control', icon: Power, path: '/controls' },
  { id: 'energy', label: 'Energy', icon: BarChart3, path: '/energy' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-xl transition-all min-w-0 flex-1 relative ${
                isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}