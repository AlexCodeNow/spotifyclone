'use client';

import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/player-store';
import { useNotificationStore } from '@/components/ui/Notification';

export function PlayerErrorObserver() {
  const { error, clearError } = usePlayerStore();
  const { showNotification } = useNotificationStore();
  
  useEffect(() => {
    if (error) {
      showNotification('error', error, 5000);
      clearError();
    }
  }, [error, clearError, showNotification]);
  
  return null;
}