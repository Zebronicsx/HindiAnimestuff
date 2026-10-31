# AnimesFreak — Stream the Madness

A fully static anime OTT front-end (React + Vite + Tailwind, compiled to a **single HTML file**).

The entire catalog (1,715 titles, 15,500+ episode/movie links) is **embedded into the build**.
There is no backend, no API call and no database — so the site runs anywhere that can serve HTML.

> [!IMPORTANT]
> Run `npm run build` before uploading. The build turns the project-root **`index.html`** into the
> compiled, self-contained website and also creates identical copies at `deploy/index.html` and
> `dist/index.html`. Upload any one of those files as the host's root `index.html`.

---

## 1. Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # outputs dist/index.html (self-contained)
npm run preview    # optional local production preview
```

The original Vite development page is stored as `index.source.html`. `predev` / `prebuild` restore
that template automatically, while `postbuild` replaces the root `index.html` with the compiled site.

> `index.html`, `dist/index.html` and `deploy/index.html` contain all JS, CSS, the brand images and the full catalog inline.
> You can double-click it, drag it into a browser, or upload just that one file.

---

## 2. Deploy anywhere (static hosting)

Build settings are identical on every platform:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output / publish directory | `dist` |
| Framework preset | Vite (or "None / Other") |
| Node version | 18+ |
| Env variables | none |

### Cloudflare Pages
1. Push this folder to GitHub, or run `npx wrangler pages deploy dist`.
2. In the dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Build command `npm run build`, output directory `dist`.
4. No redirect rules needed — routing is hash based (`/#/anime`), so every deep link
   resolves to `index.html` automatically.

### Vercel
1. `vercel` CLI, or **Add New → Project** and import the repo.
2. Vercel auto-detects Vite. Confirm output directory is `dist`.
3. Deploy. `vercel.json` in this repo already pins the build/output settings.

### Firebase Hosting
```bash
npm i -g firebase-tools
firebase login
firebase init hosting      # "Use an existing project"
#   public directory: dist
#   single-page app rewrite: No  (hash routing needs no rewrites)
npm run build
firebase deploy --only hosting
```
`firebase.json` is already included with `"public": "dist"`.

### Netlify / GitHub Pages / any cPanel / S3
Upload the contents of `dist/` (one file). No server config, rewrites or PHP required.

---

## 3. Editing the catalog

The source of truth is [`Zebronicsx/HindiAnimestuff`](https://github.com/Zebronicsx/HindiAnimestuff).

The compact dataset lives at `src/data/catalog.json` and is imported at build time:

```
src/data/catalog.json  →  src/lib/catalog.ts (decode)  →  UI
```

Compact row format (see `src/lib/catalog.ts`):

```
[id, cat, season, title, poster, rating, genres, quality, episodeTag,
 languages, runtime, subtitle, episodes, type, trending, description,
 downloads, episodes[]]
```

URL tokens: `W<worker-id>|<filename>` and `T<tmdb-path>` keep the bundle small.
To refresh the catalog, replace `src/data/catalog.json` with a re-generated compact file
(or point `loadCatalog()` back at a fetch if you prefer a live feed).

---

## 4. Important note about playback (MKV)

The upstream source provides **MKV (x264 / x265 HEVC)** files. Browsers cannot demux MKV,
so an HTML5 `<video>` will stay black no matter the host.

The app detects the real file format from the link and:

* **MP4** → streams instantly in the built-in player (progress, resume, quality, speed).
* **MKV** → shows a native-player screen with **Download**, **Open direct link**, **Copy link**
  and **Play in VLC** (Android intent). Files open in VLC / MX Player.
* **Host landing pages** (`filesdl`, `hubcloud`, …) → download-page handling.

For real in-browser playback of every title you need MP4/HLS links or a transcoding server
(e.g. an HLS packager). Raw MKV cannot be played by browsers.

---

## 5. Local data & privacy

`localStorage` stores only My List and watch progress (last 60 entries).
No analytics, no cookies, no accounts. If storage is blocked (private mode / `file://`),
the site still works — saving and resume are simply disabled.

---

## 6. Mobile / app behaviour

- App-style bottom navigation (Home · Anime · Movies · Series · My List) with an action dock on
  title pages (Watch · Download · Save).
- Safe-area padding (`env(safe-area-inset-*)`), `viewport-fit=cover`, no horizontal scroll and no
  long-press/zoom gaps on phones from 320 px upward.
- `site.webmanifest` + icons in `public/icons/` enable **Install app** on Android/desktop Chrome
  (iOS: Share → Add to Home Screen). The header install button and the footer CTA use the same flow.
- The PWA icon is the oni-mask artwork (`public/app-icon.png`, embedded as `emblemImg`).

## 7. Link privacy

Raw file URLs are never placed in the DOM, anchors, tooltips or clipboard. Downloads are started
through a hidden, sandboxed iframe; the player holds the URL only in the `src` of its `<video>`.
There is no copy-link button anywhere and no `href` points to a media host. Every upstream file name
keeps its original `[Visit On Telegram @HindiAnimestuff]` credit, displayed in the player's file line.

> Browsers still expose URLs in DevTools / network logs — this protects the UI surface, not the client.
