import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pure static site: works on Firebase Hosting, Cloudflare Pages, Netlify, GitHub Pages...
  output: "export",
  // /anime/foo/ -> out/anime/foo/index.html (no rewrite rules needed on any host)
  trailingSlash: true,
  // Next's image optimizer needs a server; we use plain <img> anyway.
  images: { unoptimized: true },
};

export default nextConfig;
