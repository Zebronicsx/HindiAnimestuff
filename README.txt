AnimesFreak — deploy (Cloudflare Pages / Netlify)
==================================================
1. Upload the CONTENTS of this folder as the project root (index.html at the root).
2. _redirects gives SPA routing, _headers gives caching/security headers.

Speed
- Home loads only anime_index.json (~170 KB). Each title's episode links load on demand from data/<id>.json.
- Posters use right-sized TMDB images (w342/w500/w780), not "original".

Email (EmailJS) — comments, report, request, DMCA, contact
- Config lives at the top of the "Email (EmailJS)" block in app.js (EMAILJS_CFG).
- All forms REQUIRE a valid email; the sender's email is sent as reply_to.
- Template fields used: page_title, page_url, from_name, reply_to, message.

Player protection
- No native download button, no right-click, no PiP/cast, drifting watermark, links base64-encoded in data/*.json.
- A plain <video> can never be 100% un-downloadable without DRM — this removes every easy path.

Source data (NOT deployed): ../source-private/anime_data.json — keep it private; regenerate data/ from it with the split script.

Local preview: run `python serve.py 8080` inside this folder, then open http://localhost:8080 (plain `python -m http.server` can't open /anime/... deep links).
