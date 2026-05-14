'use client';

import dynamic from 'next/dynamic';

export default dynamic(() => import('./LoginBackground'), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 bg-gradient-to-br from-stone-200 via-amber-50 to-stone-300"
      aria-hidden
    />
  ),
});
