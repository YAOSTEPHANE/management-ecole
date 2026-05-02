"use client";

import dynamic from "next/dynamic";

/**
 * Fond décoratif login — chargé uniquement côté client pour éviter les erreurs d’hydratation
 * (particules / styles inline).
 */
export default dynamic(() => import("./Login3D"), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 overflow-hidden bg-gradient-to-br from-blue-50/40 via-indigo-50/30 to-pink-50/20"
      aria-hidden
    />
  ),
});
