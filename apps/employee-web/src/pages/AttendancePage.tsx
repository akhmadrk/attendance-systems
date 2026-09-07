import { useEffect, useState } from 'react';
import { clockIn, clockOut, fetchSummary } from '../api/attendance-api';
import type { AttendanceRecord } from '../api/types';

export function AttendancePage() {
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadToday = async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const records = await fetchSummary(todayStr, todayStr);
    setToday(records[0] ?? null);
  };

  useEffect(() => {
    loadToday().catch(() => undefined);
  }, []);

  const handleClockIn = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await clockIn();
      await loadToday();
      setMessage('Clock in recorded');
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleClockOut = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await clockOut();
      await loadToday();
      setMessage('Clock out recorded');
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const canClockIn = !today;
  const canClockOut = !!today && !today.clockOut;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Absen</h2>

      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-sm text-gray-500 mb-2">Today&apos;s Attendance</p>

        {today ? (
          <div className="space-y-1 mb-6">
            <p className="text-2xl font-semibold">
              Clock In: {today.clockInDisplay ?? '—'}
            </p>
            <p className="text-2xl font-semibold">
              Clock Out: {today.clockOutDisplay ?? '—'}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 mb-6">No clock-in recorded yet</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleClockIn}
            disabled={!canClockIn || busy}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-8 rounded disabled:opacity-50"
          >
            Masuk (Clock In)
          </button>
          <button
            onClick={handleClockOut}
            disabled={!canClockOut || busy}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-8 rounded disabled:opacity-50"
          >
            Pulang (Clock Out)
          </button>
        </div>

        {message && (
          <p className="text-sm text-emerald-700 bg-emerald-50 rounded px-3 py-2 mt-4">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mt-4">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function extractMessage(err: unknown): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? 'Request failed'
  );
}
