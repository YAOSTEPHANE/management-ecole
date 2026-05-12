/**
 * Origines CORS : normalisation stricte (http/https uniquement, pas de wildcard).
 */

function normalizeOrigin(raw: string): string | null {
  const t = raw.trim().replace(/\/+$/, '');
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (u.username || u.password) return null;
    return u.origin;
  } catch {
    return null;
  }
}

/** Liste des origines autorisées pour CORS (déjà validées). */
export function getAllowedCorsOrigins(): string[] {
  const fromEnv = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of fromEnv) {
    const n = normalizeOrigin(raw);
    if (!n) {
      if (process.env.NODE_ENV === 'production') {
        console.warn(`[cors] Origine ignorée (format invalide) : ${raw.slice(0, 80)}`);
      }
      continue;
    }
    if (n.includes('*')) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }

  if (process.env.VERCEL_URL) {
    const v = normalizeOrigin(`https://${process.env.VERCEL_URL}`);
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }

  return out;
}
