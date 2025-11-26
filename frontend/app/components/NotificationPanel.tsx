'use client';

import { useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationPanelProps {
  message: string;
  type?: NotificationType;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({
  message,
  type = 'info',
  isOpen,
  onClose,
}: NotificationPanelProps) {
  useEffect(() => {
    if (!isOpen) return;

    const timeout = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timeout);
  }, [isOpen, onClose]);

  if (!isOpen || !message) return null;

  const typeStyles =
    type === 'success'
      ? 'border-green-500/30 bg-green-500/10 text-green-200'
      : type === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-200'
      : 'border-blue-500/30 bg-blue-500/10 text-blue-200';

  const icon =
    type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex justify-center pointer-events-none mt-4">
      <div
        className={`glass-panel w-full max-w-3xl border px-4 py-2 shadow-md backdrop-blur flex items-center gap-3 pointer-events-auto rounded-lg ${typeStyles}`}
      >
        <div className="text-base leading-none">{icon}</div>
        <p className="flex-1 text-sm truncate">{message}</p>
        <button
          onClick={onClose}
          className="text-xs text-gray-300 hover:text-white ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}


