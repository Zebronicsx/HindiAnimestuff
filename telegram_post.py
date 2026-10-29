#!/usr/bin/env python3
"""
Posts newly-added data.json titles to Telegram automatically.

WHEN TO RUN:
    python generate.py
    python telegram_post.py

Already-posted titles are tracked in posted_telegram.json, so nothing is
posted twice.

SWITCH (movies & series only):
    POST_MOVIES_SERIES = True / False   (see below)
    False -> movies & series are skipped (and NOT marked as posted, so they
             go out later when you turn it back on). Anime is never affected.

IMAGES:
    ANIME           -> banner from toonworld4all.me (fallback: cropped poster)
    MOVIES & SERIES -> IMDb poster (m.media-amazon.com ..._V1_QL85_UX800_.jpg)
                       found via IMDb's suggestion API. Fallback: item["poster"].

400 FIX:
    Telegram often returns 400 when IT has to fetch the image URL itself
    (hotlink-protected, webp, too small, bad URL...). Now the script
    downloads the image itself and uploads it as a file if the URL way fails,
    and prints Telegram's real error message.

REQUIRES:
    pip install pillow --break-system-packages   (image conversion/crop)
"""

import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).parent
DATA_FILE = ROOT / "data.json"
POSTED_FILE = ROOT / "posted_telegram.json"

# ---------------------------------------------------------------------
TELEGRAM_BOT_TOKEN = "8885570507:AAFXlbP8vNL9pyolqJO17vN8UdDuXZ0twXc"
# ---------------------------------------------------------------------

# >>> SWITCH: movies & series Telegram pe post karne hain ya nahi <<<
POST_MOVIES_SERIES = False      # True = post karo | False = band (anime pe asar nahi)

# Agar saari images fail ho jayein to bina image ke text post kar de?
ALLOW_TEXT_ONLY_FALLBACK = True

DOWNLOAD_LINK = "https://hindianimestuff.web.app/?v=2"
JOIN_CHANNEL = "@HindiAnimestuff"

CHANNELS = {
    "anime": "@HindiDubAnimes4u",
    "movies": "@HDMoviesDL4u",
    "series": "@HDMoviesDL4u",
}

TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


# ----------------------------------------------------------------- helpers
def load_posted():
    if POSTED_FILE.exists():
        return set(json.loads(POSTED_FILE.read_text(encoding="utf-8")))
    return set()


def save_posted(posted_ids):
    POSTED_FILE.write_text(json.dumps(sorted(posted_ids), indent=2), encoding="utf-8")


def http_get(url, timeout=15):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="ignore")


def download_bytes(url, timeout=20, referer=None):
    headers = {"User-Agent": USER_AGENT, "Accept": "image/*,*/*;q=0.8"}
    if referer:
        headers["Referer"] = referer
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read(15 * 1024 * 1024)
    if len(data) < 1000:
        raise ValueError("image too small / empty")
    return data


def prepare_image(data):
    """Convert any image (webp/png/...) to a Telegram-safe JPEG."""
    try:
        from PIL import Image
        im = Image.open(BytesIO(data)).convert("RGB")
        w, h = im.size
        # Telegram limits: w + h <= 10000, aspect ratio <= 20
        if w + h > 10000:
            scale = 9000 / (w + h)
            im = im.resize((int(w * scale), int(h * scale)))
        out = BytesIO()
        im.save(out, "JPEG", quality=90)
        return out.getvalue()
    except Exception:
        return data  # Pillow missing or failed - send raw bytes


# ----------------------------------------------------------------- anime banner
def toonworld4all_banner(title, season=None):
    """Returns a list of candidate banner URLs (best first) or []."""
    try:
        query = title
        if season and str(season).strip() and str(season).upper() not in ("N/A", "NONE", ""):
            season_str = str(season).strip()
            if "season" not in title.lower() and "season" not in season_str.lower():
                query = f"{title} Season {season_str}"
            else:
                query = f"{title} {season_str}"

        search_url = "https://toonworld4all.me/?s=" + urllib.parse.quote(query)
        search_html = http_get(search_url)

        found = None
        for tag in re.findall(r"<img\b[^>]*>", search_html):
            if "wp-post-image" not in tag:
                continue
            for attr in ("src", "data-src", "data-lazy-src"):
                m = re.search(rf'\b{attr}="([^"]+)"', tag)
                if m and not m.group(1).startswith("data:"):
                    found = m.group(1)
                    break
            if found:
                break

        if not found:
            print(f"  toonworld4all: no banner image in search results for '{query}'")
            return []

        found = urllib.parse.urljoin(search_url, html.unescape(found))
        full = re.sub(r"-\d+x\d+(\.\w+)$", r"\1", found)  # try bigger version first
        return [full, found] if full != found else [found]
    except Exception as e:
        print(f"  toonworld4all lookup failed for '{title}': {e}")
        return []


