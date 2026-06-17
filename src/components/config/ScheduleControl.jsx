import { useState } from 'react';
import { useSchedule } from '../../hooks/useSchedule';
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const DAYS = [
  { key: 'sun', label: 'Sun' },
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
];

export default function ScheduleControl() {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedule();
  const [showAdd, setShowAdd] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    device: 'lamp',
    action: 'on',
    time: '06:00',
    days: 'mon,tue,wed,thu,fri',
    active: 1,
  });

  const handleAdd = async () => {
    await addSchedule(newSchedule);
    setShowAdd(false);
    setNewSchedule({ device: 'lamp', action: 'on', time: '06:00', days: 'mon,tue,wed,thu,fri', active: 1 });
  };

  const toggleDay = (day) => {
    const daysArray = newSchedule.days.split(',');
    if (daysArray.includes(day)) {
      setNewSchedule({ ...newSchedule, days: daysArray.filter(d => d !== day).join(',') });
    } else {
      setNewSchedule({ ...newSchedule, days: [...daysArray, day].join(',') });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Schedule</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Auto on/off lamp</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Schedule Form */}
      {showAdd && (
        <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-slide-up">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Device</label>
            <select
              value={newSchedule.device}
              onChange={(e) => setNewSchedule({ ...newSchedule, device: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            >
              <option value="lamp">Lamp (Socket 2)</option>
              <option value="socket1">Socket 1</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Action</label>
            <div className="flex gap-2">
              <button
                onClick={() => setNewSchedule({ ...newSchedule, action: 'on' })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  newSchedule.action === 'on'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                ON
              </button>
              <button
                onClick={() => setNewSchedule({ ...newSchedule, action: 'off' })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  newSchedule.action === 'off'
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Time</label>
            <input
              type="time"
              value={newSchedule.time}
              onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Days</label>
            <div className="flex gap-1 flex-wrap">
              {DAYS.map(day => (
                <button
                  key={day.key}
                  onClick={() => toggleDay(day.key)}
                  className={`px-2 py-1 text-xs rounded-lg transition-all ${
                    newSchedule.days.includes(day.key)
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all"
          >
            Add Schedule
          </button>
        </div>
      )}

      {/* Schedule List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {schedules.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No schedules yet</p>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${schedule.action === 'on' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {schedule.device === 'lamp' ? 'Lamp' : 'Socket 1'} - {schedule.action.toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {schedule.time} • {schedule.days}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSchedule(schedule.id, { active: schedule.active ? 0 : 1 })}
                >
                  {schedule.active ? (
                    <ToggleRight className="w-5 h-5 text-cyan-500" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <button
                  onClick={() => deleteSchedule(schedule.id)}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}