import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudflare Images or remote patterns for AniList / CDN posters
    remotePatterns: [
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "**.anilist.co" },
      { protocol: "https", hostname: "**.cloudflare.com" },
      { protocol: "https", hostname: "**.pages.dev" },
    ],
    unoptimized: true, // simpler on Cloudflare; enable Cloudflare Images later if needed
  },

  // Avoid bundling native Node modules that Workers cannot run
  serverExternalPackages: ["pg", "drizzle-orm"],
};

export default nextConfig;
