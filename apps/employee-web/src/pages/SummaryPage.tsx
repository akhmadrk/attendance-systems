import { FormEvent, useEffect, useState } from 'react';
import { fetchSummary } from '../api/attendance-api';
import type { AttendanceRecord } from '../api/types';

function firstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SummaryPage() {
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(today());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (fromDate: string, toDate: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchSummary(fromDate, toDate);
      setRecords(result);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(from, to);
  }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    load(from, to);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Summary Absen</h2>

      <form
        onSubmit={handleSearch}
        className="bg-white shadow rounded-lg p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="from">
              From Date
            </label>
            <input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="to">
              To Date
            </label>
            <input
              id="to"
              type="date"
              value={to}
              max={today()}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded"
        >
          Cari (Search)
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-500 bg-white shadow rounded-lg p-6">
          No attendance records for this period
        </p>
      ) : (
        <div className="bg-white shadow rounded-lg divide-y divide-gray-100">
          {records.map((record) => (
            <div key={record.id} className="px-6 py-4">
              <p className="font-medium text-sm mb-2">{record.date}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Clock In: </span>
                  {record.clockInDisplay ?? '—'}
                </div>
                <div>
                  <span className="text-gray-500">Clock Out: </span>
                  {record.clockOutDisplay ?? '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function extractMessage(err: unknown): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? 'Request failed'
  );
}
