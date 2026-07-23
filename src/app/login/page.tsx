"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthField, PasswordField } from "@/components/auth/fields";
import { useBusy } from "@/components/busy-overlay";
import { redirectAfterAuth } from "@/lib/auth/redirect";
import { hydrateFromApi, setSession } from "@/lib/lms/store";

function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showBusy, hideBusy } = useBusy();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const id = identifier.trim();
    if (!id) {
      setError("أدخلي اسم المستخدم أو البريد أو رقم الهاتف");
      return;
    }
    if (!password) {
      setError("أدخلي كلمة المرور");
      return;
    }

    setLoading(true);
    showBusy("جاري الدخول…");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id, password }),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
        role?: string;
        user?: { id: string };
      } | null;

      if (!res.ok) {
        setError(data?.error || "بيانات الدخول غير صحيحة");
        setLoading(false);
        hideBusy();
        return;
      }

      if (data?.role === "admin") {
        setSession({ role: "admin" });
        showBusy("جاري التحويل…");
        redirectAfterAuth(
          nextPath.startsWith("/admin") ? nextPath : "/admin",
          "/admin"
        );
        return;
      }

      if (data?.role === "student" && data.user?.id) {
        const studentId = data.user.id;
        setSession({ role: "student", studentId });

        // Hydration must not block login — session is already saved
        try {
          const state = await hydrateFromApi();
          setSession({ role: "student", studentId }, state);
        } catch {
          /* keep local session */
        }

        showBusy("جاري التحويل إلى لوحتك…");
        redirectAfterAuth(nextPath, "/dashboard");
        return;
      }

      setError("تعذّر الدخول");
      setLoading(false);
      hideBusy();
    } catch {
      setError("تعذّر الاتصال. حاولي مرة أخرى.");
      setLoading(false);
      hideBusy();
    }
  }

  return (
    <AuthShell
      eyebrow="مرحباً بعودتك"
      title="تسجيل الدخول"
      subtitle="ادخلي بحسابك لمتابعة دوراتك أو لوحة الإدارة."
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <AuthField
          label="اسم المستخدم أو البريد أو الهاتف"
          name="identifier"
          autoComplete="username"
          placeholder="kouki · أو رقم هاتف الطالبة"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          inputMode="email"
        />

        <PasswordField
          label="كلمة المرور"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-center text-sm text-accent" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-medium text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {loading ? "جاري الدخول…" : "دخول"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        ليس لديكِ حساب؟{" "}
        <Link
          href="/signup"
          className="font-medium text-accent transition hover:text-accent-dark"
        >
          إنشائي حساباً
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink-muted">
          جاري التحميل…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
