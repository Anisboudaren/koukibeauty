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
      const adminRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id, password }),
      });

      if (adminRes.ok) {
        setSession({ role: "admin" });
        router.push(nextPath.startsWith("/admin") ? nextPath : "/admin");
        return;
      }

      if (adminRes.status !== 401) {
        const data = (await adminRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error || "تعذّر الدخول");
        return;
      }

      let state = await hydrateFromApi();
      const lower = id.toLowerCase();
      const student = state.students.find(
        (s) =>
          s.phone === id ||
          s.whatsapp === id ||
          (s.email && s.email.toLowerCase() === lower)
      );

      if (!student) {
        setError("بيانات الدخول غير صحيحة");
        return;
      }

      if (student.status === "suspended") {
        setError("حسابك معلّق — تواصلي مع الإدارة");
        return;
      }

      setSession({ role: "student", studentId: student.id }, state);
      router.push("/dashboard");
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
