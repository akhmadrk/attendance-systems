import { useEffect, useState } from 'react';
import { exportAttendances, listAttendances } from '../api/admin-api';
import type { AdminAttendanceRow, Paginated } from '../api/types';

export function AttendancesPage() {
  const [result, setResult] = useState<Paginated<AdminAttendanceRow> | null>(
    null,
  );
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const data = await listAttendances({
        from: from || undefined,
        to: to || undefined,
        status: status || undefined,
        page,
        limit: 20,
      });
      setResult(data);
    } catch (err) {
      setError(extractMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleExport = async () => {
    setError('');
    try {
      await exportAttendances({ from: from || undefined, to: to || undefined });
    } catch (err) {
      setError(extractMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Monitoring Absensi</h2>
        <button
          onClick={handleExport}
          className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="CLOCK_IN">Clock In only</option>
          <option value="CLOCK_OUT">Clock Out complete</option>
        </select>
        <button
          onClick={() => {
            setPage(1);
            load();
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded"
        >
          Filter
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Clock In</th>
              <th className="px-4 py-3 font-medium">Clock Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {result?.data.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">{row.userName}</td>
                <td className="px-4 py-3">{row.email}</td>
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">{row.clockInDisplay ?? '—'}</td>
                <td className="px-4 py-3">{row.clockOutDisplay ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {result && result.meta.total === 0 && (
          <p className="px-4 py-6 text-center text-gray-500">
            No attendance records
          </p>
        )}

        {result && result.meta.totalPages > 1 && (
          <div className="px-4 py-3 flex items-center gap-2 border-t border-gray-100">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-gray-500">
              Page {result.meta.page} / {result.meta.totalPages}
            </span>
            <button
              disabled={page >= result.meta.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
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
