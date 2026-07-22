"use client";

import type { ReactNode } from "react";
import { BusyProvider } from "@/components/busy-overlay";
import { Toaster } from "@/components/ui/sonner";
import { LmsProvider } from "@/lib/lms/use-lms";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BusyProvider>
      <LmsProvider>
        {children}
        <Toaster />
      </LmsProvider>
    </BusyProvider>
  );
}
