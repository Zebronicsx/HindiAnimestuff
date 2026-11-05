import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  serial,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { DownloadLink } from "../lib/types";

export const anime = pgTable("anime", {
  id: text("id").primaryKey(),
  anilistId: integer("anilist_id").notNull(),
  title: text("title").notNull(),
  romaji: text("romaji").notNull().default(""),
  synopsis: text("synopsis").notNull().default(""),
  poster: text("poster").notNull(),
  banner: text("banner"),
  color: text("color"),
  score: real("score").notNull().default(0),
  year: integer("year").notNull().default(2020),
  type: text("type").notNull().default("series"),
  episodesCount: integer("episodes_count").notNull().default(12),
  genres: text("genres").array().notNull().default([]),
  languages: text("languages").array().notNull().default([]),
  qualities: text("qualities").array().notNull().default([]),
  studio: text("studio").notNull().default(""),
  trendingRank: integer("trending_rank"),
  featuredRank: integer("featured_rank"),
  isNew: boolean("is_new").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const episodes = pgTable(
  "episodes",
  {
    id: serial("id").primaryKey(),
    animeId: text("anime_id")
      .notNull()
      .references(() => anime.id, { onDelete: "cascade" }),
    num: integer("num").notNull(),
    title: text("title").notNull(),
    duration: integer("duration").notNull().default(1420),
    stream: text("stream").notNull(),
    downloads: jsonb("downloads").$type<DownloadLink[]>().notNull().default([]),
  },
  (t) => [uniqueIndex("ep_anime_num_idx").on(t.animeId, t.num)]
);

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  animeId: text("anime_id")
    .notNull()
    .unique()
    .references(() => anime.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const progress = pgTable(
  "progress",
  {
    id: serial("id").primaryKey(),
    animeId: text("anime_id")
      .notNull()
      .references(() => anime.id, { onDelete: "cascade" }),
    episodeNum: integer("episode_num").notNull(),
    position: integer("position").notNull().default(0),
    duration: integer("duration").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("progress_anime_ep_idx").on(t.animeId, t.episodeNum)]
);