def crop_poster_to_16x9(poster_url):
    """Fallback for anime: center-crop poster to 16:9. Returns JPEG bytes or None."""
    try:
        from PIL import Image
        im = Image.open(BytesIO(download_bytes(poster_url))).convert("RGB")
        w, h = im.size
        target_h = int(w * 9 / 16)
        if target_h <= h:
            top = (h - target_h) // 2
            im = im.crop((0, top, w, top + target_h))
        else:
            target_w = int(h * 16 / 9)
            left = (w - target_w) // 2
            im = im.crop((left, 0, left + target_w, h))
        out = BytesIO()
        im.save(out, "JPEG", quality=88)
        return out.getvalue()
    except Exception as e:
        print(f"  Poster crop fallback failed: {e}")
        return None


# ----------------------------------------------------------------- IMDb poster (movies & series)
IMDB_TYPES = {"movie", "tvSeries", "tvMiniSeries", "tvMovie", "tvSpecial", "video"}


def imdb_poster(item):
    """
    Finds the IMDb poster and returns it in the
    https://m.media-amazon.com/images/M/....@._V1_QL85_UX800_.jpg format.
    Uses item['imdb_id'] / item['imdb'] if present, else searches by title
    (+ year if item has 'year').
    """
    try:
        raw_id = str(item.get("imdb_id") or item.get("imdb") or "")
        m = re.search(r"tt\d+", raw_id)
        query = m.group(0) if m else item["title"].strip().lower()
        url = (
            "https://v2.sg.media-imdb.com/suggestion/"
            f"{query[0]}/{urllib.parse.quote(query)}.json"
        )
        data = json.loads(http_get(url))
        results = [d for d in data.get("d", []) if str(d.get("id", "")).startswith("tt") and d.get("i")]
        if not results:
            print(f"  IMDb: nothing found for '{query}'")
            return None

        year = str(item.get("year") or "")
        title_l = item["title"].strip().lower()

        def score(d):
            s = 0
            if m and d["id"] == m.group(0):
                s += 100
            if d.get("qid") in IMDB_TYPES:
                s += 10
            if str(d.get("l", "")).strip().lower() == title_l:
                s += 5
            if year and str(d.get("y", "")) == year:
                s += 3
            return s

        best = max(results, key=score)
        img = best["i"]["imageUrl"]
        # ...@._V1_.jpg  ->  ...@._V1_QL85_UX800_.jpg
        if "._V1_" in img:
            img = re.sub(r"\._V1_.*?(\.\w+)$", r"._V1_QL85_UX800_\1", img)
        return img
    except Exception as e:
        print(f"  IMDb lookup failed for '{item.get('title')}': {e}")
        return None


# ----------------------------------------------------------------- caption
def build_caption(item):
    title = html.escape(item["title"])
    season = html.escape(str(item.get("season") or "N/A"))
    rating = html.escape(str(item.get("rating", "N/A")))
    genres = html.escape(" | ".join(item.get("genres", [])))
    quality = html.escape(item.get("quality_tag", ""))
    languages = html.escape(" | ".join(item.get("languages", [])))
    subtitle = html.escape(item.get("subtitle", ""))
    join_channel = html.escape(JOIN_CHANNEL)

    lines = ["\u2022 Series Information", ""]
    lines.append(f"Title: <blockquote>{title}</blockquote>")
    lines.append(f"Season: {season}")
    lines.append(f"MAL Rating: {rating}/10")
    lines.append(f"Genres: {genres}")
    lines.append(f"Quality: {quality}")
    lines.append(f"Audio Tracks : {languages}")
    lines.append(f"Subtitle: {subtitle}")
    if item.get("category") != "movies":
        lines.append(f"Total Episode: {item.get('episodes') or 'N/A'}")
    lines.append("")
    lines.append(f"Join : <blockquote>{join_channel}</blockquote>")

    return f"<b>{chr(10).join(lines)}</b>"


def plain_caption(caption):
    """Strip HTML tags -> plain text (for the fallback when Telegram rejects the HTML)."""
    return html.unescape(re.sub(r"<[^>]+>", "", caption))[:1024]


# ----------------------------------------------------------------- Telegram calls
BUTTON = {"inline_keyboard": [[{"text": "Download Now \U0001F343", "url": DOWNLOAD_LINK}]]}


