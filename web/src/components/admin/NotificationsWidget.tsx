import { useRouter } from 'next/navigation';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { FiBell, FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';
import { useState } from 'react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const NotificationsWidget = () => {
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Absences non justifiées',
      message: '5 élèves ont des absences non justifiées cette semaine',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'Nouveau devoir',
      message: 'Un nouveau devoir a été créé pour la classe 6ème A',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: '3',
      type: 'success',
      title: 'Bulletins générés',
      message: 'Les bulletins du trimestre 1 ont été générés avec succès',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: '4',
      type: 'error',
      title: 'Erreur de synchronisation',
      message: 'Problème de connexion avec le serveur de sauvegarde',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-orange-500" />;
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
            <FiBell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} non lue(s)</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Badge variant="danger" size="sm">
            {unreadCount}
          </Badge>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiBell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Aucune notification</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                notification.read ? 'opacity-60' : ''
              } ${getNotificationColor(notification.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-semibold text-gray-900">{notification.title}</p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Marquer comme lu"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push('/admin/notifications')}
            className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors hover:underline"
          >
            Voir toutes les notifications →
          </button>
        </div>
      )}
    </Card>
  );
};

export default NotificationsWidget;

