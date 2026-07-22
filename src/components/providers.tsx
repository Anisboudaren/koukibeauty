"use client";

import type { ReactNode } from "react";
import { BusyProvider } from "@/components/busy-overlay";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BusyProvider>
      {children}
      <Toaster />
    </BusyProvider>
  );
}
