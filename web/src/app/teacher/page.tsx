"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import TeacherDashboard from "@/views/teacher/Dashboard";

export default function TeacherPage() {
  return (
    <ProtectedRoute allowedRoles={["TEACHER"]}>
      <TeacherDashboard />
    </ProtectedRoute>
  );
}
