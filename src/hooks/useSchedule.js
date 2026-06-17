import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

export function useSchedule() {
  const { request } = useApi();
  const [schedules, setSchedules] = useState([]);

  const fetchSchedules = useCallback(async () => {
    try {
      const data = await request('/schedules');
      setSchedules(data);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    }
  }, [request]);

  const addSchedule = useCallback(async (schedule) => {
    try {
      await request('/schedules', {
        method: 'POST',
        body: JSON.stringify(schedule),
      });
      await fetchSchedules();
    } catch (err) {
      console.error('Failed to add schedule:', err);
    }
  }, [request, fetchSchedules]);

  const updateSchedule = useCallback(async (id, updates) => {
    try {
      await request(`/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      await fetchSchedules();
    } catch (err) {
      console.error('Failed to update schedule:', err);
    }
  }, [request, fetchSchedules]);

  const deleteSchedule = useCallback(async (id) => {
    try {
      await request(`/schedules/${id}`, { method: 'DELETE' });
      await fetchSchedules();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
    }
  }, [request, fetchSchedules]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return { schedules, addSchedule, updateSchedule, deleteSchedule, fetchSchedules };
}