import { useEffect, useState } from 'react';
import { useNotifications } from '../notifications/NotificationContext';

export function NotificationBell() {
  const { unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const { notifications } = useNotifications();

  useEffect(() => {
    if (unreadCount > 0) {
      setOpen(true);
    }
  }, [unreadCount]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
    if (unreadCount > 0) {
      markAllRead();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-white hover:bg-blue-700 rounded"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
          <div className="px-4 py-2 border-b border-gray-100 font-medium text-sm">
            Notifications
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">
              No profile updates yet
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.map((notification) => (
                <li key={notification.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">{notification.userName}</p>
                  <p className="text-gray-500">
                    updated{' '}
                    {Object.keys(notification.changedFields).join(', ')}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
