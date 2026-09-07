import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  fetchProfile,
  updateProfile,
  uploadPhoto,
} from '../api/attendance-api';
import type { UserProfile } from '../api/types';

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const result = await fetchProfile();
      setProfile(result);
      setPhoneNumber(result.phoneNumber ?? '');
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const result = await uploadPhoto(file);
      setProfile(result);
      setMessage('Photo updated');
    } catch (err) {
      setError(extractMessage(err));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const payload: {
        phoneNumber?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {};
      if (phoneNumber !== (profile?.phoneNumber ?? '')) {
        payload.phoneNumber = phoneNumber;
      }
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      if (Object.keys(payload).length > 0) {
        const result = await updateProfile(payload);
        setProfile(result);
        setMessage('Profile updated');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setError(extractMessage(err));
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!profile) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Profil Karyawan</h2>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <img
            src={profile.photoUrl ?? undefined}
            alt={profile.name}
            className="w-20 h-20 rounded-full object-cover bg-gray-200"
          />
          <div className="flex-1">
            <p className="font-semibold text-lg">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.position}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
          <label className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded cursor-pointer">
            Change Photo
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Name</dt>
            <dd>{profile.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Position</dt>
            <dd>{profile.position}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Role</dt>
            <dd>{profile.role}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="font-medium mb-4">Edit Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="+6281234567890"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="currentPassword"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="newPassword"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

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

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded"
          >
            Save Changes
          </button>
        </form>
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
