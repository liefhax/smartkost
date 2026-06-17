import { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Toast from '../ui/Toast';
import { Sun, Moon, Bell, Menu, Wifi, WifiOff } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { state, actions } = useDashboard();
  const { mqttStatus } = state;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/controls': 'Device Controls',
    '/energy': 'Energy Monitor',
    '/settings': 'Settings',
  };

  const currentTitle = pageTitles[window.location.pathname] || 'Dashboard';

  return (
    <div className={`${state.theme === 'dark' ? 'dark' : ''} h-screen overflow-hidden`}>
      <div className="h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex">
        
        {/* Sidebar Desktop */}
        <div className="hidden lg:block">
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        </div>

        {/* Main Area */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          
          {/* Header */}
          <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-4 lg:px-6 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={actions.toggleSidebar}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 lg:hidden"
              >
                <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{currentTitle}</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
                mqttStatus === 'connected' 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {mqttStatus === 'connected' ? (
                  <Wifi className="w-3.5 h-3.5" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5" />
                )}
                <span className="font-medium">{mqttStatus === 'connected' ? 'LIVE' : 'OFFLINE'}</span>
              </div>

              <button onClick={actions.toggleTheme} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90">
                {state.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </button>

              <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative">
                <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </header>

          {/* Page Content - Ini yang akan diisi oleh halaman */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <MobileNav />

        {/* Toast Notifications */}
        <Toast />
      </div>
    </div>
  );
}