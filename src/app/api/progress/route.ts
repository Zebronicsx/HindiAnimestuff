import { db } from "@/db";
import { anime, episodes, progress } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { rowToAnime } from "@/lib/catalog";
import type { ProgressItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const animeId = new URL(req.url).searchParams.get("animeId");
  try {
    const rows = await db
      .select({ p: progress, a: anime })
      .from(progress)
      .innerJoin(anime, eq(anime.id, progress.animeId))
      .where(animeId ? eq(progress.animeId, animeId) : undefined)
      .orderBy(desc(progress.updatedAt))
      .limit(animeId ? 60 : 24);

    const items: ProgressItem[] = [];
    for (const r of rows) {
      const ep = await db
        .select({ title: episodes.title })
        .from(episodes)
        .where(
          and(eq(episodes.animeId, r.p.animeId), eq(episodes.num, r.p.episodeNum))
        )
        .limit(1);
      items.push({
        animeId: r.p.animeId,
        episodeNum: r.p.episodeNum,
        position: r.p.position,
        duration: r.p.duration,
        updatedAt: r.p.updatedAt.toISOString(),
        anime: rowToAnime(r.a),
        episodeTitle: ep[0]?.title ?? `Episode ${r.p.episodeNum}`,
      });
    }
    return Response.json({ items });
  } catch {
    return Response.json({ items: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      animeId?: string;
      episodeNum?: number;
      position?: number;
      duration?: number;
    };
    const { animeId, episodeNum, position, duration } = body;
    if (!animeId || !episodeNum)
      return Response.json({ error: "animeId and episodeNum required" }, { status: 400 });
    await db
      .insert(progress)
      .values({
        animeId,
        episodeNum,
        position: Math.max(0, Math.round(position ?? 0)),
        duration: Math.max(0, Math.round(duration ?? 0)),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [progress.animeId, progress.episodeNum],
        set: {
          position: Math.max(0, Math.round(position ?? 0)),
          duration: Math.max(0, Math.round(duration ?? 0)),
          updatedAt: new Date(),
        },
      });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to save progress" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const animeId = url.searchParams.get("animeId");
    const all = url.searchParams.get("all");
    if (all === "1") {
      await db.delete(progress).where(sql`true`);
    } else if (animeId) {
      const ep = url.searchParams.get("ep");
      await db
        .delete(progress)
        .where(
          ep
            ? and(eq(progress.animeId, animeId), eq(progress.episodeNum, Number(ep)))
            : eq(progress.animeId, animeId)
        );
    } else {
      return Response.json({ error: "animeId or all required" }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}