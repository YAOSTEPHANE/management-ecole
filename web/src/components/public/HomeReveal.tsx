'use client';

import { useRef, useEffect, useState, type ReactNode } from 'react';

type HomeRevealProps = {
  children: ReactNode;
  className?: string;
  /** Décalage avant le début de l’animation (ms), une fois visible */
  delayMs?: number;
};

/**
 * Révélation au scroll (Intersection Observer), une seule fois.
 */
export default function HomeReveal({ children, className = '', delayMs = 0 }: HomeRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`home-scroll-reveal ${visible ? 'home-scroll-reveal--visible' : ''} ${className}`.trim()}
      style={visible && delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
