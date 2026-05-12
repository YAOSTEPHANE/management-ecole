"use client";

import { useEffect, useRef } from "react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

async function prefetchEssential(role: string) {
  try {
    await api.get("/auth/me");
  } catch {
    /* ignore */
  }

  const tasks: Promise<unknown>[] = [];

  switch (role) {
    case "STUDENT":
      tasks.push(
        api.get("/student/profile"),
        api.get("/student/grades"),
        api.get("/student/schedule"),
        api.get("/student/announcements"),
        api.get("/student/portal-feed"),
        api.get("/student/notifications")
      );
      break;
    case "PARENT":
      tasks.push(
        api.get("/parent/children"),
        api.get("/parent/appointments"),
        api.get("/parent/portal-feed")
      );
      break;
    case "TEACHER":
      tasks.push(
        api.get("/teacher/profile"),
        api.get("/teacher/schedule"),
        api.get("/teacher/appointments")
      );
      break;
    case "EDUCATOR":
      tasks.push(api.get("/educator/profile"));
      break;
    default:
      break;
  }

  await Promise.allSettled(tasks);
}

/**
 * En ligne : précharge les endpoints GET essentiels pour alimenter le cache hors ligne.
 */
export default function OfflinePrefetch() {
  const { user, token } = useAuth();
  const prefetchedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || !token || typeof navigator === "undefined" || !navigator.onLine) {
      return;
    }

    if (prefetchedForUser.current === user.id) {
      return;
    }
    prefetchedForUser.current = user.id;
    void prefetchEssential(user.role);
  }, [user?.id, user?.role, token]);

  useEffect(() => {
    const onOnline = () => {
      prefetchedForUser.current = null;
      if (user?.id && token && navigator.onLine) {
        prefetchedForUser.current = user.id;
        void prefetchEssential(user.role);
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [user?.id, user?.role, token]);

  return null;
}
