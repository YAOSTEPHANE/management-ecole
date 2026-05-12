import type { Metadata } from 'next';

type BrandingPayload = {
  appTitle?: string | null;
  appTagline?: string | null;
};

function getServerApiBaseUrl(): string {
  const n = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '').trim();
  if (n?.startsWith('http')) {
    const u = new URL(n);
    const path = (u.pathname || '/').replace(/\/+$/, '') || '/';
    if (path === '/' || path === '') {
      return `${u.origin}/api`;
    }
    return n;
  }
  if (process.env.VERCEL_URL) {
    const path = n?.startsWith('/') ? n : '/api';
    return `https://${process.env.VERCEL_URL}${path}`;
  }
  if (n?.startsWith('/')) {
    return `http://localhost:5000${n}`;
  }
  return 'http://localhost:5000/api';
}

export async function fetchPublicAppBrandingForMetadata(): Promise<BrandingPayload | null> {
  const base = getServerApiBaseUrl().replace(/\/+$/, '');
  const url = `${base}/public/app-branding`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 120 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as BrandingPayload;
  } catch {
    return null;
  }
}

const DEFAULT_TITLE = 'Gestion scolaire';
const DEFAULT_DESCRIPTION =
  'Plateforme de gestion scolaire : administration, pédagogie, familles et paiements.';

export async function buildHomePageMetadata(): Promise<Metadata> {
  const b = await fetchPublicAppBrandingForMetadata();
  const name = (b?.appTitle && String(b.appTitle).trim()) || DEFAULT_TITLE;
  const desc = (b?.appTagline && String(b.appTagline).trim()) || DEFAULT_DESCRIPTION;
  return {
    title: `${name} · Accueil`,
    description: desc,
    openGraph: {
      title: `${name} · Accueil`,
      description: desc,
    },
  };
}
