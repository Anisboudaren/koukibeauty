"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-center"
      dir="rtl"
      richColors
      closeButton
      duration={6000}
      toastOptions={{
        classNames: {
          toast: "font-[family-name:var(--font-cairo)] text-sm",
          title: "text-sm font-medium",
          description: "text-xs",
        },
      }}
      {...props}
    />
  );
}
