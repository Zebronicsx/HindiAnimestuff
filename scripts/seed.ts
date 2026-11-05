import "dotenv/config";
import { db, pool } from "../src/db";
import { anime, episodes, watchlist, progress } from "../src/db/schema";
import { CATALOG, buildEpisodes } from "../src/lib/catalog";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Seeding AnimesFreak catalog…");

  for (const a of CATALOG) {
    await db
      .insert(anime)
      .values({
        id: a.id,
        anilistId: a.anilistId,
        title: a.title,
        romaji: a.romaji,
        synopsis: a.synopsis,
        poster: a.poster,
        banner: a.banner,
        color: a.color,
        score: a.score,
        year: a.year,
        type: a.type,
        episodesCount: a.episodesCount,
        genres: a.genres,
        languages: a.languages,
        qualities: a.qualities,
        studio: a.studio,
        trendingRank: a.trendingRank,
        featuredRank: a.featuredRank,
        isNew: a.isNew,
        createdAt: new Date(a.createdAt ?? Date.now()),
      })
      .onConflictDoUpdate({
        target: anime.id,
        set: {
          title: a.title,
          synopsis: a.synopsis,
          poster: a.poster,
          banner: a.banner,
          score: a.score,
          trendingRank: a.trendingRank,
          featuredRank: a.featuredRank,
          isNew: a.isNew,
          qualities: a.qualities,
          languages: a.languages,
        },
      });

    const eps = buildEpisodes(a);
    for (const e of eps) {
      await db
        .insert(episodes)
        .values({
          animeId: a.id,
          num: e.num,
          title: e.title,
          duration: e.duration,
          stream: e.stream,
          downloads: e.downloads,
        })
        .onConflictDoNothing();
    }
  }
  console.log(`✔ ${CATALOG.length} titles + episodes`);

  // Seed a believable library only on first run (never clobber user data)
  const wl = await db.select({ n: sql<number>`count(*)::int` }).from(watchlist);
  if ((wl[0]?.n ?? 0) === 0) {
    const picks = ["solo-leveling", "chainsaw-man", "spy-x-family", "your-name"];
    for (const id of picks) {
      if (CATALOG.some((a) => a.id === id)) {
        await db.insert(watchlist).values({ animeId: id }).onConflictDoNothing();
      }
    }
    console.log("✔ watchlist seeded");
  }

  const pr = await db.select({ n: sql<number>`count(*)::int` }).from(progress);
  if ((pr[0]?.n ?? 0) === 0) {
    const seeds = [
      { animeId: "solo-leveling", episodeNum: 3, pct: 0.52, hoursAgo: 2 },
      { animeId: "jujutsu-kaisen-season-2", episodeNum: 5, pct: 0.78, hoursAgo: 20 },
      { animeId: "one-piece", episodeNum: 12, pct: 0.18, hoursAgo: 50 },
      { animeId: "demon-slayer-kimetsu-no-yaiba", episodeNum: 8, pct: 0.35, hoursAgo: 96 },
    ];
    for (const s of seeds) {
      const ep = await db
        .select()
        .from(episodes)
        .where(sql`${episodes.animeId} = ${s.animeId} and ${episodes.num} = ${s.episodeNum}`)
        .limit(1);
      if (ep[0]) {
        await db
          .insert(progress)
          .values({
            animeId: s.animeId,
            episodeNum: s.episodeNum,
            position: Math.round(ep[0].duration * s.pct),
            duration: ep[0].duration,
            updatedAt: new Date(Date.now() - s.hoursAgo * 3600000),
          })
          .onConflictDoNothing();
      }
    }
    console.log("✔ continue-watching seeded");
  }

  const counts = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(anime),
    db.select({ n: sql<number>`count(*)::int` }).from(episodes),
  ]);
  console.log(`Done. anime=${counts[0][0].n} episodes=${counts[1][0].n}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});