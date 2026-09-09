import { FormEvent, useEffect, useState } from 'react';
import {
  createEmployee,
  deactivateEmployee,
  listEmployees,
  updateEmployee,
  activateEmployee
} from '../api/admin-api';
import type { Employee, Paginated } from '../api/types';

interface FormState {
  name: string;
  email: string;
  position: string;
  password: string;
  phoneNumber: string;
}

const emptyForm: FormState = {
  name: '',
  email: '',
  position: '',
  password: '',
  phoneNumber: '',
};

export function EmployeesPage() {
  const [result, setResult] = useState<Paginated<Employee> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setError('');
    try {
      const data = await listEmployees({ page, limit: 10, search });
      setResult(data);
    } catch (err) {
      setError(extractMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, [page, search]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await updateEmployee(editingId, {
          name: form.name || undefined,
          position: form.position || undefined,
          phoneNumber: form.phoneNumber || undefined,
        });
        setMessage('Employee updated');
      } else {
        await createEmployee(form);
        setMessage('Employee created');
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(extractMessage(err));
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      email: employee.email,
      position: employee.position,
      password: '',
      phoneNumber: employee.phoneNumber ?? '',
    });
    setShowForm(true);
  };

  const handleDeactivate = async (id: string) => {
    setError('');
    try {
      await deactivateEmployee(id);
      setMessage('Employee deactivated');
      await load();
    } catch (err) {
      setError(extractMessage(err));
    }
  };

  const handleActivate = async (id: string) => {
    setError('');
    try {
      await activateEmployee(id);
      setMessage('Employee Activated');
      await load();
    } catch (err) {
      setError(extractMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kelola Karyawan</h2>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm((prev) => !prev);
          }}
          className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded"
        >
          + Add Employee
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, position, or email"
          className="w-full sm:w-80 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded-lg p-6 space-y-4"
        >
          <h3 className="font-medium">
            {editingId ? 'Edit Employee' : 'New Employee'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              required
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Corporate Email"
              type="email"
              required
              disabled={!!editingId}
              className="border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100"
            />
            <input
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="Position"
              required
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              value={form.phoneNumber}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: e.target.value })
              }
              placeholder="Phone Number"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          {!editingId && (
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              type="password"
              placeholder="Initial Password"
              required
              className="w-full sm:w-1/2 border border-gray-300 rounded px-3 py-2 text-sm"
            />
          )}
          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded"
          >
            {editingId ? 'Save Changes' : 'Create'}
          </button>
        </form>
      )}

      {message && (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded px-3 py-2">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {result?.data.map((employee) => (
              <tr key={employee.id}>
                <td className="px-4 py-3">{employee.name}</td>
                <td className="px-4 py-3">{employee.email}</td>
                <td className="px-4 py-3">{employee.position}</td>
                <td className="px-4 py-3">{employee.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      employee.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {employee.status}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => handleEdit(employee)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1 px-3 rounded"
                  >
                    Edit
                  </button>
                  {employee.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleDeactivate(employee.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1 px-3 rounded"
                    >
                      Deactivate
                    </button>
                  )}
                  {employee.status === 'INACTIVE' && (
                    <button
                      onClick={() => handleActivate(employee.id)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium py-1 px-3 rounded"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
  const data = (err as { response?: { data?: { message?: string } } })?.response
    ?.data;
  if (data?.message) return data.message;
  const details = (err as { response?: { data?: { details?: { message: string }[] } } })
    ?.response?.data?.details;
  if (details?.length) return details[0].message;
  return 'Request failed';
}
