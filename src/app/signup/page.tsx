"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthField, AuthSelect, PasswordField } from "@/components/auth/fields";
import { WILAYAS } from "@/lib/wilayas";
import { cn } from "@/lib/utils";
import {
  hydrateFromApi,
  persistToApi,
  setSession,
  upsertStudent,
} from "@/lib/lms/store";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "الاسم الكامل مطلوب";
    if (!phone.trim()) next.phone = "رقم الهاتف مطلوب";
    if (!whatsapp.trim()) next.whatsapp = "رقم واتساب مطلوب";
    if (!wilaya) next.wilaya = "اختاري الولاية";
    if (!password || password.length < 6)
      next.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "البريد الإلكتروني غير صالح";
    }
    if (!acceptedPolicy) {
      next.policy = "يجب الموافقة على سياسة الخصوصية وشروط الاستخدام";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await hydrateFromApi();
      const next = upsertStudent({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        whatsapp: whatsapp.trim(),
        wilaya,
      });
      const created = next.students[next.students.length - 1];
      const withSession = setSession(
        { role: "student", studentId: created.id },
        next
      );
      await persistToApi(withSession);
      router.push("/dashboard");
    } catch {
      setErrors({ phone: "تعذّر إنشاء الحساب. حاولي مرة أخرى." });
    } finally {
      setLoading(false);
    }
  }

  const wilayaOptions = WILAYAS.map((w) => ({
    value: w.code,
    label: `${w.code} — ${w.name}`,
  }));

  return (
    <AuthShell
      eyebrow="انضمّي إلينا"
      title="إنشاء حساب"
      subtitle="ابدئي رحلتك في عالم الجمال — سجّلي خلال دقائق."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <AuthField
          label="الاسم الكامل"
          name="fullName"
          autoComplete="name"
          placeholder="مثال: سارة بن علي"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          required
        />

        <AuthField
          label="رقم الهاتف"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="05xxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          inputMode="tel"
          required
        />

        <AuthField
          label="البريد الإلكتروني"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          optional
        />

        <AuthField
          label="رقم واتساب"
          name="whatsapp"
          type="tel"
          placeholder="05xxxxxxxx"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          error={errors.whatsapp}
          inputMode="tel"
          required
        />

        <AuthSelect
          label="الولاية"
          name="wilaya"
          value={wilaya}
          onChange={(e) => setWilaya(e.target.value)}
          options={wilayaOptions}
          placeholder="اختاري ولايتك"
          error={errors.wilaya}
          required
        />

        <PasswordField
          label="كلمة المرور"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />

        <div className="space-y-1.5 pt-1">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-muted">
            <input
              type="checkbox"
              checked={acceptedPolicy}
              onChange={(e) => setAcceptedPolicy(e.target.checked)}
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0 rounded border-border text-accent accent-accent",
                errors.policy && "outline outline-2 outline-accent/40"
              )}
            />
            <span>
              أوافق على{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                سياسة الخصوصية وشروط الاستخدام
              </Link>
              ، بما في ذلك إمكانية صيانة الموقع أو توقفه مؤقتاً، وحق الأكاديمية في
              حظر الحسابات غير المحترمة.
            </span>
          </label>
          {errors.policy && (
            <p className="text-xs text-accent" role="alert">
              {errors.policy}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-medium text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {loading ? "جاري إنشاء الحساب…" : "إنشاء الحساب"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        لديكِ حساب بالفعل؟{" "}
        <Link
          href="/login"
          className="font-medium text-accent transition hover:text-accent-dark"
        >
          سجّلي الدخول
        </Link>
      </p>
    </AuthShell>
  );
}
