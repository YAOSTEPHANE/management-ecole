'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StaffDashboard from '@/views/staff/Dashboard';
import { ensureStaffPedagogyApiInterceptor } from '@/lib/staffPedagogyApi';

ensureStaffPedagogyApiInterceptor();

export default function StaffPage() {
  return (
    <ProtectedRoute allowedRoles={['STAFF']}>
      <StaffDashboard />
    </ProtectedRoute>
  );
}
