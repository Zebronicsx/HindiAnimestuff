import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { progress } from "@/db/schema";
import { getDetail } from "@/lib/data";
import WatchClient from "./WatchClient";

export const dynamic = "force-dynamic";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string; ep: string }>;
}) {
  const { id, ep } = await params;
  const data = await getDetail(id);
  if (!data) notFound();
  const num = Number(ep);
  if (!Number.isFinite(num)) notFound();
  const episode = data.episodes.find((e) => e.num === num);
  if (!episode) notFound();

  let initialPos = 0;
  try {
    const rows = await db
      .select()
      .from(progress)
      .where(and(eq(progress.animeId, id), eq(progress.episodeNum, num)))
      .limit(1);
    initialPos = rows[0]?.position ?? 0;
  } catch {}

  return (
    <WatchClient
      key={`${id}-${num}`}
      anime={data.anime}
      episodes={data.episodes}
      episode={episode}
      initialPos={initialPos}
    />
  );
}