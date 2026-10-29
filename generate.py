#!/usr/bin/env python3
"""
Static movie/anime/series download-page site generator (OTT-style UI).

USAGE:
    python3 generate.py

INPUT:
    data.json          -> define all content here (title, poster,
                           genres, quality, download links, trending, etc.)
    assets/            -> style.css, app.js, logo.svg, poster images

OUTPUT:
    output/            -> ready-to-host static site
        index.html, anime.html, movies.html, series.html, trending.html
        favourites.html, browse-az.html, browse-genres.html,
        how-to-download.html, report.html, pagination.html
        pages/<id>.html        (each title's own detail page)
        pages_az/<a-z>.html    (A-Z anime list, one page per letter)
        genres/<slug>.html     (one page per genre, across all categories)
        assets/                (copied from ./assets + generated data.js)

Design notes
------------
- Category/genre/A-Z GRID pages are pre-rendered server-side (build time),
  not client JS — so nothing needs a raw data dump to work.
- Genre chips on listing pages are still JS-built (client-side filter on
  the current page's cards) for instant filtering. In addition, dedicated
  genre/<slug>.html pages are now pre-rendered at build time so every
  genre is browsable from the menu and gets its own shareable URL.
- Search & Favourites need to work across the WHOLE catalog from any
  page, so a small assets/data.js (window.SITE_ITEMS) is generated with
  just the fields needed for that (id, title, poster, type, category) —
  this is unavoidable for client-side search/favourites on a static site.
- Homepage listing + search results (index.html and pagination.html) are
  URL-driven: /?s=<query>&genre=<genre>&page=<n>. Only page 1 (PER_PAGE cards)
  is pre-rendered into the HTML; assets/pagination.js renders every other page
  and all search results from window.SITE_ITEMS, so the DOM never holds the whole
  catalog. assets/search.js owns the normalized search index.
- Trending page: shows any item explicitly flagged "trending": true in
  data.json, automatically topped up with the highest-rated remaining
  titles so the page is never empty/sparse even if nothing was flagged.
"""

import json
import re
import shutil
import string
import hashlib
import base64
from datetime import datetime
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).parent
DATA_FILE = ROOT / "data.json"
TEMPLATES_DIR = ROOT / "templates"
ASSETS_DIR = ROOT / "assets"
OUTPUT_DIR = ROOT / "output"

# ---------------------------------------------------------------------------
# Obscured file names (source: "data.json & links.json / URLchecker.html se
# easily data mil jaata hai — isse naam change karo"). Renaming these two
# SHIPPED files (links.json + URLchecker.html are the ones that actually end
# up in output/, data.json never does) makes casual "view source" / guess-
# the-filename snooping much less trivial. This is NOT real security — a
# determined visitor with devtools open can still see whatever the page
# itself fetches at runtime, there is no way around that on a static host
# without a backend — but it stops the easy, drive-by case.
# ---------------------------------------------------------------------------
LINKS_JSON_NAME = "r6k2vdq.json"           # was: links.json
URL_REDIRECT_PAGE_NAME = "go-x9f4m.html"   # was: URLchecker.html
SITE_DATA_JS_NAME = "c8pz1k.js"            # was: assets/data.js (SITE_ITEMS)
DOWNLOAD_DATA_JS_NAME = "d4wq7n.js"        # was: assets/download-data.js (DOWNLOAD_MAP)

CATEGORY_LABELS = {
    "anime": "Anime",
    "movies": "Movies",
    "series": "Series",
}

LETTERS = list(string.ascii_uppercase)

TRENDING_TARGET_COUNT = 24
PER_PAGE = 12  # cards per page on the homepage / pagination.html listing (read by pagination.js)
HERO_CAROUSEL_MAX = 5
TELEGRAM_JOIN_URL = "https://t.me/+ZY6u10TE0PdjZmM1"

