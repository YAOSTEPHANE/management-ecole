"use client";

import { Suspense } from "react";
import ResetPassword from "@/views/ResetPassword";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600" />
        </div>
      }
    >
      <ResetPassword />
    </Suspense>
  );
}
