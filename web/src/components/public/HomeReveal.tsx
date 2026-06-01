'use client';

import { type ReactNode } from 'react';

type HomeRevealProps = {
  children: ReactNode;
  className?: string;
  /** Conservé pour compatibilité API — sans effet (plus d’animation masquante). */
  delayMs?: number;
};

/** Wrapper sémantique — le contenu est toujours visible (pas d’opacity au scroll). */
export default function HomeReveal({ children, className = '' }: HomeRevealProps) {
  if (className) {
    return <div className={className}>{children}</div>;
  }
  return <>{children}</>;
}
