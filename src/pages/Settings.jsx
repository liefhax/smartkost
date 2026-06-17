import { useState } from "react";
import { useDashboard } from "../context/DashboardContext";
import ScheduleControl from "../components/config/ScheduleControl";
import { Settings, Cpu, Save, Wifi, Server, Shield, Bell, BellOff } from "lucide-react";
import { requestNotificationPermission, getNotificationPermission } from '../services/notificationService';

function Toggle({ enabled, onChange, size = "md" }) {
  const dimensions = size === "sm" ? "w-10 h-6" : "w-12 h-7";
  const knob = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const translate = enabled ? (size === "sm" ? "translate-x-4" : "translate-x-5") : "translate-x-0";

  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex ${dimensions} items-center rounded-full transition-colors ${enabled ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}
      aria-pressed={enabled}
    >
      <span
        className={`inline-block ${knob} transform rounded-full bg-white transition-transform ${translate}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { state, actions } = useDashboard();
  const { settings, mqttStatus } = state;
  const [localSettings, setLocalSettings] = useState({
    overloadLimit: settings.overloadLimit,
    targetSuhu: settings.targetSuhu,
    tarifPerKwh: settings.tarifPerKwh,
  });

  const handleSave = (key, value) => {
    actions.updateSetting(key, value);
    actions.addNotification({
      type: "success",
      title: "Settings Saved",
      message: `${key} updated successfully`,
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          System configuration & preferences
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Configuration */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
              <Settings className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Configuration
            </h3>
          </div>

          <div className="space-y-5">
            {/* Overload Limit */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Overload Protection (Watt)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                System will alert when power exceeds this limit
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={localSettings.overloadLimit}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      overloadLimit: e.target.value,
                    })
                  }
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none"
                />
                <button
                  onClick={() =>
                    handleSave("overloadLimit", localSettings.overloadLimit)
                  }
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            {/* Target Temperature */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Auto Fan Temperature (°C)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Fan will auto-activate above this temperature
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={localSettings.targetSuhu}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      targetSuhu: e.target.value,
                    })
                  }
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none"
                />
                <button
                  onClick={() =>
                    handleSave("targetSuhu", localSettings.targetSuhu)
                  }
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            {/* Tariff */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Electricity Tariff (Rp/kWh)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Used for cost calculation
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={localSettings.tarifPerKwh}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      tarifPerKwh: e.target.value,
                    })
                  }
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none"
                />
                <button
                  onClick={() =>
                    handleSave("tarifPerKwh", localSettings.tarifPerKwh)
                  }
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            {/* Gas Threshold - Tambahin ini */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Gas Alert Threshold (Analog Value)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Alert when MQ-2 sensor value exceeds this threshold
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={localSettings.gasThreshold || 500}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      gasThreshold: e.target.value,
                    })
                  }
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none"
                />
                <button
                  onClick={() =>
                    handleSave("gasThreshold", localSettings.gasThreshold)
                  }
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            {/* Notification Settings - Tambahin setelah Configuration */}
<div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all">
  <div className="flex items-center gap-2 mb-6">
    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
      <Bell className="w-5 h-5 text-blue-500" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Settings</h3>
  </div>

  <div className="space-y-4">
    {/* Browser Notification Permission */}
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Browser Notifications</p>
          <p className="text-xs text-slate-500">
            {getNotificationPermission() === 'granted' 
              ? 'Notifications are enabled' 
              : 'Click to enable browser notifications'}
          </p>
        </div>
        <button
          onClick={async () => {
            const granted = await requestNotificationPermission();
            if (granted) {
              actions.addNotification({
                type: 'success',
                title: 'Notifications Enabled',
                message: 'Browser notifications are now active',
              });
            }
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all"
        >
          {getNotificationPermission() === 'granted' ? 'Enabled' : 'Enable'}
        </button>
      </div>
    </div>

    {/* Motion Notifications */}
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Motion Alerts</p>
          <p className="text-xs text-slate-500">Get notified when motion is detected</p>
        </div>
        <Toggle
          enabled={localSettings.motionNotifications !== false}
          onChange={() => {
            const newVal = localSettings.motionNotifications === false;
            setLocalSettings({ ...localSettings, motionNotifications: newVal });
            handleSave('motionNotifications', newVal);
          }}
          size="sm"
        />
      </div>
    </div>

    {/* Gas Notifications */}
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Gas Alerts</p>
          <p className="text-xs text-slate-500">Get notified about air quality issues</p>
        </div>
        <Toggle
          enabled={localSettings.gasNotifications !== false}
          onChange={() => {
            const newVal = localSettings.gasNotifications === false;
            setLocalSettings({ ...localSettings, gasNotifications: newVal });
            handleSave('gasNotifications', newVal);
          }}
          size="sm"
        />
      </div>
    </div>

    {/* Overload Notifications */}
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Overload Alerts</p>
          <p className="text-xs text-slate-500">Get notified about power overload</p>
        </div>
        <Toggle
          enabled={localSettings.overloadNotifications !== false}
          onChange={() => {
            const newVal = localSettings.overloadNotifications === false;
            setLocalSettings({ ...localSettings, overloadNotifications: newVal });
            handleSave('overloadNotifications', newVal);
          }}
          size="sm"
        />
      </div>
    </div>
  </div>
</div>

            {/* OTA Update */}
            <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-500/20">
              <button
                onClick={actions.triggerOTA}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all group rounded-lg"
              >
                <Cpu className="w-5 h-5 text-orange-500 group-hover:rotate-180 transition-transform duration-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Trigger OTA Update
                  </p>
                  <p className="text-[10px] text-orange-500 dark:text-orange-400/70">
                    ESP32 will enter firmware update mode
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* System Info + Schedule */}
        <div className="space-y-4 lg:space-y-6">
          {/* System Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <Server className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                System Info
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wifi
                    className={`w-4 h-4 ${mqttStatus === "connected" ? "text-emerald-500" : "text-red-500"}`}
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    MQTT Status
                  </span>
                </div>
                <span
                  className={`text-xs font-bold ${mqttStatus === "connected" ? "text-emerald-500" : "text-red-500"}`}
                >
                  {mqttStatus === "connected" ? "Connected" : "Offline"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Security
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-500">
                  Active
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Version
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  v1.0.0
                </span>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <ScheduleControl />
        </div>
      </div>
    </div>
  );
}
