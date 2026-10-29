Aniclux — Deploy on Cloudflare Pages
====================================
1. Upload the entire anistream folder contents (not the folder name) as the project root.
2. Build command: (none / empty)
3. Output directory: /
4. URLs work like:
   https://aniclux.pages.dev/
   https://aniclux.pages.dev/anime/attack-on-titan-season-4
   https://aniclux.pages.dev/browse
5. _redirects handles SPA routing automatically.

Local test:
  cd anistream
  python3 -m http.server 8080
  Open http://127.0.0.1:8080/

Abyss Player (v11)
------------------
- Dual playback: native HTML5 for direct media (workers.dev etc.), Abyss iframe for
  short.ink / short.icu / abysscdn / playhydrax / player.abyssplayer.com URLs.
- Domain replacement script loads from jsDelivr (hydraxnet/player.html replace-domain.js).
- To use Abyss for new uploads: host videos on Abyss/Hydrax and put embed URLs
  (e.g. https://short.ink/{id} or https://player.abyssplayer.com/?v={id}) in episode_links.
- Upload example (your API key): curl -F "file=@demo.mp4" up.hydrax.net/<YOUR_KEY>
- No Abyss API secrets are stored in frontend code.
- Client protections: context-menu block on player shell, controlslist=nodownload,
  no-select on player. These are casual deterrents only — not DRM.
