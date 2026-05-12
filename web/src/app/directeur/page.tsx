'use client';

import { Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DirectorDashboard from '@/views/director/Dashboard';

export default function DirecteurPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
          </div>
        }
      >
        <DirectorDashboard />
      </Suspense>
    </ProtectedRoute>
  );
}
