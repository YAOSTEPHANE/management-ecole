"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import StudentDashboard from "@/views/student/Dashboard";

export default function StudentPage() {
  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentDashboard />
    </ProtectedRoute>
  );
}
