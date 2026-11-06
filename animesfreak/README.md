# AnimesFreak (static)

Pure static site (Next.js `output: "export"`). No database, no server.
Watchlist + watch history are saved in the visitor's browser (localStorage).

## Build
```bash
npm install
npm run build        # -> ./out
```

## Firebase Hosting
```bash
npm i -g firebase-tools
firebase login
firebase init hosting   # public dir: out | SPA rewrite: No | overwrite: No
npm run deploy:firebase
```
`firebase.json` is already configured (cleanUrls, cache headers).

## Cloudflare Pages
Dashboard (GitHub connect):
- Build command: `npm install && npm run build`
- Build output directory: `out`
- Environment variable: `NODE_VERSION` = `22`

Or direct upload from terminal:
```bash
npm run deploy:cloudflare
```
`public/_headers` handles caching/security headers.

## Adding titles
Edit `src/db/catalog.json` (+ `SYNOPSIS` / rank lists in `src/lib/catalog.ts`), then rebuild and redeploy.
