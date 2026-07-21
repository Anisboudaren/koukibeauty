"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthField, PasswordField } from "@/components/auth/fields";
import { hydrateFromApi, setSession } from "@/lib/lms/store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        return;
      }

      if (data?.role === "admin") {
        setSession({ role: "admin" });
        router.push(nextPath.startsWith("/admin") ? nextPath : "/admin");
        return;
      }

      if (data?.role === "student" && data.user?.id) {
        const state = await hydrateFromApi();
        setSession({ role: "student", studentId: data.user.id }, state);
        router.push("/dashboard");
        return;
      }

      setError("تعذّر الدخول");
    } catch {
      setError("تعذّر الاتصال. حاولي مرة أخرى.");
    } finally {
      setLoading(false);
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
