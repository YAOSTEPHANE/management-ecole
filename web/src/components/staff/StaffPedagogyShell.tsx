'use client';

import type { ReactNode } from 'react';
import { StaffPedagogyReadOnlyProvider } from '@/contexts/StaffPedagogyContext';

/** Enveloppe UI consultation pour les écrans admin réutilisés dans /staff. */
export default function StaffPedagogyShell({
  children,
  readOnly = true,
}: {
  children: ReactNode;
  readOnly?: boolean;
}) {
  return (
    <StaffPedagogyReadOnlyProvider value={readOnly}>
      <div className="space-y-4">
        {readOnly ? (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-950 leading-relaxed">
            Mode <strong>consultation</strong> — les créations et modifications restent réservées aux
            administrateurs.
          </p>
        ) : null}
        {children}
      </div>
    </StaffPedagogyReadOnlyProvider>
  );
}
