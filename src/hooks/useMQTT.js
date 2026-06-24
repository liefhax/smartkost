import { useState, useEffect, useCallback, useRef } from 'react';
import mqtt from 'mqtt';

export function useMQTT(brokerUrl, options = {}, topics = [], onMessage) {
  const [status, setStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  const clientRef = useRef(null);
  const mountedRef = useRef(false);
  const reconnectTimerRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  
  // Keep onMessage ref updated tanpa trigger re-subscribe
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // Publish message
  const publish = useCallback((topic, message) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish(topic, String(message), { qos: 0 }, (err) => {
        if (err) console.error(`❌ Publish error to ${topic}:`, err);
      });
      return true;
    }
    console.warn('⚠️ MQTT not connected');
    return false;
  }, []);

  // Subscribe to topics
  const subscribe = useCallback((newTopics) => {
    if (!clientRef.current || !clientRef.current.connected) return;
    
    const topicList = Array.isArray(newTopics) ? newTopics : [newTopics];
    
    topicList.forEach((topic, i) => {
      setTimeout(() => {
        clientRef.current.subscribe(topic, { qos: 0 }, (err) => {
          if (!err) console.log(`📡 Subscribed to ${topic}`);
        });
      }, i * 100); // Delay biar ga numpuk
    });
  }, []);

  // Connect
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const connect = () => {
      console.log('🔌 Connecting to MQTT...');
      setStatus('connecting');

      const client = mqtt.connect(brokerUrl, {
        clientId: 'web_' + Math.random().toString(16).substring(2, 10),
        clean: true,
        keepalive: 60,
        reconnectPeriod: 0,
        connectTimeout: 30000,
        rejectUnauthorized: false,
        ...options,
      });

      clientRef.current = client;

      client.on('connect', () => {
        console.log('✅ MQTT Connected!');
        setStatus('connected');
        
        // Subscribe to topics
        if (topics.length > 0) {
          subscribe(topics);
        }
      });

      client.on('message', (topic, message) => {
        const value = message.toString();
        
        // Panggil callback onMessage
        if (onMessageRef.current) {
          onMessageRef.current(topic, value);
        }
      });

      client.on('error', (err) => {
        console.error('❌ MQTT Error:', err.message || err);
        setStatus('disconnected');
      });

      client.on('disconnect', () => {
        console.log('🔌 MQTT Disconnected');
        setStatus('disconnected');
        
        // Auto reconnect
        reconnectTimerRef.current = setTimeout(() => {
          console.log('🔄 Reconnecting...');
          connect();
        }, 5000);
      });

      client.on('reconnect', () => {
        console.log('🔄 MQTT Reconnecting...');
        setStatus('connecting');
      });
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, [brokerUrl]); // Hanya reconnect kalo brokerUrl berubah

  // Re-subscribe kalo topics berubah
  useEffect(() => {
    if (status === 'connected' && topics.length > 0) {
      subscribe(topics);
    }
  }, [topics.join(','), status]);

  return {
    status,
    publish,
    subscribe,
    client: clientRef.current,
  };
}