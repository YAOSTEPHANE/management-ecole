"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ParentDashboard from "@/views/parent/Dashboard";

export default function ParentPage() {
  return (
    <ProtectedRoute allowedRoles={["PARENT"]}>
      <ParentDashboard />
    </ProtectedRoute>
  );
}
