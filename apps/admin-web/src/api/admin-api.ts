import api from './client';
import type {
  AdminAttendanceRow,
  AuditLog,
  Employee,
  LoginResponse,
  Paginated,
} from './types';

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data as LoginResponse;
}

export async function listEmployees(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<Paginated<Employee>> {
  const { data } = await api.get('/admin/employees', { params });
  return data as Paginated<Employee>;
}

export async function createEmployee(payload: {
  name: string;
  email: string;
  position: string;
  password: string;
  phoneNumber?: string;
}): Promise<Employee> {
  const { data } = await api.post('/admin/employees', payload);
  return data.data as Employee;
}

export async function updateEmployee(
  id: string,
  payload: Partial<{
    name: string;
    email: string;
    position: string;
    password: string;
    phoneNumber: string;
    role: string;
    status: string;
  }>,
): Promise<Employee> {
  const { data } = await api.put(`/admin/employees/${id}`, payload);
  return data.data as Employee;
}

export async function deactivateEmployee(id: string): Promise<void> {
  await api.delete(`/admin/employees/${id}`);
}

export async function activateEmployee(id: string): Promise<void> {
  const payload = {
    status: 'ACTIVE'
  }
  await api.put(`/admin/employees/${id}`, payload);
}

export async function listAttendances(params: {
  userId?: string;
  from?: string;
  to?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<AdminAttendanceRow>> {
  const { data } = await api.get('/admin/attendances', { params });
  return data as Paginated<AdminAttendanceRow>;
}

export async function exportAttendances(params: {
  userId?: string;
  from?: string;
  to?: string;
}): Promise<void> {
  const response = await api.get('/admin/attendances/export', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'attendance-export.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function listAuditLogs(params: {
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<AuditLog>> {
  const { data } = await api.get('/admin/audit-logs', { params });
  return data as Paginated<AuditLog>;
}
