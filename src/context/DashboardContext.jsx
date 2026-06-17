import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import mqtt from 'mqtt';
import { showBrowserNotification, requestNotificationPermission } from '../services/notificationService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Initial state
const initialState = {
  mqttStatus: 'disconnected',
  
  sensors: {
    suhu: 0,
    kelembaban: 0,
    daya: { watt: 0, volt: 0, ampere: 0 },
    gas: true,
    gerak: false,
    
    // History untuk chart
    suhuHistory: [],
    powerHistory: [],
    
    // Min/Max hari ini (reset saat midnight)
    suhuMin: null,
    suhuMax: null,
    powerMin: null,
    powerMax: null,
    kelembabanMin: null,
    kelembabanMax: null,
    lastResetDate: null, // Track kapan terakhir reset
  },
  
  controls: {
    relay1: false,
    relay2: false,
    fanSpeed: 0,
    fanAuto: true,
  },
  
  settings: {
    overloadLimit: 500,
    targetSuhu: 26,
    tarifPerKwh: 1444.70,
    gasThreshold: 500,
    notificationsEnabled: true,
    motionNotifications: true,
    gasNotifications: true,
    overloadNotifications: true,
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
  TOGGLE_THEME: 'TOGGLE_THEME',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  LOAD_PERSISTED_STATE: 'LOAD_PERSISTED_STATE',
  RESET_MIN_MAX: 'RESET_MIN_MAX',
  SET_RELAY_STATE: 'SET_RELAY_STATE',
};

function dashboardReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_MQTT_STATUS:
      return { ...state, mqttStatus: action.payload };
      
    case ACTIONS.UPDATE_SENSOR: {
      const { key, value } = action.payload;
      const newSensors = { ...state.sensors, [key]: value };
      
      // Update min/max untuk suhu
      if (key === 'suhu' && typeof value === 'number' && value > 0) {
        if (newSensors.suhuMin === null || value < newSensors.suhuMin) {
          newSensors.suhuMin = value;
        }
        if (newSensors.suhuMax === null || value > newSensors.suhuMax) {
          newSensors.suhuMax = value;
        }
      }
      
      // Update min/max untuk kelembaban
      if (key === 'kelembaban' && typeof value === 'number' && value > 0) {
        if (newSensors.kelembabanMin === null || value < newSensors.kelembabanMin) {
          newSensors.kelembabanMin = value;
        }
        if (newSensors.kelembabanMax === null || value > newSensors.kelembabanMax) {
          newSensors.kelembabanMax = value;
        }
      }
      
      // Update min/max untuk power
      if (key === 'daya' && value.watt && value.watt > 0) {
        if (newSensors.powerMin === null || value.watt < newSensors.powerMin) {
          newSensors.powerMin = value.watt;
        }
        if (newSensors.powerMax === null || value.watt > newSensors.powerMax) {
          newSensors.powerMax = value.watt;
        }
      }
      
      return { ...state, sensors: newSensors };
    }
    
    case ACTIONS.UPDATE_SENSOR_HISTORY: {
      const { key, value } = action.payload;
      const historyKey = key + 'History';
      const history = [...(state.sensors[historyKey] || []), { 
        value, 
        timestamp: Date.now() 
      }];
      
      // Simpan max 150 data point
      const trimmed = history.slice(-150);
      
      return {
        ...state,
        sensors: { ...state.sensors, [historyKey]: trimmed },
      };
    }
    
    case ACTIONS.SET_CONTROL:
      return {
        ...state,
        controls: { ...state.controls, [action.payload.key]: action.payload.value },
      };
      
    case ACTIONS.TOGGLE_CONTROL:
      return {
        ...state,
        controls: { ...state.controls, [action.payload]: !state.controls[action.payload] },
      };
      
    case ACTIONS.SET_FAN_SPEED:
      return {
        ...state,
        controls: { ...state.controls, fanSpeed: action.payload },
      };
      
    case ACTIONS.SET_FAN_AUTO:
      return {
        ...state,
        controls: { ...state.controls, fanAuto: action.payload },
      };
      
    case ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, [action.payload.key]: action.payload.value },
      };
      
    case ACTIONS.TOGGLE_THEME:
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
      
    case ACTIONS.ADD_NOTIFICATION: {
      const newNotifications = [
        ...state.notifications,
        { id: Date.now() + Math.random(), ...action.payload, timestamp: new Date() },
      ];
      if (newNotifications.length > 10) {
        newNotifications.splice(0, newNotifications.length - 10);
      }
      return { ...state, notifications: newNotifications };
    }
      
    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
      
    case ACTIONS.TOGGLE_SIDEBAR:
      return { ...state, sidebarOpen: !state.sidebarOpen };
      
    case ACTIONS.LOAD_PERSISTED_STATE: {
      const savedControls = localStorage.getItem('smartkost_controls');
      const savedSettings = localStorage.getItem('smartkost_settings');
      const savedTheme = localStorage.getItem('smartkost_theme');
      const savedMinMax = localStorage.getItem('smartkost_minmax');
      
      let newState = { ...state };
      
      // Load controls (relay states)
      if (savedControls) {
        try {
          const controls = JSON.parse(savedControls);
          newState.controls = { ...newState.controls, ...controls };
          console.log('📦 Loaded persisted controls:', controls);
        } catch (e) {
          console.error('Error loading controls:', e);
        }
      }
      
      // Load settings
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          newState.settings = { ...newState.settings, ...settings };
        } catch (e) {
          console.error('Error loading settings:', e);
        }
      }
      
      // Load theme
      if (savedTheme && savedTheme !== state.theme) {
        newState.theme = savedTheme;
      }
      
      // Load min/max
      if (savedMinMax) {
        try {
          const minMax = JSON.parse(savedMinMax);
          newState.sensors = {
            ...newState.sensors,
            suhuMin: minMax.suhuMin || null,
            suhuMax: minMax.suhuMax || null,
            powerMin: minMax.powerMin || null,
            powerMax: minMax.powerMax || null,
            kelembabanMin: minMax.kelembabanMin || null,
            kelembabanMax: minMax.kelembabanMax || null,
          };
        } catch (e) {
          console.error('Error loading minmax:', e);
        }
      }
      
      return newState;
    }
    
    case ACTIONS.RESET_MIN_MAX: {
      const today = new Date().toDateString();
      return {
        ...state,
        sensors: {
          ...state.sensors,
          suhuMin: null,
          suhuMax: null,
          powerMin: null,
          powerMax: null,
          kelembabanMin: null,
          kelembabanMax: null,
          lastResetDate: today,
        },
      };
    }
    
    case ACTIONS.SET_RELAY_STATE:
      return {
        ...state,
        controls: { ...state.controls, [action.payload.key]: action.payload.value },
      };
      
    default:
      return state;
  }
}

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const clientRef = useRef(null);
  const connectTimerRef = useRef(null);
  const mountedRef = useRef(false);
  
  // Debounce timers
  const lastMotionTime = useRef(0);
  const lastGasTime = useRef(0);
  const lastOverloadTime = useRef(0);
  const lastLogTime = useRef(0);
  
  const notificationTimers = useRef({});
  const stateRef = useRef(state);
  
  // Keep state ref updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load persisted state saat mount
  useEffect(() => {
    dispatch({ type: ACTIONS.LOAD_PERSISTED_STATE });
  }, []);

  // Reset min/max at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const today = new Date().toDateString();
      if (state.sensors.lastResetDate !== today) {
        dispatch({ type: ACTIONS.RESET_MIN_MAX });
      }
    };
    
    checkMidnight();
    const interval = setInterval(checkMidnight, 60000); // Cek tiap menit
    
    return () => clearInterval(interval);
  }, [state.sensors.lastResetDate]);

  // Save controls ke localStorage (biar relay state persistent)
  useEffect(() => {
    localStorage.setItem('smartkost_controls', JSON.stringify(state.controls));
  }, [state.controls]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('smartkost_settings', JSON.stringify(state.settings));
  }, [state.settings]);
  
  // Save theme
  useEffect(() => {
    localStorage.setItem('smartkost_theme', state.theme);
  }, [state.theme]);

  // Save min/max
  useEffect(() => {
    const minMax = {
      suhuMin: state.sensors.suhuMin,
      suhuMax: state.sensors.suhuMax,
      powerMin: state.sensors.powerMin,
      powerMax: state.sensors.powerMax,
      kelembabanMin: state.sensors.kelembabanMin,
      kelembabanMax: state.sensors.kelembabanMax,
    };
    localStorage.setItem('smartkost_minmax', JSON.stringify(minMax));
  }, [
    state.sensors.suhuMin, state.sensors.suhuMax,
    state.sensors.powerMin, state.sensors.powerMax,
    state.sensors.kelembabanMin, state.sensors.kelembabanMax,
  ]);

  // Auto-remove notifications
  useEffect(() => {
    state.notifications.forEach(notification => {
      if (!notificationTimers.current[notification.id]) {
        notificationTimers.current[notification.id] = setTimeout(() => {
          dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: notification.id });
          delete notificationTimers.current[notification.id];
        }, 3000);
      }
    });
  }, [state.notifications]);

  // Request notification permission
  useEffect(() => {
    if (state.settings.notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [state.settings.notificationsEnabled]);

  // Publish MQTT
  const publishMessage = useCallback((topic, message) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish(topic, String(message), { qos: 0 }, (err) => {
        if (err) console.error(`❌ Publish error to ${topic}:`, err);
      });
    } else {
      console.warn('⚠️ MQTT not connected, message not sent');
    }
  }, []);

  // Log energy to server
  const logEnergyToServer = useCallback(async (wattage, voltage, ampere) => {
    if (wattage <= 0) return;
    
    const now = Date.now();
    if (now - lastLogTime.current < 60000) return; // Max 1x per menit
    lastLogTime.current = now;
    
    try {
      await fetch(`${API_BASE}/energy/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wattage, voltage, ampere }),
      });
    } catch (err) {
      // Silent fail - server might not be running
    }
  }, []);

  // Connect MQTT
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const connectMQTT = () => {
      const brokerUrl = 'wss://5e83bc92b0c643ccbc75e9a515c3e9cd.s1.eu.hivemq.cloud:8884/mqtt';
      
      const options = {
        username: 'liefhax',
        password: 'Sukabumi123',
        clientId: 'web_' + Math.random().toString(16).substring(2, 10),
        clean: true,
        keepalive: 60,
        reconnectPeriod: 0,
        connectTimeout: 30000,
        rejectUnauthorized: false,
      };

      console.log('🔌 Connecting to MQTT...');
      dispatch({ type: ACTIONS.SET_MQTT_STATUS, payload: 'connecting' });

      const client = mqtt.connect(brokerUrl, options);
      clientRef.current = client;

      client.on('connect', () => {
        console.log('✅ MQTT Connected!');
        dispatch({ type: ACTIONS.SET_MQTT_STATUS, payload: 'connected' });

        const topics = [
          'kost/sensor/suhu',
          'kost/sensor/kelembaban',
          'kost/sensor/daya',
          'kost/sensor/gas',
          'kost/sensor/gerak',
          'kost/relay/1',
          'kost/relay/2',
          'kost/fan/speed',
          'kost/fan/auto',
          'kost/alert',
        ];

        let subscribeIndex = 0;
        const subscribeNext = () => {
          if (subscribeIndex < topics.length) {
            const topic = topics[subscribeIndex];
            client.subscribe(topic, { qos: 0 }, (err) => {
              if (!err) console.log(`📡 Subscribed to ${topic}`);
              subscribeIndex++;
              subscribeNext();
            });
          } else {
            // After all subscribed, request ESP32 status
            setTimeout(() => {
              console.log('📡 Requesting ESP32 status...');
              client.publish('kost/control', JSON.stringify({ request_status: true }));
            }, 500);
          }
        };
        subscribeNext();
      });

      client.on('message', (topic, message) => {
        const value = message.toString();
        
        try {
          // Sensor suhu
          if (topic === 'kost/sensor/suhu') {
            const suhu = parseFloat(value) || 0;
            if (suhu > 0 && suhu < 100) {
              dispatch({ type: ACTIONS.UPDATE_SENSOR, payload: { key: 'suhu', value: suhu } });
              dispatch({ type: ACTIONS.UPDATE_SENSOR_HISTORY, payload: { key: 'suhu', value: suhu } });
            }
          }
          
          // Sensor kelembaban
          else if (topic === 'kost/sensor/kelembaban') {
            const hum = parseFloat(value) || 0;
            if (hum > 0 && hum <= 100) {
              dispatch({ type: ACTIONS.UPDATE_SENSOR, payload: { key: 'kelembaban', value: hum } });
            }
          }
          
          // Sensor daya
          else if (topic === 'kost/sensor/daya') {
            const data = JSON.parse(value);
            if (data.watt >= 0) {
              dispatch({ type: ACTIONS.UPDATE_SENSOR, payload: { key: 'daya', value: data } });
              dispatch({ type: ACTIONS.UPDATE_SENSOR_HISTORY, payload: { key: 'power', value: data.watt } });
              
              // Auto log ke server
              logEnergyToServer(data.watt, data.volt, data.ampere);
            }
          }
          
          // Sensor gas
          else if (topic === 'kost/sensor/gas') {
            const isSafe = value === 'true';
            dispatch({ type: ACTIONS.UPDATE_SENSOR, payload: { key: 'gas', value: isSafe } });
            
            if (!isSafe) {
              const now = Date.now();
              if (now - lastGasTime.current > 60000) {
                lastGasTime.current = now;
                dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: { type: 'error', title: '⚠️ Gas Alert!', message: 'Kualitas udara tidak aman!' } });
                if (stateRef.current.settings.notificationsEnabled && stateRef.current.settings.gasNotifications) {
                  showBrowserNotification('⚠️ Gas Alert!', 'Kualitas udara tidak aman!');
                }
              }
            }
          }
          
          // Sensor gerak
          else if (topic === 'kost/sensor/gerak') {
            const motionDetected = value === 'true';
            dispatch({ type: ACTIONS.UPDATE_SENSOR, payload: { key: 'gerak', value: motionDetected } });
            
            if (motionDetected) {
              const now = Date.now();
              if (now - lastMotionTime.current > 30000) {
                lastMotionTime.current = now;
                dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: { type: 'warning', title: '🚨 Motion Detected', message: 'Gerakan terdeteksi di kamar!' } });
                if (stateRef.current.settings.notificationsEnabled && stateRef.current.settings.motionNotifications) {
                  showBrowserNotification('🚨 Motion Detected', 'Gerakan terdeteksi di kamar!');
                }
              }
            }
          }
          
          // Relay 1 status (dari ESP32)
          else if (topic === 'kost/relay/1') {
            const relayState = value === 'true';
            // Hanya update dari ESP32, jangan trigger publish balik
            dispatch({ type: ACTIONS.SET_RELAY_STATE, payload: { key: 'relay1', value: relayState } });
            console.log('🔌 Relay 1 status from ESP32:', relayState ? 'ON' : 'OFF');
          }
          
          // Relay 2 status
          else if (topic === 'kost/relay/2') {
            const relayState = value === 'true';
            dispatch({ type: ACTIONS.SET_RELAY_STATE, payload: { key: 'relay2', value: relayState } });
            console.log('💡 Relay 2 status from ESP32:', relayState ? 'ON' : 'OFF');
          }
          
          // Fan speed
          else if (topic === 'kost/fan/speed') {
            dispatch({ type: ACTIONS.SET_FAN_SPEED, payload: parseInt(value) || 0 });
          }
          
          // Fan auto mode
          else if (topic === 'kost/fan/auto') {
            dispatch({ type: ACTIONS.SET_FAN_AUTO, payload: value === 'true' });
          }
          
          // Alert
          else if (topic === 'kost/alert') {
            const alertData = JSON.parse(value);
            
            if (alertData.type === 'overload') {
              const now = Date.now();
              if (now - lastOverloadTime.current > 60000) {
                lastOverloadTime.current = now;
                dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: { type: 'error', title: '⚡ Overload!', message: alertData.message } });
                if (stateRef.current.settings.notificationsEnabled && stateRef.current.settings.overloadNotifications) {
                  showBrowserNotification('⚡ Overload!', alertData.message);
                }
              }
            }
          }
        } catch (err) {
          console.error('MQTT Parse Error:', err, 'Topic:', topic);
        }
      });

      client.on('error', (err) => {
        console.error('❌ MQTT Error:', err.message || err);
        dispatch({ type: ACTIONS.SET_MQTT_STATUS, payload: 'disconnected' });
      });

      client.on('disconnect', () => {
        console.log('🔌 MQTT Disconnected');
        dispatch({ type: ACTIONS.SET_MQTT_STATUS, payload: 'disconnected' });
        connectTimerRef.current = setTimeout(() => connectMQTT(), 5000);
      });
    };

    connectMQTT();

    return () => {
      mountedRef.current = false;
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
      Object.values(notificationTimers.current).forEach(t => clearTimeout(t));
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, [logEnergyToServer]);

  // Actions
  const actions = {
    toggleControl: (device) => {
      const newState = !state.controls[device];
      
      // Update local state dulu
      dispatch({ type: ACTIONS.TOGGLE_CONTROL, payload: device });
      
      // Kirim ke ESP32
      const controlMsg = JSON.stringify({ [device]: newState });
      publishMessage('kost/control', controlMsg);
      
      console.log(`🔘 ${device} toggled to:`, newState);
    },
    
    setFanSpeed: (speed) => {
      const numSpeed = Number(speed);
      dispatch({ type: ACTIONS.SET_FAN_SPEED, payload: numSpeed });
      publishMessage('kost/control', JSON.stringify({ fan_speed: numSpeed }));
    },
    
    setFanAuto: (value) => {
      dispatch({ type: ACTIONS.SET_FAN_AUTO, payload: value });
      publishMessage('kost/control', JSON.stringify({ auto_fan: value }));
    },
    
    updateSetting: (key, value) => {
      dispatch({ type: ACTIONS.UPDATE_SETTINGS, payload: { key, value } });
      
      const settingMap = { 
        overloadLimit: 'set_power', 
        targetSuhu: 'set_temp', 
        gasThreshold: 'set_gas_threshold' 
      };
      
      if (settingMap[key]) {
        publishMessage('kost/control', JSON.stringify({ [settingMap[key]]: Number(value) }));
      }
    },
    
    toggleTheme: () => dispatch({ type: ACTIONS.TOGGLE_THEME }),
    
    removeNotification: (id) => {
      dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
      if (notificationTimers.current[id]) {
        clearTimeout(notificationTimers.current[id]);
        delete notificationTimers.current[id];
      }
    },
    
    toggleSidebar: () => dispatch({ type: ACTIONS.TOGGLE_SIDEBAR }),
    
    triggerOTA: () => {
      publishMessage('kost/control', JSON.stringify({ cmd: 'ota_on' }));
      dispatch({ 
        type: ACTIONS.ADD_NOTIFICATION, 
        payload: { type: 'info', title: 'OTA Mode', message: 'ESP32 siap update firmware.' } 
      });
    },
  };

  return (
    <DashboardContext.Provider value={{ state, actions, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
}