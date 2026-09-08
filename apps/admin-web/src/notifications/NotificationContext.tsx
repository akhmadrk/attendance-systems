import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  event: string;
  userName: string;
  changedFields: Record<string, { old: unknown; new: unknown }>;
  timestamp: string;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => undefined,
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const socket: Socket = io('/', { path: '/socket.io' });

    socket.on('profile.updated', (payload: Notification) => {
      const notification: Notification = {
        id: `${payload.timestamp}-${Math.random()}`,
        event: 'profile.updated',
        userName: payload.userName,
        changedFields: payload.changedFields,
        timestamp: payload.timestamp,
      };
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((count) => count + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAllRead = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext);
}
