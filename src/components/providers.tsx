"use client";

import type { ReactNode } from "react";
import { BusyProvider } from "@/components/busy-overlay";

export function Providers({ children }: { children: ReactNode }) {
  return <BusyProvider>{children}</BusyProvider>;
}
