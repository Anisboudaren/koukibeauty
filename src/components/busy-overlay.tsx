"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BusyContextValue {
  busy: boolean;
  message: string;
  showBusy: (message?: string) => void;
  hideBusy: () => void;
  withBusy: <T>(promise: Promise<T>, message?: string) => Promise<T>;
}

const BusyContext = createContext<BusyContextValue | null>(null);

const DEFAULT_MESSAGE = "جاري المعالجة…";

export function BusyOverlay({
  show,
  message = DEFAULT_MESSAGE,
  className,
}: {
  show: boolean;
  message?: string;
  className?: string;
}) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center bg-background/55 backdrop-blur-md",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-surface/90 px-8 py-6 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}

export function BusyProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const depthRef = useRef(0);

  useEffect(() => {
    depthRef.current = 0;
    setBusy(false);
    setMessage(DEFAULT_MESSAGE);
  }, [pathname]);

  useEffect(() => {
    if (!busy) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [busy]);

  const showBusy = useCallback((msg?: string) => {
    depthRef.current += 1;
    if (msg) setMessage(msg);
    setBusy(true);
  }, []);

  const hideBusy = useCallback(() => {
    depthRef.current = Math.max(0, depthRef.current - 1);
    if (depthRef.current === 0) {
      setBusy(false);
      setMessage(DEFAULT_MESSAGE);
    }
  }, []);

  const withBusy = useCallback(
    async <T,>(promise: Promise<T>, msg?: string) => {
      showBusy(msg);
      try {
        return await promise;
      } finally {
        hideBusy();
      }
    },
    [showBusy, hideBusy]
  );

  const value = useMemo(
    () => ({ busy, message, showBusy, hideBusy, withBusy }),
    [busy, message, showBusy, hideBusy, withBusy]
  );

  return (
    <BusyContext.Provider value={value}>
      {children}
      <BusyOverlay show={busy} message={message} />
    </BusyContext.Provider>
  );
}

/** Returns busy helpers when inside BusyProvider; no-ops otherwise. */
export function useBusy(): BusyContextValue {
  const ctx = useContext(BusyContext);
  if (ctx) return ctx;

  return {
    busy: false,
    message: DEFAULT_MESSAGE,
    showBusy: () => {},
    hideBusy: () => {},
    withBusy: async (promise) => promise,
  };
}
