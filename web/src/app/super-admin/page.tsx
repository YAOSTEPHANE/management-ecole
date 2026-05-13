'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import SuperAdminDashboard from '@/views/super-admin/Dashboard';

export default function SuperAdminPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
      <SuperAdminDashboard />
    </ProtectedRoute>
  );
}
