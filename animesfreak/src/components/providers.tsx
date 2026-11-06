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
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, AlertTriangle, X } from "lucide-react";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "@/lib/store";

/* ---------------- Toasts ---------------- */

type ToastType = "success" | "info" | "error";
interface Toast {
  id: number;
  msg: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

interface ToastCtx {
  toast: (msg: string, opts?: { type?: ToastType; action?: Toast["action"] }) => void;
}
const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

/* ---------------- Library (watchlist) ---------------- */

interface LibraryCtx {
  ids: Set<string>;
  loaded: boolean;
  inList: (id: string) => boolean;
  toggle: (id: string, title?: string) => void;
}
const LibraryContext = createContext<LibraryCtx>({
  ids: new Set(),
  loaded: false,
  inList: () => false,
  toggle: () => {},
});
export const useLibrary = () => useContext(LibraryContext);

/* ---------------- UI (search overlay) ---------------- */

interface UICtx {
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
}
const UIContext = createContext<UICtx>({ searchOpen: false, setSearchOpen: () => {} });
export const useUI = () => useContext(UIContext);

/* ---------------- Provider ---------------- */

export function AppProviders({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback<ToastCtx["toast"]>((msg, opts) => {
    const id = idRef.current++;
    setToasts((t) => [...t.slice(-3), { id, msg, type: opts?.type ?? "success", action: opts?.action }]);
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  useEffect(() => {
    setIds(new Set<string>(getWatchlist().ids));
    setLoaded(true);
  }, []);

  const inList = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback(
    (id: string, title?: string) => {
      const adding = !ids.has(id);
      setIds((prev) => {
        const next = new Set(prev);
        if (adding) next.add(id);
        else next.delete(id);
        return next;
      });
      if (adding) addToWatchlist(id);
      else removeFromWatchlist(id);
      if (adding) {
        toast(`${title ?? "Title"} My List mein add ho gaya`, { type: "success" });
      } else {
        toast(`${title ?? "Title"} My List se hata diya`, {
          type: "info",
          action: {
            label: "Undo",
            onClick: () => {
              setIds((prev) => new Set(prev).add(id));
              addToWatchlist(id);
            },
          },
        });
      }
    },
    [ids, toast]
  );

  const lib = useMemo(() => ({ ids, loaded, inList, toggle }), [ids, loaded, inList, toggle]);
  const ui = useMemo(() => ({ searchOpen, setSearchOpen }), [searchOpen]);
  const tc = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={tc}>
      <LibraryContext.Provider value={lib}>
        <UIContext.Provider value={ui}>
          {children}
          {/* toast stack */}
          <div className="fixed bottom-4 left-1/2 z-[95] flex w-[min(94vw,380px)] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-5 sm:translate-x-0">
            <AnimatePresence>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="glass flex items-center gap-3 rounded-2xl bg-raised/90 px-4 py-3 shadow-card"
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full ${
                      t.type === "success"
                        ? "bg-mint/15 text-mint"
                        : t.type === "error"
                          ? "bg-primary/15 text-primary-soft"
                          : "bg-cyanic/15 text-cyanic"
                    }`}
                  >
                    {t.type === "success" ? (
                      <Check className="size-4" />
                    ) : t.type === "error" ? (
                      <AlertTriangle className="size-4" />
                    ) : (
                      <Info className="size-4" />
                    )}
                  </span>
                  <p className="flex-1 text-[13px] font-medium leading-snug text-fg">{t.msg}</p>
                  {t.action && (
                    <button
                      onClick={() => {
                        t.action?.onClick();
                        dismiss(t.id);
                      }}
                      className="focus-ring shrink-0 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary-soft transition hover:bg-primary/30"
                    >
                      {t.action.label}
                    </button>
                  )}
                  <button
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss"
                    className="shrink-0 text-dim transition hover:text-fg"
                  >
                    <X className="size-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </UIContext.Provider>
      </LibraryContext.Provider>
    </ToastContext.Provider>
  );
}