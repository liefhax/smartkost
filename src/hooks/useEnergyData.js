import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useEnergyData() {
  const [todaySummary, setTodaySummary] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const logInterval = useRef(null);

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/energy/today`);
      const data = await res.json();
      setTodaySummary(data);
    } catch (err) {
      console.error('Failed to fetch today energy:', err);
    }
  }, []);

  const fetchHourly = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/energy/hourly`);
      const data = await res.json();
      setHourlyData(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch hourly energy:', err);
    }
  }, []);

  const fetchWeekly = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/energy/weekly`);
      const data = await res.json();
      setWeeklyData(data);
    } catch (err) {
      console.error('Failed to fetch weekly energy:', err);
    }
  }, []);

  // Log energy tiap menit
  const logEnergy = useCallback(async (wattage, voltage, ampere) => {
    if (wattage <= 0) return; // Skip kalo ga ada beban
    
    try {
      await fetch(`${API_BASE}/energy/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wattage, voltage, ampere }),
      });
    } catch (err) {
      console.error('Failed to log energy:', err);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchToday();
    fetchHourly();
    fetchWeekly();
    
    // Refresh tiap 30 detik
    const interval = setInterval(() => {
      fetchToday();
      fetchHourly();
    }, 30000);
    
    // Refresh weekly tiap 5 menit
    const weeklyInterval = setInterval(() => {
      fetchWeekly();
    }, 300000);
    
    return () => {
      clearInterval(interval);
      clearInterval(weeklyInterval);
    };
  }, [fetchToday, fetchHourly, fetchWeekly]);

  return { 
    todaySummary, 
    hourlyData, 
    weeklyData, 
    logEnergy, 
    loading,
    refetch: () => {
      fetchToday();
      fetchHourly();
      fetchWeekly();
    }
  };
}