# ---------------------------------------------------------------------------
# Report-a-problem / comment email notifications — all via EmailJS (no
# Telegram). Comments already used this service/template; reports reuse the
# same EmailJS account so no new EmailJS setup is required. If you later
# create a dedicated "report" template in the EmailJS dashboard, just point
# REPORT_EMAILJS_TEMPLATE_ID at it — everything else stays the same.
# ---------------------------------------------------------------------------
EMAILJS_PUBLIC_KEY = "56w3ancDyfmhbnEV8"
EMAILJS_SERVICE_ID = "service_fmdbxah"
COMMENT_EMAILJS_TEMPLATE_ID = "template_yfidj4o"
REPORT_EMAILJS_TEMPLATE_ID = "template_yfidj4o"

# Future ad networks (Adsterra / Monetag) — set enabled=True and fill slot HTML in templates
AD_CONFIG = {
    "enabled": False,
    "networks": ["adsterra", "monetag"],
    "slots": ["home_banner", "download_page", "file_page", "detail_footer"],
}

def load_data():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def poster_src(poster, root_prefix="", width=0):
    """Poster URL for templates. width=0 returns exactly what the templates used
    to print (so untouched pages stay byte-identical). With a width, TMDB
    "original" posters are swapped for the matching w<width> size - a card that
    shows at ~170px does not need the multi-megabyte original. Any other host is
    returned unchanged. pagination.js/search.js mirror this in HAS_SEARCH.poster()."""
    if not poster.startswith("http"):
        return root_prefix + poster
    if width and "://image.tmdb.org/t/p/original/" in poster:
        return poster.replace("/t/p/original/", "/t/p/w%d/" % int(width), 1)
    return poster


def rewrite_redirect_url(url):
    """data.json has some movie/series download values pointing at
    '/URLchecker.html?id=...' (the old redirect-gate filename). Rather than
    hand-editing data.json, point those at the renamed file at build time."""
    if url and url.startswith("/URLchecker.html"):
        return "/" + URL_REDIRECT_PAGE_NAME + url[len("/URLchecker.html"):]
    return url


def download_entries(item):
    """Normalize ANY item's downloads into [(key, label, {quality: url}), ...]
    - anime episodes (episode_links), multi-part movies (parts), or a plain
    single movie/series (downloads) all become the same shape. This is what
    lets movies/series go through the exact same "Download button -> list
    page -> file.html gate" flow as anime, instead of exposing quality
    hrefs directly on the info page."""
    if item.get("episode_links"):
        order = sorted(item["episode_links"].keys(), key=lambda x: int(re.sub(r"\D", "", x) or 0))
        return [(ep, f"Episode {ep}", item["episode_links"][ep]) for ep in order]
    if item.get("parts"):
        return [
            (f"part{n + 1}", p.get("label") or f"Part {n + 1}", p.get("downloads") or {})
            for n, p in enumerate(item["parts"])
        ]
    if item.get("downloads"):
        return [("main", "Download", item["downloads"])]
    return []


def unique_by_id(items):
    """Drop repeated ids, keeping the LAST occurrence (its page is the one that
    survives in pages/<id>.html, because later writes overwrite earlier ones).
    data.json currently has a few duplicated ids. search.js applies the same rule,
    so the pre-rendered first page always equals what the JS would render."""
    last = {it["id"]: n for n, it in enumerate(items)}
    return [it for n, it in enumerate(items) if last[it["id"]] == n]


def build_env():
    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))
    env.filters["poster_src"] = poster_src
    return env


def clean_output():
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)
    (OUTPUT_DIR / "pages").mkdir()
    (OUTPUT_DIR / "pages_az").mkdir()
    (OUTPUT_DIR / "genres").mkdir()
    (OUTPUT_DIR / "download").mkdir()


def copy_assets():
    dest = OUTPUT_DIR / "assets"
    shutil.copytree(ASSETS_DIR, dest)


