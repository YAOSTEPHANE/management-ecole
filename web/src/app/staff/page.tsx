'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StaffDashboard from '@/views/staff/Dashboard';

export default function StaffPage() {
  return (
    <ProtectedRoute allowedRoles={['STAFF']}>
      <StaffDashboard />
    </ProtectedRoute>
  );
}
