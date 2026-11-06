import { notFound } from "next/navigation";
import { getDetail } from "@/lib/data";
import { CATALOG, buildEpisodes } from "@/lib/catalog";
import WatchClient from "./WatchClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return CATALOG.flatMap((a) =>
    buildEpisodes(a).map((e) => ({ id: a.id, ep: String(e.num) }))
  );
}

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

  return (
    <WatchClient
      key={`${id}-${num}`}
      anime={data.anime}
      episodes={data.episodes}
      episode={episode}
    />
  );
}
