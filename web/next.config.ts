import type { NextConfig } from "next";
import path from "path";

/**
 * Origine du backend pour proxifier `/uploads/*` vers Express (logos branding, avatars, etc.).
 * Priorité : NEXT_PUBLIC_UPLOADS_ORIGIN, sinon origine dérivée de NEXT_PUBLIC_API_URL si absolue.
 * Désactiver avec NEXT_PUBLIC_DISABLE_UPLOADS_REWRITE=1 si front et API sont déjà sur le même domaine (reverse proxy).
 */
function isSafeHttpOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.username || u.password) return false;
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function backendOriginForUploadsProxy(): string | null {
  const explicit = process.env.NEXT_PUBLIC_UPLOADS_ORIGIN?.replace(/\/+$/, "").trim();
  if (explicit?.startsWith("http://") || explicit?.startsWith("https://")) {
    if (!isSafeHttpOrigin(explicit)) return null;
    return explicit.replace(/\/+$/, "");
  }
  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "").trim();
  if (api?.startsWith("http://") || api?.startsWith("https://")) {
    if (!isSafeHttpOrigin(api)) return null;
    const stripped = api.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
    return stripped.length > 0 ? stripped : null;
  }
  return null;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async rewrites() {
    // Même domaine que l’API (reverse proxy, pas de proxy Next nécessaire) — évite une boucle si l’API est sur le même hôte.
    if (process.env.NEXT_PUBLIC_DISABLE_UPLOADS_REWRITE === "1") return [];
    const origin = backendOriginForUploadsProxy();
    if (!origin || !isSafeHttpOrigin(origin)) return [];
    return [
      {
        source: "/uploads/:path*",
        destination: `${origin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
