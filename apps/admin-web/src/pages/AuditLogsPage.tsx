import { useEffect, useState } from 'react';
import { listAuditLogs } from '../api/admin-api';
import type { AuditLog, Paginated } from '../api/types';

export function AuditLogsPage() {
  const [result, setResult] = useState<Paginated<AuditLog> | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const data = await listAuditLogs({
        from: from || undefined,
        to: to || undefined,
        page,
        limit: 10,
      });
      setResult(data);
    } catch (err) {
      setError(extractMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Audit Logs</h2>

      <div className="bg-white shadow rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <th className="px-4 py-3 font-medium">Changed Fields</th>
              <th className="px-4 py-3 font-medium">IP Address</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {result?.data.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3">{log.userName}</td>
                <td className="px-4 py-3">
                  {Object.entries(log.changedFields).map(
                    ([field, value]) => (
                      <div key={field} className="text-xs">
                        <span className="font-medium">{field}:</span>{' '}
                        {String(value.old)} → {String(value.new)}
                      </div>
                    ),
                  )}
                </td>
                <td className="px-4 py-3">{log.ipAddress}</td>
                <td className="px-4 py-3">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {result && result.meta.total === 0 && (
          <p className="px-4 py-6 text-center text-gray-500">No audit logs</p>
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
