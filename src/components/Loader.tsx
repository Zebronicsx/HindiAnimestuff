import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { emblemImg as emblem } from "../assets/images";

export default function Loader({ ready }: { ready: boolean }) {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setPct((p) => Math.min(ready ? 100 : 92, p + 3 + Math.random() * 6));
    }, 90);
    return () => clearInterval(iv);
  }, [ready]);

  useEffect(() => {
    if (pct >= 100 && ready) {
      const t = setTimeout(() => setDone(true), 350);
      return () => clearTimeout(t);
    }
  }, [pct, ready]);

  if (done) return null;

  return (
    <motion.div
      exit={{ y: "-100%" }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[120] grid place-items-center overflow-hidden bg-ink"
    >
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="text-stroke font-display text-[22vw] uppercase leading-none opacity-30 select-none">
          Freak
        </span>
      </div>

      <div className="relative flex flex-col items-center gap-9">
        <motion.div
          initial={{ scale: 0.5, rotate: -14, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 16 }}
          className="relative"
        >
          <div className="absolute -inset-8 animate-pulse-glow rounded-full bg-oni/25 blur-2xl" />
          <div className="relative h-28 w-28 -skew-x-6 overflow-hidden rounded-3xl border border-oni/50 shadow-[0_0_60px_-8px_rgba(255,42,42,0.7)]">
            <img src={emblem} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-lg bg-oni text-white shadow-lg">
            <Play className="h-3 w-3 fill-current" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-center"
        >
          <p className="font-jp text-sm font-bold tracking-[0.5em] text-oni">アニメフリーク</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.5em] text-ash">
            Tuning the signal
          </p>
        </motion.div>

        <div className="flex w-56 flex-col items-center gap-3">
          <div className="h-[3px] w-full overflow-hidden bg-paper/10">
            <div
              className="h-full bg-oni shadow-[0_0_12px_rgba(255,42,42,0.8)] transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-ash">
            {String(Math.floor(pct)).padStart(3, "0")}% — SYNCING VAULT
          </p>
        </div>
      </div>
    </motion.div>
  );
}
