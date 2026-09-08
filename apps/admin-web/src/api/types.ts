export interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  phoneNumber: string | null;
  photoUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export interface Paginated<T> {
  statusCode: number;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminAttendanceRow {
  id: string;
  userId: string;
  userName: string;
  email: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  clockInDisplay: string | null;
  clockOutDisplay: string | null;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  changedFields: Record<string, { old: unknown; new: unknown }>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    photoUrl: string | null;
  };
}
