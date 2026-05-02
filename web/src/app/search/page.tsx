"use client";

import { Suspense } from "react";
import Search from "@/views/Search";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600" />
        </div>
      }
    >
      <Search />
    </Suspense>
  );
}
