'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { registerPushNotifications } from '@/lib/registerPushNotifications';

/**
 * Tente d’activer les notifications navigateur après connexion (permission utilisateur).
 */
export default function PushNotificationsBootstrap() {
  const { user, token } = useAuth();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || !token) {
      lastUserId.current = null;
      return;
    }
    if (lastUserId.current === user.id) return;
    lastUserId.current = user.id;

    if (typeof window === 'undefined') return;
    const ok =
      window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!ok) return;

    void registerPushNotifications();
  }, [user?.id, token]);

  return null;
}