def copy_root_static_files():
    """The redirect-gate page + its data file power the download-redirect
    flow and must live at the SITE ROOT (not inside assets/), so they're
    copied straight into output/ on every build instead of being hand-
    managed. Their on-disk source names stay the old URLchecker.html /
    links.json (so local tooling that touches them keeps working) but they
    SHIP under obscured names (LINKS_JSON_NAME / URL_REDIRECT_PAGE_NAME
    above) so the public-facing filenames don't reveal what they do."""
    src = ROOT / "URLchecker.html"
    if src.exists():
        shutil.copy2(src, OUTPUT_DIR / URL_REDIRECT_PAGE_NAME)
    src = ROOT / "links.json"
    if src.exists():
        raw = json.loads(src.read_text(encoding="utf-8"))
        # Base64-wrap every target so a casual view of this file isn't
        # instantly readable plaintext URLs (still trivially decodable by
        # anyone who looks at go-x9f4m.html's own JS — this is obfuscation,
        # not real security; a truly private per-id lookup needs a backend).
        encoded = {
            k: base64.b64encode(v.encode("utf-8")).decode("ascii") if v else v
            for k, v in raw.items()
        }
        (OUTPUT_DIR / LINKS_JSON_NAME).write_text(
            json.dumps(encoded, ensure_ascii=False), encoding="utf-8"
        )
    src = ROOT / "manifest.json"
    if src.exists():
        shutil.copy2(src, OUTPUT_DIR / "manifest.json")


def write_data_js(items):
    """Small embedded catalog for client-side search, listing & favourites.
    genres/languages/year/industry/starcast are only used by search.js (they make
    those fields searchable); they are omitted when empty to keep the file small."""
    slim = []
    for i in items:
        rec = {
            "id": i["id"],
            "title": i["title"],
            "poster": i["poster"],
            "type": i.get("type", ""),
            "category": i.get("category", ""),
            "season": i.get("season", ""),
            "rating": i.get("rating", ""),
            "episode_tag": i.get("episode_tag", ""),
        }
        for key in ("genres", "languages", "year", "industry", "starcast"):
            if i.get(key):
                rec[key] = i[key]
        slim.append(rec)
    js = "window.SITE_ITEMS = " + json.dumps(slim, ensure_ascii=False) + ";\n"
    (OUTPUT_DIR / "assets" / SITE_DATA_JS_NAME).write_text(js, encoding="utf-8")


def write_download_data_js(items):
    """Map of sid -> ep/part key -> quality -> {url, name} for the file
    download page. Now covers anime episodes AND movies/series alike
    (download_entries() normalizes all three shapes) so movies/series go
    through the same "nothing but JS, resolved only on click" gate as
    anime, instead of a visible href on the info page.

    The whole map is base64-wrapped (JSON.parse(atob("..."))) since raw
    mirror/worker URLs are the most sensitive thing this site ships — data.js
    (SITE_ITEMS) doesn't need this, it's just public catalog info already
    shown on every listing page.
    """
    from urllib.parse import urlparse, parse_qs, unquote

    download_map = {}
    for item in items:
        entries = download_entries(item)
        if not entries:
            continue
        sid = item["id"]
        download_map[sid] = {}
        for key, label, quals in entries:
            download_map[sid][key] = {}
            for q, url in quals.items():
                if not url:
                    continue
                url = rewrite_redirect_url(url)
                name = ""
                try:
                    qs = parse_qs(urlparse(url).query)
                    name = unquote(qs.get("name", [""])[0])
                except Exception:
                    name = ""
                if not name:
                    name = f"{item['title']} {label} {q}.mkv"
                download_map[sid][key][q] = {"url": url, "name": name}

    payload_b64 = base64.b64encode(
        json.dumps(download_map, ensure_ascii=False).encode("utf-8")
    ).decode("ascii")
    js = "window.DOWNLOAD_MAP = JSON.parse(atob(\"" + payload_b64 + "\"));\n"
    (OUTPUT_DIR / "assets" / DOWNLOAD_DATA_JS_NAME).write_text(js, encoding="utf-8")



