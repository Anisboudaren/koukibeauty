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
import type { LmsState, Session } from "./types";
import * as store from "./store";
import { useBusy } from "@/components/busy-overlay";

const SESSION_KEY = "kouki-lms-session";

function loadSession(): Session {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      const legacy = store.loadState();
      return legacy.session;
    }
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function saveSession(session: Session) {
  if (typeof window === "undefined") return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export type ApplyOptions = {
  /** Skip full-screen busy overlay (e.g. marking a lesson done) */
  quiet?: boolean;
};

type LmsContextValue = {
  state: LmsState | null;
  ready: boolean;
  refresh: () => Promise<void>;
  apply: (next: LmsState, opts?: ApplyOptions) => void;
  store: typeof store;
};

const LmsContext = createContext<LmsContextValue | null>(null);

function useLmsStore(): LmsContextValue {
  const [state, setState] = useState<LmsState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyActive = useRef(false);
  const { showBusy, hideBusy } = useBusy();

  const refresh = useCallback(async () => {
    try {
      const [lmsRes, meRes] = await Promise.all([
        fetch("/api/lms"),
        fetch("/api/auth/me"),
      ]);
      if (!lmsRes.ok) throw new Error("lms fetch failed");
      const data = (await lmsRes.json()) as Omit<LmsState, "session">;
      let session = loadSession();
      if (meRes.ok) {
        session = { role: "admin" };
        saveSession(session);
      } else if (session?.role === "admin") {
        session = null;
        saveSession(null);
      }
      const next: LmsState = { ...data, session };
      setState(next);
      store.saveState(next);
    } catch {
      setState(store.loadState());
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persistRemote = useCallback(
    (next: LmsState, opts?: ApplyOptions) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const quiet = opts?.quiet === true;
      if (!quiet && !busyActive.current) {
        busyActive.current = true;
        showBusy("جاري الحفظ…");
      }
      saveTimer.current = setTimeout(() => {
        const { session: _, ...payload } = next;
        void _;
        const passwords = store.takePendingPasswords();
        const started = Date.now();
        void fetch("/api/lms", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, passwords }),
        })
          .catch(() => {
            /* keep local */
          })
          .finally(() => {
            if (!quiet) {
              const wait = Math.max(0, 350 - (Date.now() - started));
              window.setTimeout(() => {
                busyActive.current = false;
                hideBusy();
              }, wait);
            }
          });
      }, quiet ? 500 : 280);
    },
    [showBusy, hideBusy]
  );

  const apply = useCallback(
    (next: LmsState, opts?: ApplyOptions) => {
      saveSession(next.session);
      store.saveState(next);
      setState(next);
      persistRemote(next, opts);
    },
    [persistRemote]
  );

  return useMemo(
    () => ({
      state,
      ready: state !== null,
      refresh,
      apply,
      store,
    }),
    [state, refresh, apply]
  );
}

export function LmsProvider({ children }: { children: ReactNode }) {
  const value = useLmsStore();
  return <LmsContext.Provider value={value}>{children}</LmsContext.Provider>;
}

export function useLms(): LmsContextValue {
  const ctx = useContext(LmsContext);
  if (!ctx) {
    throw new Error("useLms must be used within LmsProvider");
  }
  return ctx;
}
