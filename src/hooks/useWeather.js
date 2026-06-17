import { useState, useEffect } from 'react';

export default function useWeather() {
  const [weather, setWeather] = useState({ temp: null, loading: true, error: null });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Koordinat Sukabumi: lat -6.92, lon 106.93
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-6.92&longitude=106.93&current_weather=true'
        );
        const data = await response.json();
        setWeather({ temp: data.current_weather.temperature, loading: false });
      } catch (error) {
        console.error(error);
        setWeather({ temp: null, loading: false, error: 'Failed to fetch' });
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // Refresh setiap 10 menit
    return () => clearInterval(interval);
  }, []);

  return weather;
}