def base_title_key(item):
    """Normalize title for grouping seasons of the same show."""
    t = item.get("title", "")
    t = re.sub(r"\s*Season\s*\d+.*$", "", t, flags=re.I).strip()
    t = re.sub(r"\s*S\d+.*$", "", t, flags=re.I).strip()
    return t.lower()


def related_seasons_for(item, items):
    key = base_title_key(item)
    seasons = [i for i in items if base_title_key(i) == key and i.get("episode_links")]
    seasons.sort(key=lambda i: i.get("season") or "")
    return seasons


def related_by_genre(item, items, limit=6):
    genres = set(item.get("genres") or [])
    if not genres:
        return []
    scored = []
    for i in items:
        if i["id"] == item["id"]:
            continue
        overlap = len(genres & set(i.get("genres") or []))
        if overlap:
            scored.append((overlap, _safe_float(i.get("rating")), i))
    scored.sort(key=lambda x: (x[0], x[1]), reverse=True)
    return [x[2] for x in scored[:limit]]


def _safe_float(val):
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


def slugify(text):
    text = text.strip().lower()
    text = re.sub(r"&", " and ", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def collect_genres(items):
    """Unique {name, slug} list of every genre across the whole catalog, A-Z."""
    seen = {}
    for i in items:
        for g in i.get("genres", []):
            g = g.strip()
            if not g:
                continue
            slug = slugify(g)
            if slug not in seen:
                seen[slug] = g
    return [{"name": seen[s], "slug": s} for s in sorted(seen, key=lambda s: seen[s].lower())]


def brand_parts(site_name):
    words = site_name.split(" ")
    if len(words) >= 2:
        return " ".join(words[:-1]) + " ", words[-1]
    if len(site_name) > 4:
        return site_name[:-4], site_name[-4:]
    return site_name, ""


def compute_build_version():
    """A short hash of everything that actually affects the CSS/JS a
    browser needs to re-fetch (assets + templates). Used as the ?v=...
    cache-busting query string.

    This used to be int(time.time()) -- a fresh number on literally every
    single run -- which meant every one of the 500+ generated pages had
    different HTML byte-for-byte on every build, even when nothing about
    the site had actually changed. Firebase Hosting diffs by content hash,
    so that forced a full re-upload of the whole site every time. Hashing
    the real inputs instead means unchanged pages stay byte-identical
    across builds, so only what actually changed gets uploaded.
    """
    h = hashlib.sha256()
    for f in sorted(ASSETS_DIR.rglob("*")):
        if f.is_file():
            h.update(str(f.relative_to(ASSETS_DIR)).encode("utf-8"))
            h.update(f.read_bytes())
    for f in sorted(TEMPLATES_DIR.rglob("*.html")):
        h.update(str(f.relative_to(TEMPLATES_DIR)).encode("utf-8"))
        h.update(f.read_bytes())
    return h.hexdigest()[:10]


def render_all():
    data = load_data()
    site_name = data.get("site_name", "MovieSite")
    items = data.get("items", [])
    head, tail = brand_parts(site_name)

    env = build_env()
    clean_output()
    copy_assets()
    copy_root_static_files()
    write_data_js(items)
    write_download_data_js(items)

    all_genres = collect_genres(items)

    common_ctx = {
        "site_name": site_name,
        "brand_head": head,
        "brand_tail": tail,
        "all_genres": all_genres,
        "build_version": compute_build_version(),
        "telegram_join_url": TELEGRAM_JOIN_URL,
        "ad_config": AD_CONFIG,
        "copyright_year": datetime.now().year,
        "site_data_js": SITE_DATA_JS_NAME,
        "download_data_js": DOWNLOAD_DATA_JS_NAME,
        "emailjs_public_key": EMAILJS_PUBLIC_KEY,
        "emailjs_service_id": EMAILJS_SERVICE_ID,
        "comment_emailjs_template_id": COMMENT_EMAILJS_TEMPLATE_ID,
        "report_emailjs_template_id": REPORT_EMAILJS_TEMPLATE_ID,
    }

    # Precompute download availability so homepage hero CTAs can deep-link
    for _it in items:
        _it["has_download_page"] = bool(download_entries(_it))

    # ---- Homepage: ANIME ONLY (no Hollywood/Bollywood movies/series) ----
    anime_items = [i for i in items if i.get("category") == "anime"]

    trending_flagged = [i for i in anime_items if i.get("trending")]
    if trending_flagged:
        hero_items = trending_flagged[:HERO_CAROUSEL_MAX]
    elif anime_items:
        hero_items = [max(anime_items, key=lambda i: _safe_float(i.get("rating")))]
    else:
        hero_items = []

    # Top 10 rated Anime Movies (type == "Movie" within the anime category)
    top_anime_movies = sorted(
        (i for i in anime_items if i.get("type") == "Movie"),
        key=lambda i: _safe_float(i.get("rating")),
        reverse=True,
    )[:10]

    # First page of the URL-driven listing is pre-rendered; pagination.js does the rest.
    listing_all = [i for i in unique_by_id(items) if i.get("category") == "anime"]
    listing_ctx = {
        "listing_items": listing_all[:PER_PAGE],
        "listing_total": len(listing_all),
        "per_page": PER_PAGE,
    }

    tpl = env.get_template("index.html")
    html = tpl.render(**common_ctx, **listing_ctx, items=anime_items, active="home",
                       hero_items=hero_items, top_anime_movies=top_anime_movies,
                       root_prefix="", asset_prefix="")
    (OUTPUT_DIR / "index.html").write_text(html, encoding="utf-8")

    # ---- pagination.html: dedicated paginated browse/search page (same JS as the homepage) ----
    tpl = env.get_template("pagination.html")
    html = tpl.render(**common_ctx, **listing_ctx, active="", root_prefix="", asset_prefix="")
    (OUTPUT_DIR / "pagination.html").write_text(html, encoding="utf-8")

    # ---- Category pages: anime.html / movies.html / series.html ----
    for cat, label in CATEGORY_LABELS.items():
        cat_items = [i for i in items if i.get("category") == cat]
        tpl = env.get_template("category.html")
        html = tpl.render(**common_ctx, items=cat_items, active=cat,
                           category_label=label,
                           root_prefix="", asset_prefix="")
        (OUTPUT_DIR / f"{cat}.html").write_text(html, encoding="utf-8")

    # ---- Trending page: ANIME ONLY, highest-rated first (auto-updates
    #      whenever ratings/new anime change — no manual flag needed) ----
    trending_items = sorted(anime_items, key=lambda i: _safe_float(i.get("rating")), reverse=True)[:TRENDING_TARGET_COUNT]
    tpl = env.get_template("category.html")
    html = tpl.render(**common_ctx, items=trending_items, active="trending",
                       category_label="Trending", root_prefix="", asset_prefix="")
    (OUTPUT_DIR / "trending.html").write_text(html, encoding="utf-8")

    # ---- Favourites shell (client-rendered) ----
    tpl = env.get_template("favourites.html")
    html = tpl.render(**common_ctx, active="favourites", root_prefix="", asset_prefix="")
    (OUTPUT_DIR / "favourites.html").write_text(html, encoding="utf-8")

    # ---- How to Download / Report pages (dedicated templates) ----
    tpl = env.get_template("how_to_download.html")
    html = tpl.render(**common_ctx, active="howto", root_prefix="", asset_prefix="")
    (OUTPUT_DIR / "how-to-download.html").write_text(html, encoding="utf-8")

    tpl = env.get_template("report.html")
    html = tpl.render(**common_ctx, active="report", root_prefix="", asset_prefix="")
    (OUTPUT_DIR / "report.html").write_text(html, encoding="utf-8")

    tpl = env.get_template("dmca.html")
    html = tpl.render(**common_ctx, active="dmca", root_prefix="", asset_prefix="")
    (OUTPUT_DIR / "dmca.html").write_text(html, encoding="utf-8")

    # ---- A-Z hub page ----
    tpl = env.get_template("browse_az.html")
    html = tpl.render(**common_ctx, active="az", root_prefix="", asset_prefix="",
                       letters=LETTERS)
    (OUTPUT_DIR / "browse-az.html").write_text(html, encoding="utf-8")

    # ---- A-Z per-letter pages (anime category, one level deep) ----
    anime_items = [i for i in items if i.get("category") == "anime"]
    tpl = env.get_template("letter.html")
    for letter in LETTERS:
        letter_items = sorted(
            [i for i in anime_items if i["title"].strip().upper().startswith(letter)],
            key=lambda i: i["title"].lower(),
        )
        html = tpl.render(**common_ctx, items=letter_items, active="az",
                           letter=letter, all_letters=LETTERS,
                           root_prefix="../", asset_prefix="../")
        (OUTPUT_DIR / "pages_az" / f"{letter.lower()}.html").write_text(html, encoding="utf-8")

    # ---- Genres hub page ----
    tpl = env.get_template("browse_genres.html")
    html = tpl.render(**common_ctx, active="genres", root_prefix="", asset_prefix="")
    (OUTPUT_DIR / "browse-genres.html").write_text(html, encoding="utf-8")

    # ---- Per-genre pages: genres/<slug>.html (across ALL categories) ----
    tpl = env.get_template("genre.html")
    for g in all_genres:
        genre_items = sorted(
            [i for i in items if g["name"] in i.get("genres", [])],
            key=lambda i: _safe_float(i.get("rating")),
            reverse=True,
        )
        html = tpl.render(**common_ctx, items=genre_items, active="genres",
                           genre=g, root_prefix="../", asset_prefix="../")
        (OUTPUT_DIR / "genres" / f"{g['slug']}.html").write_text(html, encoding="utf-8")

    # ---- Detail pages: pages/<id>.html ----
    # ALL categories (anime AND movies/series) now go through the single
    # "Download" button -> download/<id>.html -> file.html gate. Direct
    # quality hrefs are never rendered on the info page for anyone.
    tpl = env.get_template("detail.html")
    for item in items:
        entries = download_entries(item)
        item["has_download_page"] = bool(entries)
        if entries:
            quality_set = set()
            for _, _, quals in entries:
                quality_set.update(q for q, u in quals.items() if u)
            item["available_qualities"] = [q for q in ["480p", "720p", "1080p"] if q in quality_set]
        html = tpl.render(**common_ctx, item=item, active=item.get("category"),
                           root_prefix="../", asset_prefix="../")
        (OUTPUT_DIR / "pages" / f"{item['id']}.html").write_text(html, encoding="utf-8")

    # ---- Download pages (episode/part list + qualities), ALL categories ----
    tpl_dl = env.get_template("download_series.html")
    dl_count = 0
    for item in items:
        entries = download_entries(item)
        if not entries:
            continue
        related_seasons = related_seasons_for(item, items)
        related_items = related_by_genre(item, items, limit=6)
        html = tpl_dl.render(
            **common_ctx,
            item=item,
            entries=entries,
            is_episodic=bool(item.get("episode_links")),
            related_seasons=related_seasons,
            related_items=related_items,
            active=item.get("category"),
            root_prefix="../",
            asset_prefix="../",
        )
        (OUTPUT_DIR / "download" / f"{item['id']}.html").write_text(html, encoding="utf-8")
        dl_count += 1

    # ---- Single file-download intermediate page (dynamic via query + download-data.js) ----
    tpl_file = env.get_template("download_file.html")
    html = tpl_file.render(
        **common_ctx,
        active="",
        root_prefix="../",
        asset_prefix="../",
    )
    (OUTPUT_DIR / "download" / "file.html").write_text(html, encoding="utf-8")

    total_pages = 10 + len(items) + len(LETTERS) + len(all_genres) + dl_count + 1
    print(f"Done. {len(items)} titles, {dl_count} download pages, {len(all_genres)} genres, {total_pages} pages -> {OUTPUT_DIR}")
    print("Open output/index.html in a browser to preview.")


if __name__ == "__main__":
    render_all()
