"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import EducatorDashboard from "@/views/educator/Dashboard";

export default function EducatorPage() {
  return (
    <ProtectedRoute allowedRoles={["EDUCATOR"]}>
      <EducatorDashboard />
    </ProtectedRoute>
  );
}
