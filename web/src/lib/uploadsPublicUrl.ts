/**
 * Construit une URL absolue pour un fichier servi sous `/uploads/...` sur l’API Express.
 */
export function getApiOriginForUploads(): string {
  const n = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (n?.startsWith('http')) {
    const base = n.replace(/\/api\/?$/, '');
    return base.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const base =
      n || (process.env.VERCEL ? `${window.location.origin}/api` : 'http://localhost:5000/api');
    if (base.startsWith('/')) {
      return window.location.origin.replace(/\/+$/, '');
    }
    return base.replace(/\/api\/?$/, '').replace(/\/+$/, '') || window.location.origin;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
  }
  return 'http://localhost:5000';
}

export function resolveUploadPublicUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const origin = getApiOriginForUploads();
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${origin}${path}`;
}
