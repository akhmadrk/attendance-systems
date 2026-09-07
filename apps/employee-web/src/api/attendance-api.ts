import api from './client';
import type {
  AttendanceRecord,
  LoginResponse,
  UserProfile,
} from './types';

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data as LoginResponse;
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('attendance_refresh_token');
  await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
}

export async function fetchProfile(): Promise<UserProfile> {
  const { data } = await api.get('/profile');
  return data.data as UserProfile;
}

export async function updateProfile(payload: {
  phoneNumber?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<UserProfile> {
  const { data } = await api.put('/profile', payload);
  return data.data as UserProfile;
}

export async function uploadPhoto(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append('photo', file);
  const { data } = await api.put('/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data as UserProfile;
}

export async function clockIn(): Promise<AttendanceRecord> {
  const { data } = await api.post('/attendance/clock-in');
  return data.data as AttendanceRecord;
}

export async function clockOut(): Promise<AttendanceRecord> {
  const { data } = await api.post('/attendance/clock-out');
  return data.data as AttendanceRecord;
}

export async function fetchSummary(
  from?: string,
  to?: string,
): Promise<AttendanceRecord[]> {
  const { data } = await api.get('/attendance/summary', {
    params: { from, to },
  });
  return data.data as AttendanceRecord[];
}
