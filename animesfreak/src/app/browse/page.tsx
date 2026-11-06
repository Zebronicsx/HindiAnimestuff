import { Suspense } from "react";
import { getAll } from "@/lib/data";
import { ALL_GENRES } from "@/lib/catalog";
import BrowseClient from "./BrowseClient";

export default async function BrowsePage() {
  const all = await getAll();
  return (
    <Suspense>
      <BrowseClient initial={all} genres={ALL_GENRES} />
    </Suspense>
  );
}