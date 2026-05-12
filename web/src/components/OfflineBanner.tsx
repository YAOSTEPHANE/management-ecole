"use client";

import { useEffect, useState } from "react";
import { FiWifiOff } from "react-icons/fi";

/**
 * Bandeau moderne type « toast » fixe — mode hors ligne.
 */
export default function OfflineBanner() {
  /** Toujours `true` au SSR et au 1er rendu client — évite les erreurs d’hydratation. */
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <div
      className="fixed z-[100] flex justify-center pointer-events-none animate-banner-enter left-3 right-3 bottom-[max(1rem,env(safe-area-inset-bottom))]"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-2xl border border-stone-700/60 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 px-4 py-3.5 text-left shadow-[0_22px_50px_-12px_rgba(0,0,0,0.55),0_0_0_1px_rgba(251,191,36,0.15)] backdrop-blur-xl ring-1 ring-amber-500/20"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-400/25">
          <FiWifiOff className="h-5 w-5 text-amber-300" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-50 leading-snug">
            Hors ligne
          </p>
          <p className="mt-0.5 text-xs text-stone-400 leading-relaxed">
            Affichage des dernières données en cache. Reconnexion requise pour enregistrer ou synchroniser.
          </p>
        </div>
      </div>
    </div>
  );
}
