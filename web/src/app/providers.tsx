"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import ServerConnectionError from "@/components/ServerConnectionError";
import "@/utils/debug";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4200,
            className:
              '!font-sans !bg-white/95 !backdrop-blur-xl !border !border-slate-200/90 !shadow-premium !rounded-2xl !text-slate-800 !px-4 !py-3',
            success: {
              iconTheme: { primary: '#4f46e5', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#e11d48', secondary: '#fff' },
            },
          }}
        />
        <ServerConnectionError />
      </AuthProvider>
    </QueryClientProvider>
  );
}
