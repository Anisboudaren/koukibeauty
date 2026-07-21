"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { setSession } from "@/lib/lms/store";

type Status = "loading" | "ok" | "denied";

/** Client-side backup gate (cookie middleware is primary). */
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      void (async () => {
        try {
          const res = await fetch("/api/auth/me");
          if (!res.ok) throw new Error("unauthorized");
          if (cancelled) return;
          setSession({ role: "admin" });
          setStatus("ok");
        } catch {
          if (cancelled) return;
          setStatus("denied");
          router.replace("/login?next=/admin");
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status !== "ok") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink-muted">
        جاري التحقق من صلاحية الإدارة…
      </div>
    );
  }

  return <>{children}</>;
}
