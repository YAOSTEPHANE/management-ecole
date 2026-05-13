'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { publicApi } from '@/services/api/public';
import { resolveUploadPublicUrl } from '@/lib/uploadsPublicUrl';

export type AppBrandingPayload = {
  navigationLogoUrl: string | null;
  loginLogoUrl: string | null;
  faviconUrl: string | null;
  appTitle: string | null;
  appTagline: string | null;
  schoolDisplayName: string | null;
  schoolAddress: string | null;
  schoolPhone: string | null;
  schoolEmail: string | null;
  schoolWebsite: string | null;
  schoolPrincipal: string | null;
};

type AppBrandingContextValue = {
  branding: AppBrandingPayload;
  loading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
  navigationLogoAbsolute: string | null;
  loginLogoAbsolute: string | null;
  faviconAbsolute: string | null;
};

const DEFAULT_BRANDING: AppBrandingPayload = {
  navigationLogoUrl: null,
  loginLogoUrl: null,
  faviconUrl: null,
  appTitle: null,
  appTagline: null,
  schoolDisplayName: null,
  schoolAddress: null,
  schoolPhone: null,
  schoolEmail: null,
  schoolWebsite: null,
  schoolPrincipal: null,
};

const AppBrandingContext = createContext<AppBrandingContextValue | null>(null);

export function AppBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<AppBrandingPayload>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBranding = useCallback(async () => {
    try {
      setError(null);
      const data = (await publicApi.getAppBranding()) as AppBrandingPayload;
      setBranding({
        navigationLogoUrl: data.navigationLogoUrl ?? null,
        loginLogoUrl: data.loginLogoUrl ?? null,
        faviconUrl: data.faviconUrl ?? null,
        appTitle: data.appTitle ?? null,
        appTagline: data.appTagline ?? null,
        schoolDisplayName: data.schoolDisplayName ?? null,
        schoolAddress: data.schoolAddress ?? null,
        schoolPhone: data.schoolPhone ?? null,
        schoolEmail: data.schoolEmail ?? null,
        schoolWebsite: data.schoolWebsite ?? null,
        schoolPrincipal: data.schoolPrincipal ?? null,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Chargement de la charte impossible';
      setError(msg);
      setBranding(DEFAULT_BRANDING);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBranding();
  }, [refreshBranding]);

  useEffect(() => {
    const href = resolveUploadPublicUrl(branding.faviconUrl);
    if (!href || typeof document === 'undefined') return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [branding.faviconUrl]);

  const navigationLogoAbsolute = useMemo(
    () => resolveUploadPublicUrl(branding.navigationLogoUrl),
    [branding.navigationLogoUrl]
  );
  const loginLogoAbsolute = useMemo(() => {
    const login = resolveUploadPublicUrl(branding.loginLogoUrl);
    if (login) return login;
    return navigationLogoAbsolute;
  }, [branding.loginLogoUrl, navigationLogoAbsolute]);
  const faviconAbsolute = useMemo(
    () => resolveUploadPublicUrl(branding.faviconUrl),
    [branding.faviconUrl]
  );

  const value = useMemo<AppBrandingContextValue>(
    () => ({
      branding,
      loading,
      error,
      refreshBranding,
      navigationLogoAbsolute,
      loginLogoAbsolute,
      faviconAbsolute,
    }),
    [
      branding,
      loading,
      error,
      refreshBranding,
      navigationLogoAbsolute,
      loginLogoAbsolute,
      faviconAbsolute,
    ]
  );

  return <AppBrandingContext.Provider value={value}>{children}</AppBrandingContext.Provider>;
}

const FALLBACK_CTX: AppBrandingContextValue = {
  branding: DEFAULT_BRANDING,
  loading: false,
  error: null,
  refreshBranding: async () => {},
  navigationLogoAbsolute: null,
  loginLogoAbsolute: null,
  faviconAbsolute: null,
};

/** Retourne un contexte par défaut si le provider est absent (ex. tests). */
export function useAppBranding(): AppBrandingContextValue {
  const ctx = useContext(AppBrandingContext);
  return ctx ?? FALLBACK_CTX;
}
