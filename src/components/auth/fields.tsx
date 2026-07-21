"use client";

import { useState, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  optional?: boolean;
  error?: string;
}

export function AuthField({
  label,
  optional,
  error,
  className,
  id,
  ...props
}: FieldProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline gap-2 text-sm font-medium text-foreground">
        {label}
        {optional && (
          <span className="text-xs font-normal text-ink-subtle">(اختياري)</span>
        )}
      </span>
      <input
        id={fieldId}
        className={cn(
          "h-12 w-full rounded-full border border-border/80 bg-white px-5 text-sm text-foreground outline-none transition placeholder:text-ink-subtle focus:border-blush-deep focus:ring-2 focus:ring-blush/40",
          error && "border-accent focus:ring-accent/30",
          className
        )}
        {...props}
      />
      {error && <span className="block text-xs text-accent">{error}</span>}
    </label>
  );
}

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

export function PasswordField({
  label,
  error,
  className,
  id,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? props.name ?? "password";

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="relative block">
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          className={cn(
            "h-12 w-full rounded-full border border-border/80 bg-white pe-12 ps-5 text-sm text-foreground outline-none transition placeholder:text-ink-subtle focus:border-blush-deep focus:ring-2 focus:ring-blush/40",
            error && "border-accent focus:ring-accent/30",
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute end-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition hover:bg-blush-soft hover:text-foreground"
          aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
      {error && <span className="block text-xs text-accent">{error}</span>}
    </label>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function AuthSelect({
  label,
  error,
  options,
  placeholder = "اختاري…",
  className,
  id,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select
        id={fieldId}
        className={cn(
          "h-12 w-full appearance-none rounded-full border border-border/80 bg-white bg-[length:1rem] bg-[position:left_1.1rem_center] bg-no-repeat pe-5 ps-5 text-sm text-foreground outline-none transition focus:border-blush-deep focus:ring-2 focus:ring-blush/40",
          "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%237a6568%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m4 6 4 4 4-4%22/%3E%3C/svg%3E')]",
          error && "border-accent focus:ring-accent/30",
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="block text-xs text-accent">{error}</span>}
    </label>
  );
}
