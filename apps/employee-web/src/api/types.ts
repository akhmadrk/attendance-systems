export interface UserProfile {
  id: string;
  name: string;
  email: string;
  position: string;
  phoneNumber: string | null;
  photoUrl: string | null;
  role: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  clockInDisplay: string | null;
  clockOutDisplay: string | null;
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
