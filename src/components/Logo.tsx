import { Play } from "lucide-react";
import { emblemImg as emblem } from "../assets/images";

interface LogoProps {
  variant?: "dark" | "light" | "mono" | "neon";
  showTag?: boolean;
  className?: string;
}

export default function Logo({ variant = "dark", showTag = false, className = "" }: LogoProps) {
  const nameCls =
    variant === "light" ? "text-ink" :
    variant === "mono" ? "text-zinc-300" :
    variant === "neon" ? "text-white [text-shadow:0_0_18px_rgba(255,255,255,0.45)]" : "text-paper";
  const freakCls =
    variant === "light" ? "text-oni-deep" :
    variant === "mono" ? "text-zinc-500" :
    variant === "neon" ? "text-oni [text-shadow:0_0_18px_rgba(255,42,42,0.8)]" : "text-oni";
  const chipCls =
    variant === "neon"
      ? "border-oni/60 shadow-[0_0_28px_-4px_rgba(255,42,42,0.65),0_0_24px_-6px_rgba(34,230,255,0.45)]"
      : "border-line shadow-[0_14px_38px_-12px_rgba(255,42,42,0.45)]";

  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <span className="relative">
        <span className={`relative block h-10 w-10 md:h-12 md:w-12 -skew-x-6 overflow-hidden rounded-[10px] border bg-black ${chipCls}`}>
          <img src={emblem} alt="AnimesFreak oni crest" draggable={false} className="h-full w-full scale-[1.02] object-cover" />
        </span>
        <span className="absolute -bottom-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-[6px] bg-oni text-white shadow-[0_4px_14px_rgba(255,42,42,0.6)]">
          <Play className="h-2.5 w-2.5 fill-current" />
        </span>
      </span>
      <span className="leading-none">
        <span className="-skew-x-6 select-none block">
          <span className={`font-display text-xl md:text-2xl uppercase tracking-tight ${nameCls}`}>Animes</span>
          <span className={`font-display text-xl md:text-2xl uppercase tracking-tight ${freakCls}`}>Freak</span>
        </span>
        {showTag && (
          <span className={`mt-1.5 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.42em] ${variant === "light" ? "text-ink/60" : "text-ash"}`}>
            <span className="inline-block h-px w-5 bg-current" />
            Stream the madness
          </span>
        )}
      </span>
    </span>
  );
}
