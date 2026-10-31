import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { notify } from "../lib/download";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * "Add to home screen" support.
 * Android / desktop Chrome fires beforeinstallprompt; iOS gets clear manual steps.
 */
export default function InstallApp({ variant = "header" }: { variant?: "header" | "footer" }) {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      notify("AnimesFreak app installed. Open it from your home screen anytime.");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPrompt(null);
      return;
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    notify(
      ios
        ? "iPhone: tap Share, then “Add to Home Screen” to install AnimesFreak."
        : "Open the browser menu (⋮) and choose “Install app” / “Add to Home screen”."
    );
  };

  if (variant === "footer") {
    return (
      <button
        onClick={install}
        data-hover
        className="slash-sweep mt-7 flex items-center gap-3 bg-oni px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.26em] text-white transition-colors hover:bg-oni-deep cut-corner-sm"
      >
        <Smartphone className="h-4 w-4" />
        Install the app
        <Download className="h-3.5 w-3.5 opacity-70" />
      </button>
    );
  }

  return (
    <button
      onClick={install}
      data-hover
      title="Install AnimesFreak as an app"
      aria-label="Install AnimesFreak as an app"
      className="flex h-10 shrink-0 items-center justify-center gap-2 border border-line bg-coal/70 px-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-paper/80 backdrop-blur transition-colors hover:border-oni hover:text-oni md:h-11 md:px-3.5"
    >
      <Download className="h-4 w-4 text-oni" />
      <span className="hidden sm:inline">Install</span>
    </button>
  );
}

/** optional dismissible hint used once on small screens */
export function InstallHint() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem("af:install-hint")) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setOpen(true), 2200);
    return () => window.clearTimeout(t);
  }, []);
  if (!open) return null;
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem("af:install-hint", "1");
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="fixed inset-x-3 bottom-[74px] z-[79] flex items-center gap-3 border border-oni/40 bg-coal/95 p-3 shadow-[0_18px_50px_-18px_rgba(255,42,42,.65)] backdrop-blur-xl lg:hidden">
      <Smartphone className="h-5 w-5 shrink-0 text-oni" />
      <p className="min-w-0 flex-1 text-[11px] leading-snug text-paper/75">Install AnimesFreak for a full-screen app experience.</p>
      <span className="shrink-0 [&_button]:h-9 [&_button]:px-3 [&_button]:text-[9px]">
        <InstallApp />
      </span>
      <button onClick={close} aria-label="Dismiss" className="shrink-0 text-ash">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
