import { useState, useEffect } from 'react';
import { listCalendars } from '../services/graphCalendar';

interface CalendarOption {
  id: string;
  name: string;
  isDefault: boolean;
}

interface CalendarPickerProps {
  onSelect: (calendarId: string, calendarName: string) => void;
  className?: string;
}

export default function CalendarPicker({ onSelect, className = '' }: CalendarPickerProps) {
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    listCalendars()
      .then(list => {
        const options: CalendarOption[] = list
          .filter(c => c.canEdit || c.isDefaultCalendar)
          .map(c => ({ id: c.id, name: c.name, isDefault: c.isDefaultCalendar }));
        setCalendars(options);
        const defaultCal = options.find(c => c.isDefault) ?? options[0];
        if (defaultCal) setSelected(defaultCal.id);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load calendars'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSync = () => {
    const cal = calendars.find(c => c.id === selected);
    if (cal) onSelect(cal.id, cal.name);
  };

  if (isLoading) {
    return (
      <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`} aria-busy="true">
        Loading calendars…
      </div>
    );
  }

  if (error) {
    return (
      <p className={`text-sm text-red-600 dark:text-red-400 ${className}`} role="alert">
        {error}
      </p>
    );
  }

  if (calendars.length === 0) {
    return (
      <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        No calendars found.
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label
          htmlFor="calendar-picker-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Choose a calendar to sync
        </label>
        <select
          id="calendar-picker-select"
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {calendars.map(cal => (
            <option key={cal.id} value={cal.id}>
              {cal.name}{cal.isDefault ? ' (default)' : ''}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleSync}
        disabled={!selected}
        className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm font-medium"
      >
        Sync this calendar
      </button>
    </div>
  );
}
