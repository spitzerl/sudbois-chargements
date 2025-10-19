'use client';

import { useState, useEffect } from 'react';
import { XCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

export function Notification({ message, type, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="size-5 text-white" />;
      case 'error':
        return <XCircle className="size-5 text-white" />;
      case 'info':
      default:
        return <Info className="size-5 text-white" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      case 'info':
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <div className={cn(
      'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom duration-300',
      getBackgroundColor()
    )}>
      {getIcon()}
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-white/20 rounded"
      >
        <XCircle className="size-4" />
      </button>
    </div>
  );
}


// Contexte pour gérer les notifications
export const useNotification = () => {
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: NotificationType }>>([]);

  const showNotification = (message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
    
    // Auto-suppression après 3 secondes
    setTimeout(() => {
      removeNotification(id);
    }, 3000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const notificationElements = notifications.map((notification) => (
    <Notification
      key={notification.id}
      message={notification.message}
      type={notification.type}
      onClose={() => removeNotification(notification.id)}
    />
  ));

  return {
    showNotification,
    notificationElements
  };
};