def tg_call(method, fields, photo_bytes=None):
    if photo_bytes is not None:
        boundary = "----tgboundary7MA4YWxkTrZu0gW"
        body = b""
        for k, v in fields.items():
            body += (f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n').encode("utf-8")
        body += (
            f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="photo.jpg"\r\n'
            "Content-Type: image/jpeg\r\n\r\n"
        ).encode("utf-8")
        body += photo_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")
        req = urllib.request.Request(
            f"{TELEGRAM_API}/{method}", data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        )
    else:
        req = urllib.request.Request(
            f"{TELEGRAM_API}/{method}", data=urllib.parse.urlencode(fields).encode("utf-8")
        )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            result = json.load(r)
    except urllib.error.HTTPError as e:
        try:
            desc = json.loads(e.read().decode("utf-8", errors="ignore")).get("description", "")
        except Exception:
            desc = ""
        raise RuntimeError(f"HTTP {e.code}: {desc}") from None
    if not result.get("ok"):
        raise RuntimeError(result)
    return result


def send_photo(chat_id, photo, caption):
    """photo = URL string OR JPEG bytes. Retries without HTML if caption parsing fails."""
    def attempt(cap, parse_mode):
        fields = {"chat_id": chat_id, "caption": cap, "reply_markup": json.dumps(BUTTON)}
        if parse_mode:
            fields["parse_mode"] = parse_mode
        if isinstance(photo, (bytes, bytearray)):
            tg_call("sendPhoto", fields, photo_bytes=bytes(photo))
        else:
            fields["photo"] = photo
            tg_call("sendPhoto", fields)

    try:
        attempt(caption, "HTML")
    except RuntimeError as e:
        if "parse entities" in str(e) or "caption is too long" in str(e).lower():
            print("  caption HTML rejected, retrying as plain text")
            attempt(plain_caption(caption), None)
        else:
            raise


def send_text_only(chat_id, caption):
    fields = {
        "chat_id": chat_id, "text": caption, "parse_mode": "HTML",
        "reply_markup": json.dumps(BUTTON), "disable_web_page_preview": "true",
    }
    tg_call("sendMessage", fields)


def post_with_fallbacks(item, chat_id, caption, image_urls, crop_fallback=False):
    """
    For each candidate image URL:
      1) let Telegram fetch the URL
      2) if that fails -> download it ourselves and upload as a file
    Then (anime) cropped poster, then raw item['poster'], then text-only.
    """
    last_err = None
    referer = None

    for url in image_urls:
        try:
            send_photo(chat_id, url, caption)
            return "url"
        except Exception as e:
            last_err = e
            print(f"  URL send failed ({e}) -> trying upload: {url}")
        try:
            data = prepare_image(download_bytes(url, referer=referer))
            send_photo(chat_id, data, caption)
            return "upload"
        except Exception as e:
            last_err = e
            print(f"  upload failed ({e}) for {url}")

    if crop_fallback and item.get("poster"):
        cropped = crop_poster_to_16x9(item["poster"])
        if cropped:
            try:
                send_photo(chat_id, cropped, caption)
                return "poster-crop"
            except Exception as e:
                last_err = e
                print(f"  cropped poster failed: {e}")

    if item.get("poster"):
        try:
            send_photo(chat_id, item["poster"], caption)
            return "poster-url"
        except Exception as e:
            last_err = e
            try:
                data = prepare_image(download_bytes(item["poster"]))
                send_photo(chat_id, data, caption)
                return "poster-upload"
            except Exception as e2:
                last_err = e2

    if ALLOW_TEXT_ONLY_FALLBACK:
        try:
            send_text_only(chat_id, caption)
            return "text-only"
        except Exception as e:
            last_err = e

    raise RuntimeError(last_err)


# ----------------------------------------------------------------- main
def main():
    if "PASTE_YOUR" in TELEGRAM_BOT_TOKEN:
        print("Fill in TELEGRAM_BOT_TOKEN at the top of telegram_post.py first.")
        return

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    items = data.get("items", [])
    posted = load_posted()
    new_items = [i for i in items if i["id"] not in posted]

    if not POST_MOVIES_SERIES:
        skipped = [i for i in new_items if i.get("category") in ("movies", "series")]
        if skipped:
            print(f"Movies/Series posting is OFF -> skipping {len(skipped)} title(s).")
        new_items = [i for i in new_items if i.get("category") not in ("movies", "series")]

    if not new_items:
        print("Nothing new to post.")
        return

    print(f"Posting {len(new_items)} new title(s) to Telegram...")
    for item in new_items:
        category = item.get("category")
        chat_id = CHANNELS.get(category)
        if not chat_id:
            print(f"  Skipping {item['id']} - unknown category '{category}'")
            continue

        caption = build_caption(item)

        if category in ("movies", "series"):
            poster = imdb_poster(item)
            image_urls = [poster] if poster else []
            crop = False
        else:
            image_urls = toonworld4all_banner(item["title"], item.get("season"))
            crop = True

        try:
            how = post_with_fallbacks(item, chat_id, caption, image_urls, crop_fallback=crop)
            print(f"  Posted: {item['title']} -> {chat_id} [{how}]")
            posted.add(item["id"])
            save_posted(posted)
            time.sleep(3)
        except Exception as e:
            print(f"  FAILED to post {item['id']}: {e}")

    print("Done.")


if __name__ == "__main__":
    main()
