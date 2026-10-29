// ============================================================
// URL-driven listing + pagination for the homepage and pagination.html.
//
//   /?page=2                       page 2 of the catalog
//   /?genre=action&page=3          genre filter (the old "chip" filter, now in the URL)
//   /?s=Solo+Leveling              search results
//   /?s=Solo+Leveling&page=2       page 2 of a search
//
// Only ONE page of cards (PER_PAGE, default 12) is ever in the DOM. Page 1 of the
// browse view is pre-rendered by generate.py (fast first paint, works before JS);
// every other view is rendered here from window.SITE_ITEMS via HAS_SEARCH.
//
// Needs assets/search.js (loaded earlier by base.html) and the markup from
// templates/_listing.html. Exposes window.HAS_LISTING = { go, render }.
// ============================================================
(function () {
  "use strict";

  var S = window.HAS_SEARCH;
  var wrap = document.getElementById("listing");
  var grid = document.getElementById("listGrid");
  if (!S || !wrap || !grid) return;

  var ROOT = document.body.getAttribute("data-root") || "";
  var PER = parseInt(wrap.getAttribute("data-per-page"), 10) || 12;
  var CATEGORY = wrap.getAttribute("data-category") || "anime";
  var THUMB_W = 342;                                   // keep in sync with thumb_w in _listing.html

  var html = document.documentElement;
  var nav = document.getElementById("pagination");
  var genreBar = document.getElementById("genreBar");
  var headTitle = document.getElementById("listingTitle");
  var headSub = document.getElementById("listingSub");
  var clearLink = document.getElementById("listingClear");
  var BASE_TITLE = document.title;
  var BRAND = BASE_TITLE.split(" \u2014 ")[0] || BASE_TITLE;
  var robotsMeta = null;

  // Same markup as the favourite button in templates/_cards.html.
  var FAV_HTML =
    '<div class="tooltip fav-tooltip">' +
      '<button class="trigger fav-btn" data-fav-id="{ID}" aria-label="Add to favourites">' +
        '<svg class="heart sizer" viewBox="0 0 24 24">' +
          '<path class="fill" fill="currentColor" d="M12 21s-7-4.5-9.5-9C.7 8.2 2.4 4 6.5 4 9 4 11 5.6 12 7c1-1.4 3-3 5.5-3 4.1 0 5.8 4.2 4 8-2.5 4.5-9.5 9-9.5 9z"/>' +
          '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 21s-7-4.5-9.5-9C.7 8.2 2.4 4 6.5 4 9 4 11 5.6 12 7c1-1.4 3-3 5.5-3 4.1 0 5.8 4.2 4 8-2.5 4.5-9.5 9-9.5 9z"/>' +
        '</svg>' +
        '<svg class="checkround" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45"/></svg>' +
      '</button>' +
      '<div class="content" data-decrease="Like" data-increase="Liked"><span></span></div>' +
    '</div>';

  // ---------- URL <-> state ----------
  function readState() {
    var p = new URLSearchParams(window.location.search);
    var page = parseInt(p.get("page"), 10);
    return {
      s: S.clean(p.get("s")),
      genre: (p.get("genre") || "").trim().toLowerCase(),
      page: page > 0 ? page : 1
    };
  }

  // Canonical parameter order: s, genre, page. page=1 is omitted.
  function urlFor(st) {
    var p = new URLSearchParams();
    if (st.s) p.set("s", st.s);
    if (st.genre) p.set("genre", st.genre);
    if (st.page > 1) p.set("page", String(st.page));
    var q = p.toString();
    return window.location.pathname + (q ? "?" + q : "");
  }

  // ---------- data ----------
  var browse = null;
  function browseList() {
    if (!browse) browse = S.items().filter(function (it) { return it.category === CATEGORY; });
    return browse;
  }

  // Same rule the old chip filter used: substring of the item's joined, lower-cased genres.
  function hasGenre(it, g) {
    return (it.genres || []).join("|").toLowerCase().indexOf(g) !== -1;
  }

  function compute(st) {
    var list = st.s ? S.search(st.s) : browseList();
    if (st.genre) list = list.filter(function (it) { return hasGenre(it, st.genre); });
    return list;
  }

  // ---------- rendering ----------
  // Mirrors templates/_cards.html so JS-rendered and pre-rendered cards are identical.
  function card(it) {
    var id = S.esc(it.id);
    var title = S.esc(it.title);
    var src = S.poster(it.poster, THUMB_W);
    var full = S.poster(it.poster, 0);
    var ep = it.episode_tag ? S.esc(String(it.episode_tag).replace(/E /g, "EP ")) : "";
    return '<div class="card" data-id="' + id + '">' +
      '<a class="card-link" href="' + ROOT + 'pages/' + id + '.html">' +
        '<div class="thumb-wrap">' +
          '<img src="' + S.esc(src) + '" alt="' + title + '" loading="lazy" decoding="async"' +
            (src !== full ? ' data-full="' + S.esc(full) + '"' : "") + '>' +
          '<div class="thumb-scrim"></div>' +
          (ep ? '<div class="ep-badge">' + ep + '</div>' : "") +
        '</div>' +
        '<div class="info"><div class="title">' + title + '</div>' +
          '<div class="meta">' + S.esc(it.type) + (ep ? " \u00b7 " + ep : "") + '</div></div>' +
      '</a>' +
      FAV_HTML.replace("{ID}", id) +
    '</div>';
  }

  function renderCards(pageItems, st) {
    if (pageItems.length) {
      grid.innerHTML = pageItems.map(card).join("");
    } else {
      grid.innerHTML = '<p class="empty-msg">' +
        (st.s ? 'No results found for "' + S.esc(st.s) + '".' : "No titles found.") + '</p>';
    }
    // wire the freshly inserted heart buttons (favourites keep working)
    if (window.SITE_APP && window.SITE_APP.bindFavs) window.SITE_APP.bindFavs(grid);
  }

  function pageLink(st, n, cls, label, attrs) {
    return '<a class="pg-btn' + (cls ? " " + cls : "") + '" href="' +
      S.esc(urlFor({ s: st.s, genre: st.genre, page: n })) + '"' + (attrs || "") + '>' + label + '</a>';
  }

  function renderNav(st, total, count) {
    if (!nav) return;
    if (total <= 1) { nav.innerHTML = ""; nav.style.display = "none"; return; }
    nav.style.display = "";

    var cur = st.page;
    var narrow = window.matchMedia && window.matchMedia("(max-width: 480px)").matches;
    var span = narrow ? 1 : 2;                       // numbers shown each side of the current page
    var from = Math.max(1, cur - span);
    var to = Math.min(total, cur + span);
    if (from === 1) to = Math.min(total, 2 * span + 1);       // keep the window the same width at the edges
    if (to === total) from = Math.max(1, total - 2 * span);

    var out = "";
    out += cur > 1
      ? pageLink(st, cur - 1, "pg-prev", '\u2039<span class="pg-txt"> Prev</span>', ' rel="prev" aria-label="Previous page"')
      : '<span class="pg-btn pg-prev pg-disabled" aria-disabled="true">\u2039<span class="pg-txt"> Prev</span></span>';

    if (from > 1) {
      out += pageLink(st, 1, "", "1");
      if (from > 2) out += '<span class="page-info">\u2026</span>';
    }
    for (var n = from; n <= to; n++) {
      out += n === cur
        ? '<span class="pg-btn active" aria-current="page">' + n + '</span>'
        : pageLink(st, n, "", String(n));
    }
    if (to < total) {
      if (to < total - 1) out += '<span class="page-info">\u2026</span>';
      out += pageLink(st, total, "", String(total));
    }

    out += cur < total
      ? pageLink(st, cur + 1, "pg-next", '<span class="pg-txt">Next </span>\u203a', ' rel="next" aria-label="Next page"')
      : '<span class="pg-btn pg-next pg-disabled" aria-disabled="true"><span class="pg-txt">Next </span>\u203a</span>';

    out += '<div class="pg-status">Page ' + cur + ' of ' + total + ' \u00b7 ' + count + ' titles</div>';
    nav.innerHTML = out;
  }

  // Genre chips: same DOM/classes as before (built once from the catalog, not from the cards).
  var chipsBuilt = false;
  function buildChips() {
    if (chipsBuilt || !genreBar) return;
    chipsBuilt = true;
    var set = {};
    browseList().forEach(function (it) {
      (it.genres || []).forEach(function (g) {
        g = String(g).trim().toLowerCase();
        if (g) set[g] = true;
      });
    });
    var genres = Object.keys(set).sort();
    if (!genres.length) return;
    var frag = document.createDocumentFragment();
    function chip(label, value) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "genre-chip";
      b.textContent = label;
      b.dataset.genre = value;
      frag.appendChild(b);
    }
    chip("All", "");
    genres.forEach(function (g) {
      chip(g.replace(/\b\w/g, function (c) { return c.toUpperCase(); }), g);
    });
    genreBar.appendChild(frag);
  }

  function markChip(genre) {
    if (!genreBar) return;
    var chips = genreBar.querySelectorAll(".genre-chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle("active", chips[i].dataset.genre === genre);
    }
  }

  function setRobots(noindex) {
    if (noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement("meta");
        robotsMeta.name = "robots";
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.content = "noindex,follow";        // search result URLs shouldn't be indexed
    } else if (robotsMeta) {
      robotsMeta.remove();
      robotsMeta = null;
    }
  }

  function scrollToListing() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    wrap.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  var lastUrl = null;
  var firstRender = true;

  // Reads the URL, renders exactly one page. Safe to call repeatedly (no-op if nothing changed).
  function render(scroll) {
    var st = readState();
    var list = compute(st);
    var total = Math.max(1, Math.ceil(list.length / PER));
    if (st.page > total) {                           // /?page=999 -> last page (URL is corrected)
      st.page = total;
      window.history.replaceState(window.history.state, "", urlFor(st));
    }
    var url = urlFor(st);
    var isDefault = !st.s && !st.genre && st.page === 1;

    if (url !== lastUrl) {
      html.classList.toggle("search-mode", !!st.s);
      buildChips();
      markChip(st.genre);

      // The pre-rendered page 1 is already correct: skip the DOM work on first load.
      if (!(firstRender && isDefault && grid.children.length)) {
        var start = (st.page - 1) * PER;
        renderCards(list.slice(start, start + PER), st);
      }
      renderNav(st, total, list.length);

      if (st.s) {
        if (headTitle) headTitle.textContent = 'Results for "' + st.s + '"';
        if (headSub) headSub.textContent = list.length + (list.length === 1 ? " title found" : " titles found");
      }
      document.title = st.s ? st.s + " \u2014 Search \u2014 " + BRAND
                            : (st.page > 1 ? "Page " + st.page + " \u2014 " + BASE_TITLE : BASE_TITLE);
      setRobots(!!st.s);
      S.syncInput(st.s);
      lastUrl = url;
    }

    html.classList.remove("listing-pending");
    firstRender = false;
    if (scroll) scrollToListing();
  }

  // In-page navigation: pushState + render. Anything cross-page falls back to a real navigation.
  function go(url) {
    var a = document.createElement("a");
    a.href = url;
    if (a.origin !== window.location.origin || a.pathname !== window.location.pathname) {
      window.location.href = url;
      return;
    }
    var target = a.pathname + a.search;
    if (target !== window.location.pathname + window.location.search) {
      window.history.pushState(null, "", target);
    }
    render(true);
  }

  // ---------- events ----------
  function onLinkClick(e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();                              // page-loader.js skips defaultPrevented clicks
    go(a.getAttribute("href"));
  }
  if (nav) nav.addEventListener("click", onLinkClick);

  if (clearLink) {
    clearLink.setAttribute("href", window.location.pathname);
    clearLink.addEventListener("click", onLinkClick);
  }

  if (genreBar) {
    genreBar.addEventListener("click", function (e) {
      var chip = e.target.closest ? e.target.closest(".genre-chip") : null;
      if (!chip) return;
      var st = readState();
      go(urlFor({ s: st.s, genre: chip.dataset.genre || "", page: 1 }));
    });
  }

  S.fallback(grid);
  window.addEventListener("popstate", function () { render(false); });

  window.HAS_LISTING = { go: go, render: render };
  render(false);
})();
