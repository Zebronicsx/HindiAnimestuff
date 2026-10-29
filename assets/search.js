// ============================================================
// Client-side search (100% free, no network): normalized index +
// ranking + the header search overlay + the /?s=... URL format.
//
//   Data      window.SITE_ITEMS  (assets/data.js, already loaded on every page)
//   Public    window.HAS_SEARCH  (used by assets/pagination.js)
//   URL       <listing page>?s=Solo+Leveling   (&page=2 handled by pagination.js)
//
// Behaviour
//   * typing            -> instant dropdown of the top matches (max LIVE_MAX rows)
//   * Enter / "See all" -> commits to /?s=<query> (full paginated results)
//   * on a page that mounts the listing (homepage, pagination.html) the commit
//     is an in-page pushState; everywhere else it is a normal navigation to /?s=...
//
// Performance notes
//   * The index is built lazily, once (~337 short strings), then reused.
//   * Repeated queries hit a small result cache.
//   * The dropdown re-renders at most once per animation frame, only when the
//     normalized query actually changed, with a single innerHTML write and small,
//     lazy-loaded thumbnails. No debounce timer is needed: matching is sub-millisecond.
// ============================================================
(function () {
  "use strict";

  var ROOT = document.body.getAttribute("data-root") || "";
  var LIVE_MAX = 8;      // rows shown in the overlay dropdown
  var QUERY_MAX = 100;   // hard cap on query length
  var TOKENS_MAX = 8;
  var CACHE_MAX = 40;
  var THUMB_ROW = 154;   // TMDB width for the 46x64 dropdown thumbnails (3x DPR safe)

  // ---------- text helpers ----------
  var NON_WORD;
  try { NON_WORD = new RegExp("[^\\p{L}\\p{N}]+", "gu"); }
  catch (e) { NON_WORD = /[^a-z0-9]+/g; }   // very old browsers: ASCII only

  // "I\u2019ve Been Killing Slimes" / "I've been killing slimes" / "ive BEEN killing" -> "ive been killing slimes"
  function norm(s) {
    s = String(s == null ? "" : s);
    if (s.normalize) s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); // Pok\u00e9mon -> pokemon
    return s.toLowerCase()
      .replace(/['\u2019\u2018`\u00b4]/g, "")   // apostrophes vanish (straight + curly)
      .replace(/\u00d7/g, "x")                  // "Hunter \u00d7 Hunter" == "hunter x hunter"
      .replace(/&/g, " and ")
      .replace(NON_WORD, " ")                   // punctuation / dashes / colons -> single space
      .trim();
  }

  // What the user typed, tidied for display and for the URL (case is preserved).
  function clean(s) {
    return String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, QUERY_MAX);
  }

  var ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  }

  // Poster URL. width>0 swaps TMDB "original" for w<width> (mirror of poster_src() in generate.py).
  function poster(url, width) {
    url = url || "";
    if (!/^https?:\/\//.test(url)) return ROOT + url;
    if (width && url.indexOf("://image.tmdb.org/t/p/original/") !== -1) {
      return url.replace("/t/p/original/", "/t/p/w" + width + "/");
    }
    return url;
  }

  // If a downsized image ever 404s, retry once with the full-size URL kept in data-full.
  // "error" doesn't bubble, so it is caught in the capture phase on the container.
  function fallback(container) {
    if (!container) return;
    container.addEventListener("error", function (e) {
      var t = e.target;
      if (!t || t.tagName !== "IMG") return;
      var full = t.getAttribute("data-full");
      if (full) { t.removeAttribute("data-full"); t.src = full; }
    }, true);
  }

  // ---------- index (built once, lazily) ----------
  var entries = null;

  function getEntries() {
    if (entries) return entries;
    var src = window.SITE_ITEMS || [];
    var last = Object.create(null);
    var out = [];
    var i;
    // data.json can repeat an id; only the last one has a real page (pages/<id>.html), so keep that one.
    for (i = 0; i < src.length; i++) last[src[i].id] = i;
    for (i = 0; i < src.length; i++) {
      var it = src[i];
      if (last[it.id] !== i) continue;
      var t = norm(it.title);
      var sm = /(\d+)/.exec(it.season || "");
      var season = norm(it.season);
      if (sm) season += " s" + sm[1];                       // "season 2" is also findable as "s2"
      out.push({
        it: it,
        t: t,                                               // title
        ts: season ? t + " " + season : t,                  // title + season ("solo leveling season 2 s2")
        tc: t.replace(/ /g, ""),                            // title without spaces ("sololeveling")
        m: norm([it.type, it.category, (it.genres || []).join(" "), (it.languages || []).join(" "),
                 it.year, it.industry, it.starcast].join(" ")),
        r: parseFloat(it.rating) || 0,
        sn: sm ? parseInt(sm[1], 10) : 0,
        n: out.length                                       // catalog order, for stable ties
      });
    }
    entries = out;
    return out;
  }

  // Unique catalog items in catalog order (same rule as unique_by_id() in generate.py).
  function items() {
    return getEntries().map(function (e) { return e.it; });
  }

  // ---------- ranking ----------
  // Higher = better. >=400 means "matched the title"; 200 means "matched metadata only".
  function score(e, q, tokens, qc) {
    var t = e.t, i;
    if (t === q) return 1000;                                // exact title
    if (t.indexOf(q) === 0) return 900;                      // title starts with the query
    if ((" " + t).indexOf(" " + q) !== -1) return 800;       // query starts a word in the title
    if (t.indexOf(q) !== -1) return 700;                     // query appears inside the title

    var ok = true;
    for (i = 0; i < tokens.length; i++) { if (t.indexOf(tokens[i]) === -1) { ok = false; break; } }
    if (ok) return 600;                                      // every word is in the title (any order)

    ok = true;
    for (i = 0; i < tokens.length; i++) { if (e.ts.indexOf(tokens[i]) === -1) { ok = false; break; } }
    if (ok) return 450;                                      // ...or title + season ("solo leveling season 2")

    if (qc.length > 2 && e.tc.indexOf(qc) !== -1) return 400; // ignoring spaces ("sololeveling", "kaguyasama")

    var hay = e.ts + " " + e.m;                              // genres, languages, type, year, cast...
    for (i = 0; i < tokens.length; i++) { if (hay.indexOf(tokens[i]) === -1) return 0; }
    return 200;
  }

  function byRank(a, b) {
    if (b.s !== a.s) return b.s - a.s;
    var x = a.e, y = b.e;
    if (a.s >= 400) {                                        // title matches: A-Z, seasons in order
      if (x.t !== y.t) return x.t < y.t ? -1 : 1;
      return (x.sn - y.sn) || (x.n - y.n);
    }
    return (y.r - x.r) || (x.n - y.n);                       // metadata matches: best rated first
  }

  var cache = Object.create(null);
  var cacheOrder = [];

  // Returns unique catalog items, best match first. The array is cached: do not mutate it.
  function search(raw) {
    var q = norm(clean(raw));
    if (!q) return [];
    if (cache[q]) return cache[q];

    var list = getEntries();
    var tokens = q.split(" ").slice(0, TOKENS_MAX);
    var qc = q.replace(/ /g, "");
    var hits = [];
    for (var i = 0; i < list.length; i++) {
      var s = score(list[i], q, tokens, qc);
      if (s) hits.push({ e: list[i], s: s });
    }
    hits.sort(byRank);
    var out = hits.map(function (h) { return h.e.it; });

    cache[q] = out;
    cacheOrder.push(q);
    if (cacheOrder.length > CACHE_MAX) delete cache[cacheOrder.shift()];
    return out;
  }

  // ---------- overlay ----------
  var overlay = document.getElementById("searchOverlay");
  var form = document.getElementById("searchForm");
  var input = document.getElementById("searchInput");
  var results = document.getElementById("searchResults");

  // Where a committed search goes: this page if it mounts the listing, otherwise the site root.
  function listingPath() {
    if (window.HAS_LISTING) return window.location.pathname;
    return window.location.protocol === "file:" ? ROOT + "index.html" : (ROOT || "./");
  }

  function searchUrl(q) {
    var p = new URLSearchParams();
    p.set("s", q);
    return listingPath() + "?" + p.toString();   // spaces become "+": ?s=Solo+Leveling
  }

  function openOverlay() {
    if (!overlay) return;
    overlay.classList.add("open");
    scheduleRender();                             // shows matches for any text already in the box
    setTimeout(function () { if (input) input.focus(); }, 150);
  }

  function closeOverlay() {
    if (overlay) overlay.classList.remove("open");
  }

  function row(it) {
    var meta = [it.type, it.season].filter(Boolean).join(" \u00b7 ");
    var src = poster(it.poster, THUMB_ROW);
    var full = poster(it.poster, 0);
    return '<a class="search-hit" href="' + ROOT + 'pages/' + esc(it.id) + '.html">' +
      '<img src="' + esc(src) + '"' + (src !== full ? ' data-full="' + esc(full) + '"' : "") +
      ' width="46" height="64" alt="" loading="lazy" decoding="async">' +
      '<div><div class="shtitle">' + esc(it.title) + '</div>' +
      '<div class="shmeta">' + esc(meta) + '</div></div></a>';
  }

  var lastKey = null;
  var frame = 0;

  function scheduleRender() {
    if (frame) return;
    frame = window.requestAnimationFrame(function () { frame = 0; renderLive(); });
  }

  function renderLive() {
    if (!results || !input) return;
    var typed = clean(input.value);
    var key = norm(typed);
    if (key === lastKey) return;                  // nothing new -> no DOM work
    lastKey = key;

    if (!key) { results.innerHTML = ""; return; }

    var all = search(typed);
    if (!all.length) {
      results.innerHTML = '<div class="search-empty">No results found for "' + esc(typed) + '".</div>';
      return;
    }
    var html = all.slice(0, LIVE_MAX).map(row).join("");
    html += '<a class="search-all" data-search-all href="' + esc(searchUrl(typed)) + '">See all ' +
      all.length + (all.length === 1 ? " result" : " results") + ' &rsaquo;</a>';
    results.innerHTML = html;
  }

  function commit(raw) {
    var q = clean(raw);
    if (!q) return;
    var url = searchUrl(q);
    if (input) input.blur();                      // hide the on-screen keyboard
    closeOverlay();
    if (window.HAS_LISTING) window.HAS_LISTING.go(url);
    else window.location.href = url;
  }

  // Keeps the box in step with the URL (called by pagination.js on back/forward and on commit).
  function syncInput(q) {
    if (!input) return;
    q = clean(q);
    if (clean(input.value) !== q) { input.value = q; lastKey = null; }
  }

  if (overlay && input) {
    var openers = ["searchBtn", "bnSearchBtn"];
    openers.forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener("click", openOverlay);
    });
    var closeBtn = document.getElementById("searchCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeOverlay);

    input.addEventListener("input", scheduleRender);
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); commit(input.value); });

    results.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a[data-search-all]") : null;
      if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();                          // page-loader.js skips defaultPrevented clicks
      commit(input.value);
    });
    fallback(results);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeOverlay();
    });

    // Opening /?s=Solo+Leveling directly (or refreshing it) pre-fills the box.
    try {
      var initial = new URLSearchParams(window.location.search).get("s");
      if (initial) input.value = clean(initial);
    } catch (e) {}
  }

  window.HAS_SEARCH = {
    norm: norm,
    clean: clean,
    esc: esc,
    poster: poster,
    fallback: fallback,
    search: search,
    items: items,
    syncInput: syncInput
  };
})();
