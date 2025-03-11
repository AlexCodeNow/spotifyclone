'use client';

import { useState, useEffect } from 'react';
import { FaExclamationCircle, FaCheckCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { create } from 'zustand';

interface NotificationProps {
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
  onClose?: () => void;
  isVisible: boolean;
}

export default function Notification({
  type,
  message,
  duration = 5000,
  onClose,
  isVisible
}: NotificationProps) {
  const [isShowing, setIsShowing] = useState(isVisible);
  
  useEffect(() => {
    setIsShowing(isVisible);
    
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsShowing(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);
  
  if (!isShowing) return null;
  
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={20} />,
    error: <FaExclamationCircle className="text-red-500" size={20} />,
    info: <FaInfoCircle className="text-blue-500" size={20} />,
  };
  
  const bgColors = {
    success: 'bg-green-900 bg-opacity-90',
    error: 'bg-red-900 bg-opacity-90',
    info: 'bg-blue-900 bg-opacity-90',
  };
  
  const handleClose = () => {
    setIsShowing(false);
    if (onClose) onClose();
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`flex items-center p-4 rounded-md shadow-lg ${bgColors[type]}`}>
        <div className="mr-3">
          {icons[type]}
        </div>
        <div className="flex-1 mr-2">
          <p className="text-white text-sm">{message}</p>
        </div>
        <button 
          onClick={handleClose}
          className="text-gray-400 hover:text-white"
          aria-label="Close notification"
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
}

interface NotificationStore {
  isVisible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
  duration: number;
  
  showNotification: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  isVisible: false,
  type: 'info',
  message: '',
  duration: 5000,
  
  showNotification: (type, message, duration = 5000) => set({
    isVisible: true,
    type,
    message,
    duration
  }),
  
  hideNotification: () => set({ isVisible: false })
}));

export function NotificationContainer() {
  const { isVisible, type, message, duration, hideNotification } = useNotificationStore();
  
  return (
    <Notification
      isVisible={isVisible}
      type={type}
      message={message}
      duration={duration}
      onClose={hideNotification}
    />
  );
}