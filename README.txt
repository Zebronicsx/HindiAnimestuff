AnimesFreak — Deploy on Cloudflare Pages
========================================
1. Upload the entire anistream folder contents (not the folder name) as the project root.
2. Build command: (none / empty)
3. Output directory: /
4. URLs work like:
   https://your-site.pages.dev/
   https://your-site.pages.dev/anime/attack-on-titan-season-4
   https://your-site.pages.dev/browse
5. _redirects handles SPA routing automatically.

Local test:
  cd anistream
  python3 -m http.server 8080
  Open http://127.0.0.1:8080/

EmailJS is configured for Comments / Report / Request / DMCA forms.
