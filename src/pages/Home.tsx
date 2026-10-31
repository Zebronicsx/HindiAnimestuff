import { useMemo } from "react";
import Hero from "../components/Hero";
import Row from "../components/Row";
import MarqueeBand from "../components/Marquee";
import PosterCard from "../components/PosterCard";
import { allProgress, AnimeItem, collections, getById } from "../lib/catalog";
import { href, navigate } from "../lib/router";

export default function Home({ items }: { items: AnimeItem[] }) {
  const c = useMemo(() => collections(items), [items]);

  const continueWatching = useMemo(() => {
    const prog = allProgress();
    return Object.entries(prog)
      .filter(([k, p]) => p.t > 12 && p.dur - p.t > 20 && getById(k.split("::")[0]))
      .sort((a, b) => b[1].ts - a[1].ts)
      .slice(0, 14)
      .map(([k, p]) => ({ item: getById(k.split("::")[0])!, progress: p }));
  }, []);

  const randomPick = () => {
    const pick = c.anime[Math.floor(Math.random() * c.anime.length)];
    if (pick) navigate(`/title/${pick.id}`);
  };

  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <div>
      <Hero items={items} onRandom={randomPick} />

      <MarqueeBand />

      <div className="pt-10">
        {continueWatching.length > 0 && (
          <Row num={num()} chip="Resume" jp="続きを観る" title="Continue the" accent="madness" viewAll={href("/mylist")}>
            {continueWatching.map(({ item, progress }, i) => (
              <PosterCard key={item.id + progress.ts} item={item} progress={progress} index={i} />
            ))}
          </Row>
        )}

        <Row num={num()} chip="Trending" jp="今週の狂気" title="This week's" accent="freak picks" viewAll={href("/anime")}>
          {c.trending.map((it, i) => (
            <PosterCard key={it.id} item={it} rank={i < 10 ? i + 1 : undefined} index={i} />
          ))}
        </Row>

        <div className="relative">
          <p className="pointer-events-none absolute -right-8 top-2 select-none font-jp text-[13rem] font-black leading-none text-paper/[0.03]">アニメ</p>
          <Row num={num()} chip="Anime" jp="ヒンディー吹替" title="Anime ·" accent="Hindi dub" viewAll={href("/anime")}>
            {c.anime.slice(0, 18).map((it, i) => (
              <PosterCard key={it.id} item={it} index={i} />
            ))}
          </Row>
        </div>

        <Row num={num()} chip="Cinema" jp="映画館" title="Movies" accent="gallery" viewAll={href("/movies")}>
          {c.movies.slice(0, 18).map((it, i) => (
            <PosterCard key={it.id} item={it} index={i} />
          ))}
        </Row>

        <Row num={num()} chip="Series" jp="シリーズ" title="Web series" accent="vault" viewAll={href("/series")}>
          {c.series.slice(0, 18).map((it, i) => (
            <PosterCard key={it.id} item={it} index={i} />
          ))}
        </Row>

        <Row num={num()} chip="Top Rated" jp="最高評価" title="Certified" accent="bangers">
          {c.topRated.map((it, i) => (
            <PosterCard key={it.id} item={it} index={i} />
          ))}
        </Row>

        <Row num={num()} chip="Action" jp="戦闘" title="Adrenaline" accent="overdose">
          {c.genreRow("Action").map((it, i) => (
            <PosterCard key={it.id} item={it} index={i} />
          ))}
        </Row>

        <Row num={num()} chip="Fantasy" jp="異世界" title="Fantasy" accent="dimensions">
          {c.genreRow("Fantasy").map((it, i) => (
            <PosterCard key={it.id} item={it} index={i} />
          ))}
        </Row>
      </div>
    </div>
  );
}
