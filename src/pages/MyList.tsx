import { useEffect, useState } from "react";
import { Flame, Plus } from "lucide-react";
import PosterCard from "../components/PosterCard";
import Logo from "../components/Logo";
import { AnimeItem, getById, getMyList, onMyListChange } from "../lib/catalog";
import { href } from "../lib/router";

export default function MyList() {
  const [ids, setIds] = useState<string[]>(getMyList());
  useEffect(() => onMyListChange(() => setIds(getMyList())), []);
  const items = ids.map((id) => getById(id)).filter(Boolean) as AnimeItem[];

  return (
    <div className="min-h-screen pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
        <div className="relative mb-10">
          <p aria-hidden className="pointer-events-none absolute -right-4 -top-8 select-none overflow-hidden font-jp text-[5rem] sm:text-[7rem] md:text-[9rem] font-black leading-none text-paper/[0.03]">
            保存
          </p>
          <div className="mb-5 flex items-center gap-4">
            <span className="border border-oni/40 bg-oni/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-oni">
              Vault — Saved
            </span>
            <span className="font-jp text-xs font-bold text-ash">マイリスト</span>
          </div>
          <h1 className="font-display uppercase leading-[0.9] text-paper" style={{ fontSize: "clamp(2.6rem, 6vw, 5rem)" }}>
            My <span className="text-oni">List</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm text-paper/60">
            Your saved titles. Use the <Plus className="inline h-3.5 w-3.5 text-oni" /> icon on any poster to add it
            to the vault. <span className="text-paper">{ids.length}</span> signals saved.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-line py-24 text-center blueprint-oni">
            <Logo variant="mono" showTag className="justify-center opacity-60" />
            <p className="mt-8 font-display text-2xl uppercase text-paper/50">Your vault is empty</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
              Hover any poster and hit + to keep that title here for later.
            </p>
            <a
              href={href("/anime")}
              data-hover
              className="slash-sweep mt-8 inline-flex items-center gap-3 bg-oni px-8 py-4 text-xs font-bold uppercase tracking-[0.3em] text-white transition-colors hover:bg-oni-deep cut-corner"
            >
              <Flame className="h-4 w-4 fill-current" />
              Explore Anime
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-6">
            {items.map((it, i) => (
              <PosterCard key={it.id} item={it} index={i} fill />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
