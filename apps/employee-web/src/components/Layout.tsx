import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearTokens } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { to: '/attendance', label: 'Absen' },
  { to: '/summary', label: 'Summary Absen' },
  { to: '/profile', label: 'Profil Karyawan' },
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
      <header className="bg-emerald-600 text-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-lg">Employee Attendance</h1>
          <button
            onClick={handleLogout}
            className="text-sm bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 text-sm whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
