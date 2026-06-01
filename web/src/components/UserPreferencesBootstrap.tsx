'use client';

import { useEffect } from 'react';
import { applyTheme, loadUserPreferences } from '@/lib/userPreferences';

/**
 * Réapplique thème et fuseau au montage client (après hydratation)
 * et suit le mode système lorsque le thème est « auto ».
 */
export default function UserPreferencesBootstrap() {
  useEffect(() => {
    const prefs = loadUserPreferences();
    applyTheme(prefs.theme);

    if (prefs.theme !== 'auto') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('auto');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return null;
}
