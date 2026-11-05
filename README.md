# AnimesFreak — Cloudflare Pages Ready

Hindi-dubbed anime streaming site, configured for **Cloudflare Pages / Workers** via OpenNext.

## Features that work without a database
- Full catalog browsing (from bundled `catalog.json`)
- Anime detail pages + episode lists
- Watch player pages
- Trending / Movies / Browse
- Search

Watchlist & Continue Watching only work when a real `DATABASE_URL` (Postgres) is provided.

## Deploy to Cloudflare Pages (recommended)

### 1. Push this folder to GitHub
```bash
# from the animesfreak folder
git init
git add .
git commit -m "AnimesFreak Cloudflare-ready"
# create a new repo on GitHub then:
git remote add origin https://github.com/YOUR_USER/animesfreak.git
git branch -M main
git push -u origin main
```

### 2. Connect to Cloudflare Pages
1. Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com/)
2. Create → Pages → Connect to Git → select your repo
3. Build settings:
   - **Framework preset**: None (or Next.js)
   - **Build command**: `npx @opennextjs/cloudflare build`
   - **Build output directory**: `.open-next`
   - **Root directory**: `/` (or the folder if nested)
4. Environment variables (optional):
   - `DATABASE_URL` → only if you have a Postgres (Neon, Supabase, etc.)
5. Deploy!

### 3. Or deploy from CLI
```bash
npm install
npx @opennextjs/cloudflare build
npx @opennextjs/cloudflare deploy
```

## Local development
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Local Cloudflare preview
```bash
npm run preview
```

## Notes
- Images are set to `unoptimized` so they work without Cloudflare Images binding.
- The app falls back to static catalog when Postgres is unavailable — perfect for free Cloudflare Pages.
- Later you can add D1 + Hyperdrive for real user data.

Site: https://animesfreak.pages.dev/
