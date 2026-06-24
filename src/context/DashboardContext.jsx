import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { useMQTT } from '../hooks/useMQTT';
import { showBrowserNotification, requestNotificationPermission } from '../services/notificationService';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// MQTT Config
const MQTT_CONFIG = {
  brokerUrl: 'wss://5e83bc92b0c643ccbc75e9a515c3e9cd.s1.eu.hivemq.cloud:8884/mqtt',
  options: { username: 'liefhax', password: 'Sukabumi123' },
  topics: [
    'kost/sensor/suhu', 'kost/sensor/kelembaban', 'kost/sensor/daya',
    'kost/sensor/gas', 'kost/sensor/gerak',
    'kost/relay/1', 'kost/relay/2', 'kost/fan/speed', 'kost/fan/auto',
    'kost/alert', 'kost/ota/status', 'kost/settings/status',
  ],
};

const initialState = {
  sensors: {
    suhu: 0, kelembaban: 0, daya: { watt: 0, volt: 0, ampere: 0 },
    gas: true, gerak: false,
    suhuHistory: [], powerHistory: [],
    suhuMin: null, suhuMax: null, powerMin: null, powerMax: null,
    kelembabanMin: null, kelembabanMax: null, lastResetDate: null,
  },
  controls: {
    relay1: false, relay2: false, fanSpeed: 0, fanAuto: true,
  },
  settings: {
    overloadLimit: 500, targetSuhu: 26, tarifPerKwh: 1444.70, gasThreshold: 500,
    notificationsEnabled: true, motionNotifications: true,
    gasNotifications: true, overloadNotifications: true,
  },
  systemInfo: {
    espIP: null, otaActive: false, firmwareVersion: 'v1.0.0',
  },
  // Timer storage - PENTING BUAT PERSISTENCE
  timers: {
    relay1: { active: false, endTime: null, duration: 0 },
    relay2: { active: false, endTime: null, duration: 0 },
    fan: { active: false, endTime: null, duration: 0 },
  },
  theme: 'dark',
  notifications: [],
  sidebarOpen: false,
};

const ACTIONS = {
  SET_MQTT_STATUS: 'SET_MQTT_STATUS',
  UPDATE_SENSOR: 'UPDATE_SENSOR',
  UPDATE_SENSOR_HISTORY: 'UPDATE_SENSOR_HISTORY',
  SET_CONTROL: 'SET_CONTROL',
  TOGGLE_CONTROL: 'TOGGLE_CONTROL',
  SET_FAN_SPEED: 'SET_FAN_SPEED',
  SET_FAN_AUTO: 'SET_FAN_AUTO',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  LOAD_SETTINGS_FROM_ESP: 'LOAD_SETTINGS_FROM_ESP',
  SET_SYSTEM_INFO: 'SET_SYSTEM_INFO',
  SET_TIMER: 'SET_TIMER',
  CLEAR_TIMER: 'CLEAR_TIMER',
  CHECK_TIMERS: 'CHECK_TIMERS',
  TOGGLE_THEME: 'TOGGLE_THEME',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  LOAD_PERSISTED_STATE: 'LOAD_PERSISTED_STATE',
  RESET_MIN_MAX: 'RESET_MIN_MAX',
};

function dashboardReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_MQTT_STATUS:
      return { ...state, mqttStatus: action.payload };

    case ACTIONS.UPDATE_SENSOR: {
      const { key, value } = action.payload;
      const newSensors = { ...state.sensors, [key]: value };
      if (key === 'suhu' && typeof value === 'number' && value > 0 && value < 100) {
        if (newSensors.suhuMin === null || value < newSensors.suhuMin) newSensors.suhuMin = value;
        if (newSensors.suhuMax === null || value > newSensors.suhuMax) newSensors.suhuMax = value;
      }
      if (key === 'kelembaban' && typeof value === 'number') {
        if (newSensors.kelembabanMin === null || value < newSensors.kelembabanMin) newSensors.kelembabanMin = value;
        if (newSensors.kelembabanMax === null || value > newSensors.kelembabanMax) newSensors.kelembabanMax = value;
      }
      if (key === 'daya' && value.watt > 0) {
        if (newSensors.powerMin === null || value.watt < newSensors.powerMin) newSensors.powerMin = value.watt;
        if (newSensors.powerMax === null || value.watt > newSensors.powerMax) newSensors.powerMax = value.watt;
      }
      return { ...state, sensors: newSensors };
    }

    case ACTIONS.UPDATE_SENSOR_HISTORY: {
      const { key, value } = action.payload;
      const hKey = key + 'History';
      const history = [...(state.sensors[hKey] || []), { value, timestamp: Date.now() }];
      return { ...state, sensors: { ...state.sensors, [hKey]: history.slice(-150) } };
    }

    case ACTIONS.SET_CONTROL:
      return { ...state, controls: { ...state.controls, [action.payload.key]: action.payload.value } };
    case ACTIONS.TOGGLE_CONTROL:
      return { ...state, controls: { ...state.controls, [action.payload]: !state.controls[action.payload] } };
    case ACTIONS.SET_FAN_SPEED:
      return { ...state, controls: { ...state.controls, fanSpeed: action.payload } };
    case ACTIONS.SET_FAN_AUTO:
      return { ...state, controls: { ...state.controls, fanAuto: action.payload } };

    case ACTIONS.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, [action.payload.key]: action.payload.value } };
    
    case ACTIONS.LOAD_SETTINGS_FROM_ESP:
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case ACTIONS.SET_SYSTEM_INFO:
      return { ...state, systemInfo: { ...state.systemInfo, ...action.payload } };

    case ACTIONS.SET_TIMER: {
      const { device, duration } = action.payload;
      const endTime = Date.now() + duration * 1000;
      return {
        ...state,
        timers: {
          ...state.timers,
          [device]: { active: true, endTime, duration },
        },
      };
    }

    case ACTIONS.CLEAR_TIMER: {
      const { device } = action.payload;
      return {
        ...state,
        timers: {
          ...state.timers,
          [device]: { active: false, endTime: null, duration: 0 },
        },
      };
    }

    case ACTIONS.CHECK_TIMERS: {
      const now = Date.now();
      let newState = { ...state };
      let changed = false;

      // Cek relay1 timer
      if (state.timers.relay1.active && state.timers.relay1.endTime && now >= state.timers.relay1.endTime) {
        newState.controls = { ...newState.controls, relay1: false };
        newState.timers = { ...newState.timers, relay1: { active: false, endTime: null, duration: 0 } };
        changed = true;
      }

      // Cek relay2 timer
      if (state.timers.relay2.active && state.timers.relay2.endTime && now >= state.timers.relay2.endTime) {
        newState.controls = { ...newState.controls, relay2: false };
        newState.timers = { ...newState.timers, relay2: { active: false, endTime: null, duration: 0 } };
        changed = true;
      }

      // Cek fan timer
      if (state.timers.fan.active && state.timers.fan.endTime && now >= state.timers.fan.endTime) {
        newState.controls = { ...newState.controls, fanSpeed: 0 };
        newState.timers = { ...newState.timers, fan: { active: false, endTime: null, duration: 0 } };
        changed = true;
      }

      return changed ? newState : state;
    }

    case ACTIONS.TOGGLE_THEME:
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };

    case ACTIONS.ADD_NOTIFICATION: {
      const notifs = [...state.notifications, { id: Date.now() + Math.random(), ...action.payload, timestamp: new Date() }];
      if (notifs.length > 10) notifs.splice(0, notifs.length - 10);
      return { ...state, notifications: notifs };
    }

    case ACTIONS.REMOVE_NOTIFICATION:
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };

    case ACTIONS.TOGGLE_SIDEBAR:
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case ACTIONS.LOAD_PERSISTED_STATE: {
      const savedControls = localStorage.getItem('smartkost_controls');
      const savedSettings = localStorage.getItem('smartkost_settings');
      const savedTheme = localStorage.getItem('smartkost_theme');
      const savedTimers = localStorage.getItem('smartkost_timers');
      const savedMinMax = localStorage.getItem('smartkost_minmax');

      let newState = { ...state };
      if (savedControls) try { newState.controls = { ...newState.controls, ...JSON.parse(savedControls) }; } catch (e) {}
      if (savedSettings) try { newState.settings = { ...newState.settings, ...JSON.parse(savedSettings) }; } catch (e) {}
      if (savedTheme && savedTheme !== state.theme) newState.theme = savedTheme;
      if (savedTimers) try { newState.timers = { ...newState.timers, ...JSON.parse(savedTimers) }; } catch (e) {}
      if (savedMinMax) try { newState.sensors = { ...newState.sensors, ...JSON.parse(savedMinMax) }; } catch (e) {}
      return newState;
    }

    case ACTIONS.RESET_MIN_MAX:
      return { ...state, sensors: { ...state.sensors, suhuMin: null, suhuMax: null, powerMin: null, powerMax: null, kelembabanMin: null, kelembabanMax: null, lastResetDate: new Date().toDateString() } };

    default:
      return state;
  }
}

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const notificationTimers = useRef({});
  const lastLogTime = useRef(0);
  const lastMotionTime = useRef(0);
  const lastGasTime = useRef(0);
  const lastOverloadTime = useRef(0);
  const stateRef = useRef(state);
  const timerCheckInterval = useRef(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  // ==================== LOAD PERSISTED ====================
  useEffect(() => {
    dispatch({ type: ACTIONS.LOAD_PERSISTED_STATE });
  }, []);

  // ==================== SAVE PERSISTENCE ====================
  useEffect(() => {
    localStorage.setItem('smartkost_controls', JSON.stringify(state.controls));
  }, [state.controls]);

  useEffect(() => {
    localStorage.setItem('smartkost_settings', JSON.stringify(state.settings));
  }, [state.settings]);

  useEffect(() => {
    localStorage.setItem('smartkost_theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    localStorage.setItem('smartkost_timers', JSON.stringify(state.timers));
  }, [state.timers]);

  useEffect(() => {
    const minMax = {
      suhuMin: state.sensors.suhuMin, suhuMax: state.sensors.suhuMax,
      powerMin: state.sensors.powerMin, powerMax: state.sensors.powerMax,
      kelembabanMin: state.sensors.kelembabanMin, kelembabanMax: state.sensors.kelembabanMax,
    };
    localStorage.setItem('smartkost_minmax', JSON.stringify(minMax));
  }, [state.sensors.suhuMin, state.sensors.suhuMax, state.sensors.powerMin, state.sensors.powerMax]);

  // ==================== TIMER CHECK (tiap detik) ====================
  useEffect(() => {
    timerCheckInterval.current = setInterval(() => {
      const currentState = stateRef.current;
      const now = Date.now();
      let needsUpdate = false;
      let updates = {};

      // Cek relay1
      if (currentState.timers.relay1.active && currentState.timers.relay1.endTime && now >= currentState.timers.relay1.endTime) {
        updates.relay1 = false;
        needsUpdate = true;
        console.log('⏰ Timer relay1 expired!');
      }

      // Cek relay2
      if (currentState.timers.relay2.active && currentState.timers.relay2.endTime && now >= currentState.timers.relay2.endTime) {
        updates.relay2 = false;
        needsUpdate = true;
        console.log('⏰ Timer relay2 expired!');
      }

      // Cek fan
      if (currentState.timers.fan.active && currentState.timers.fan.endTime && now >= currentState.timers.fan.endTime) {
        updates.fanSpeed = 0;
        needsUpdate = true;
        console.log('⏰ Timer fan expired!');
      }

      if (needsUpdate) {
        dispatch({ type: ACTIONS.CHECK_TIMERS });
        // Kirim ke ESP32
        Object.keys(updates).forEach(device => {
          const msg = device === 'fanSpeed' 
            ? JSON.stringify({ fan_speed: 0 })
            : JSON.stringify({ [device]: false });
          mqttPublishRef.current('kost/control', msg);
        });
      }
    }, 1000);

    return () => clearInterval(timerCheckInterval.current);
  }, []);

  // ==================== MQTT HANDLER ====================
  const handleMQTTMessage = useCallback((topic, value) => {
    try {
      if (topic === 'kost/sensor/suhu') {
        const suhu = parseFloat(value) || 0;
        if (suhu > 0 && suhu < 100) {
          dispatch({ type: ACTIONS.UPDATE_SENSOR, payload: { key: 'suhu', value: suhu } });
          dispatch({ type: ACTIONS.UPDATE_SENSOR_HISTORY, payload: { key: 'suhu', value: suhu } });
        }
      } else if (topic === 'kost/sensor/kelembaban') {
        const hum = parseFloat(value) || 0;
        if (hum > 0 && hum <= 100) dispatch({ type: ACTIONS.UPDATE_SENSOR, payload: { key: 'kelembaban', value: hum } });
      } else if (topic === 'kost/sensor/daya') {
        const data = JSON.parse(value);
        if (data.watt >= 0) {
          dispatch({ type: ACTIONS.UPDATE_SENSOR, payload: { key: 'daya', value: data } });
          dispatch({ type: ACTIONS.UPDATE_SENSOR_HISTORY, payload: { key: 'power', value: data.watt } });
        }
      } else if (topic === 'kost/sensor/gas') {
        dispatch({ type: ACTIONS.UPDATE_SENSOR, payload: { key: 'gas', value: value === 'true' } });
      } else if (topic === 'kost/sensor/gerak') {
        const motion = value === 'true';
        dispatch({ type: ACTIONS.UPDATE_SENSOR, payload: { key: 'gerak', value: motion } });
        if (motion) handleAlert('motion', '🚨 Motion Detected', 'Gerakan terdeteksi!');
      } else if (topic === 'kost/relay/1') {
        dispatch({ type: ACTIONS.SET_CONTROL, payload: { key: 'relay1', value: value === 'true' } });
      } else if (topic === 'kost/relay/2') {
        dispatch({ type: ACTIONS.SET_CONTROL, payload: { key: 'relay2', value: value === 'true' } });
      } else if (topic === 'kost/fan/speed') {
        dispatch({ type: ACTIONS.SET_FAN_SPEED, payload: parseInt(value) || 0 });
      } else if (topic === 'kost/fan/auto') {
        dispatch({ type: ACTIONS.SET_FAN_AUTO, payload: value === 'true' });
      } else if (topic === 'kost/ota/status') {
        const data = JSON.parse(value);
        dispatch({ type: ACTIONS.SET_SYSTEM_INFO, payload: { 
          otaActive: data.ota_active === true || data.ota_active === 'true',
          espIP: data.ip || null 
        } });
      } else if (topic === 'kost/settings/status') {
        const data = JSON.parse(value);
        const mapped = {};
        if (data.overload_limit) mapped.overloadLimit = Number(data.overload_limit);
        if (data.target_temp) mapped.targetSuhu = Number(data.target_temp);
        if (data.gas_threshold) mapped.gasThreshold = Number(data.gas_threshold);
        dispatch({ type: ACTIONS.LOAD_SETTINGS_FROM_ESP, payload: mapped });
      }
    } catch (err) {
      console.error('MQTT Parse Error:', err);
    }
  }, []);

  // ==================== USE MQTT ====================
  const { status: mqttStatus, publish: mqttPublish } = useMQTT(
    MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options, MQTT_CONFIG.topics, handleMQTTMessage
  );
  const mqttPublishRef = useRef(mqttPublish);
  useEffect(() => { mqttPublishRef.current = mqttPublish; }, [mqttPublish]);

  useEffect(() => { dispatch({ type: ACTIONS.SET_MQTT_STATUS, payload: mqttStatus }); }, [mqttStatus]);

  // Request status saat connect
  useEffect(() => {
    if (mqttStatus === 'connected') {
      setTimeout(() => mqttPublish('kost/control', JSON.stringify({ request_status: true })), 1000);
    }
  }, [mqttStatus]);

  // ==================== HELPERS ====================
  const handleAlert = (type, title, message) => {
    const now = Date.now();
    const debounceMap = { motion: 30000, gas: 60000, overload: 60000 };
    const refMap = { motion: lastMotionTime, gas: lastGasTime, overload: lastOverloadTime };
    if (now - refMap[type].current > (debounceMap[type] || 30000)) {
      refMap[type].current = now;
      dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: { type: 'warning', title, message } });
      if (stateRef.current.settings.notificationsEnabled) showBrowserNotification(title, message);
    }
  };

  // Auto-remove notifications
  useEffect(() => {
    state.notifications.forEach(n => {
      if (!notificationTimers.current[n.id]) {
        notificationTimers.current[n.id] = setTimeout(() => {
          dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: n.id });
          delete notificationTimers.current[n.id];
        }, 3000);
      }
    });
  }, [state.notifications]);

  useEffect(() => { if (state.settings.notificationsEnabled) requestNotificationPermission(); }, [state.settings.notificationsEnabled]);

  // ==================== ACTIONS ====================
  const actions = {
    toggleControl: (device) => {
      const newState = !state.controls[device];
      dispatch({ type: ACTIONS.TOGGLE_CONTROL, payload: device });
      mqttPublish('kost/control', JSON.stringify({ [device]: newState }));
      // Clear timer kalo manual toggle
      dispatch({ type: ACTIONS.CLEAR_TIMER, payload: { device } });
    },

    setFanSpeed: (speed) => {
      dispatch({ type: ACTIONS.SET_FAN_SPEED, payload: Number(speed) });
      mqttPublish('kost/control', JSON.stringify({ fan_speed: Number(speed) }));
      dispatch({ type: ACTIONS.CLEAR_TIMER, payload: { device: 'fan' } });
    },

    setFanAuto: (value) => {
      dispatch({ type: ACTIONS.SET_FAN_AUTO, payload: value });
      mqttPublish('kost/control', JSON.stringify({ auto_fan: value }));
    },

    updateSetting: (key, value) => {
      dispatch({ type: ACTIONS.UPDATE_SETTINGS, payload: { key, value } });
      const map = { overloadLimit: 'set_power', targetSuhu: 'set_temp', gasThreshold: 'set_gas_threshold' };
      if (map[key]) mqttPublish('kost/control', JSON.stringify({ [map[key]]: Number(value) }));
    },

    // ==================== TIMER ACTIONS ====================
    setTimer: (device, minutes) => {
      const duration = minutes * 60; // Convert ke detik
      dispatch({ type: ACTIONS.SET_TIMER, payload: { device, duration } });
      
      // Kalau device mati, nyalakan dulu
      if (device === 'fan') {
        if (state.controls.fanSpeed === 0) {
          dispatch({ type: ACTIONS.SET_FAN_SPEED, payload: 128 });
          mqttPublish('kost/control', JSON.stringify({ fan_speed: 128 }));
        }
      } else {
        if (!state.controls[device]) {
          dispatch({ type: ACTIONS.TOGGLE_CONTROL, payload: device });
          mqttPublish('kost/control', JSON.stringify({ [device]: true }));
        }
      }
      
      dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: { 
        type: 'info', title: '⏰ Timer Set', message: `${device} akan mati dalam ${minutes} menit` 
      } });
    },

    clearTimer: (device) => {
      dispatch({ type: ACTIONS.CLEAR_TIMER, payload: { device } });
      dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: { 
        type: 'info', title: '⏰ Timer Cancelled', message: `Timer ${device} dibatalkan` 
      } });
    },

    getTimerRemaining: (device) => {
      const timer = state.timers[device];
      if (!timer.active || !timer.endTime) return null;
      const remaining = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
      return remaining > 0 ? remaining : null;
    },

    // ==================== OTA ====================
    toggleOTA: () => {
      const currentOTA = state.systemInfo?.otaActive || false;
      if (currentOTA) {
        mqttPublish('kost/control', JSON.stringify({ cmd: 'ota_off' }));
      } else {
        mqttPublish('kost/control', JSON.stringify({ cmd: 'ota_on' }));
      }
    },

    toggleTheme: () => dispatch({ type: ACTIONS.TOGGLE_THEME }),
    removeNotification: (id) => dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id }),
    toggleSidebar: () => dispatch({ type: ACTIONS.TOGGLE_SIDEBAR }),
  };

  return (
    <DashboardContext.Provider value={{ state: { ...state, mqttStatus }, actions, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
}