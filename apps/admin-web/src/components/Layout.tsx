import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearTokens } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { NotificationBell } from './NotificationBell';

const navItems = [
  { to: '/employees', label: 'Kelola Karyawan' },
  { to: '/attendances', label: 'Monitoring Absensi' },
  { to: '/audit-logs', label: 'Audit Logs' },
];

export function Layout() {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const handleLogout = () => {
    clearTokens();
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-700 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-lg">HRD Monitoring Admin</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="text-sm bg-blue-800 hover:bg-blue-900 px-3 py-1.5 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 text-sm whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-blue-700 text-blue-700 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
