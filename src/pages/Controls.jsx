import { useDashboard } from '../context/DashboardContext';
import Toggle from '../components/ui/Toggle';
import { Power, Zap, Gauge, Thermometer, Info } from 'lucide-react';

export default function Controls() {
  const { state, actions } = useDashboard();
  const { controls, sensors, settings } = state;

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Device Controls</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage all connected devices in real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        
        {/* Socket 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-xl ${controls.relay1 ? 'bg-cyan-100 dark:bg-cyan-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <Power className={`w-6 h-6 ${controls.relay1 ? 'text-cyan-500' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Socket 1</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Power Outlet</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {controls.relay1 ? 'Active' : 'Inactive'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {controls.relay1 ? 'Device is running' : 'Device is off'}
                </p>
              </div>
              <Toggle enabled={controls.relay1} onChange={() => actions.toggleControl('relay1')} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg">
                <span className="text-slate-500">Type</span>
                <p className="font-medium text-slate-700 dark:text-slate-300">AC Outlet</p>
              </div>
              <div className="p-2 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg">
                <span className="text-slate-500">Max Load</span>
                <p className="font-medium text-slate-700 dark:text-slate-300">500W</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lamp */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-xl ${controls.relay2 ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <Zap className={`w-6 h-6 ${controls.relay2 ? 'text-amber-500' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Lamp</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Socket 2 • Lighting</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {controls.relay2 ? 'ON' : 'OFF'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {controls.relay2 ? 'Room is lit' : 'Lights off'}
                </p>
              </div>
              <Toggle enabled={controls.relay2} onChange={() => actions.toggleControl('relay2')} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                <span className="text-slate-500">Type</span>
                <p className="font-medium text-slate-700 dark:text-slate-300">LED Lamp</p>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                <span className="text-slate-500">Power</span>
                <p className="font-medium text-slate-700 dark:text-slate-300">15W</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-xl ${controls.fanAuto ? 'bg-purple-100 dark:bg-purple-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <Gauge className={`w-6 h-6 ${controls.fanAuto ? 'text-purple-500' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Fan Speed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">PWM Control • 0-255</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto Mode</p>
                  <p className="text-[10px] text-slate-500">
                    {controls.fanAuto ? `Target: ${settings.targetSuhu}°C` : 'Manual control'}
                  </p>
                </div>
                <Toggle enabled={controls.fanAuto} onChange={() => actions.setFanAuto(!controls.fanAuto)} size="sm" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500">Speed: {controls.fanSpeed}/255</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {Math.round((controls.fanSpeed / 255) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={controls.fanSpeed}
                  onChange={(e) => actions.setFanSpeed(Number(e.target.value))}
                  disabled={controls.fanAuto}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full accent-cyan-500 disabled:opacity-50"
                />
              </div>

              {/* Fan speed indicator */}
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">OFF</span>
                <span className="text-slate-400">LOW</span>
                <span className="text-slate-400">MED</span>
                <span className="text-slate-400">HIGH</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <Thermometer className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Current Temperature</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{sensors.suhu}°C</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Control Info</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          All controls are sent in real-time via MQTT. Changes take effect immediately on the ESP32 device.
        </p>
      </div>
    </div>
  );
}