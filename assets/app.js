// ============================================================
// Shared front-end behaviour: hamburger drawer, search overlay,
// genre chip filter, favourites (localStorage), pagination.
// (Search now lives in search.js; the homepage listing in pagination.js.)
// ============================================================
(function () {
  "use strict";

  var ROOT = document.body.getAttribute("data-root") || "";
  var PER_PAGE = 12;

  // ---------- Drawer menu ----------
  var drawer = document.getElementById("drawer");
  var backdrop = document.getElementById("drawerBackdrop");
  function openDrawer() { if (drawer) drawer.classList.add("open"); if (backdrop) backdrop.classList.add("open"); }
  function closeDrawer() { if (drawer) drawer.classList.remove("open"); if (backdrop) backdrop.classList.remove("open"); }
  var menuBtn = document.getElementById("menuBtn");
  var bnMenuBtn = document.getElementById("bnMenuBtn");
  var drawerCloseBtn = document.getElementById("drawerCloseBtn");
  if (menuBtn) menuBtn.addEventListener("click", openDrawer);
  if (bnMenuBtn) bnMenuBtn.addEventListener("click", openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  // ---------- Search overlay: moved to search.js ----------

  // ---------- Genre + Pagination ----------
  var genreBar = document.getElementById("genreBar");
  var cardGrid = document.getElementById("cardGrid");
  var currentPage = 1;
  var currentGenre = "";
  var allCards = [];

  function getVisibleCards() {
    if (!currentGenre) return allCards;
    return allCards.filter(function (c) {
      return (c.dataset.genres || "").indexOf(currentGenre) !== -1;
    });
  }

  function renderPage() {
    if (!cardGrid || allCards.length === 0) return;

    var visible = getVisibleCards();
    var totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * PER_PAGE;
    var end = start + PER_PAGE;

    allCards.forEach(function (c) { c.style.display = "none"; });
    visible.forEach(function (c, i) {
      if (i >= start && i < end) c.style.display = "";
    });

    var pagEl = document.getElementById("pagination");
    if (!pagEl) {
      pagEl = document.createElement("div");
      pagEl.className = "pagination";
      pagEl.id = "pagination";
      cardGrid.parentNode.insertBefore(pagEl, cardGrid.nextSibling);
    }

    if (visible.length <= PER_PAGE) {
      pagEl.innerHTML = "";
      pagEl.style.display = "none";
      return;
    }
    pagEl.style.display = "flex";

    var html = "";
    html += '<button type="button" data-page="prev" ' + (currentPage === 1 ? "disabled" : "") + ' aria-label="Previous">‹</button>';

    var maxButtons = 5;
    var startP = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    var endP = Math.min(totalPages, startP + maxButtons - 1);
    if (endP - startP < maxButtons - 1) startP = Math.max(1, endP - maxButtons + 1);

    if (startP > 1) {
      html += '<button type="button" data-page="1">1</button>';
      if (startP > 2) html += '<span class="page-info">…</span>';
    }
    for (var p = startP; p <= endP; p++) {
      html += '<button type="button" data-page="' + p + '" class="' + (p === currentPage ? "active" : "") + '">' + p + '</button>';
    }
    if (endP < totalPages) {
      if (endP < totalPages - 1) html += '<span class="page-info">…</span>';
      html += '<button type="button" data-page="' + totalPages + '">' + totalPages + '</button>';
    }

    html += '<button type="button" data-page="next" ' + (currentPage === totalPages ? "disabled" : "") + ' aria-label="Next">›</button>';
    html += '<span class="page-info">' + visible.length + ' titles</span>';

    pagEl.innerHTML = html;
  }

  if (cardGrid) {
    allCards = Array.prototype.slice.call(cardGrid.querySelectorAll(".card"));

    if (genreBar && allCards.length > 0) {
      var genreSet = {};
      allCards.forEach(function (c) {
        (c.dataset.genres || "").split("|").forEach(function (g) {
          g = g.trim();
          if (g) genreSet[g] = true;
        });
      });
      var genres = Object.keys(genreSet).sort();
      if (genres.length > 0) {
        var allChip = document.createElement("button");
        allChip.className = "genre-chip active";
        allChip.textContent = "All";
        allChip.dataset.genre = "";
        genreBar.appendChild(allChip);
        genres.forEach(function (g) {
          var chip = document.createElement("button");
          chip.className = "genre-chip";
          chip.textContent = g.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
          chip.dataset.genre = g;
          genreBar.appendChild(chip);
        });
        genreBar.addEventListener("click", function (e) {
          var chip = e.target.closest(".genre-chip");
          if (!chip) return;
          genreBar.querySelectorAll(".genre-chip").forEach(function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
          currentGenre = chip.dataset.genre || "";
          currentPage = 1;
          renderPage();
        });
      }
    }

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("#pagination button[data-page]");
      if (!btn || btn.disabled) return;
      var action = btn.getAttribute("data-page");
      if (action === "prev") currentPage--;
      else if (action === "next") currentPage++;
      else currentPage = parseInt(action, 10);
      renderPage();
      if (cardGrid) cardGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    renderPage();
  }

  // ---------- Favourites ----------
  var FAV_KEY = "fav_ids";
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function setFavs(arr) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function toggleFav(id, btn) {
    var favs = getFavs();
    var idx = favs.indexOf(id);
    if (idx === -1) { favs.push(id); btn.classList.add("active"); }
    else { favs.splice(idx, 1); btn.classList.remove("active"); }
    setFavs(favs);
  }
  // root: optional container. Buttons already wired are skipped, so this is safe to call
  // again after JS-rendered cards are inserted (pagination.js does).
  function initFavButtons(root) {
    var favs = getFavs();
    (root || document).querySelectorAll("[data-fav-id]").forEach(function (btn) {
      if (btn.dataset.favBound) return;
      btn.dataset.favBound = "1";
      var id = btn.getAttribute("data-fav-id");
      if (favs.indexOf(id) !== -1) btn.classList.add("active");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleFav(id, btn);
      });
    });
  }
  initFavButtons();

  // ---------- Dark / Bright theme toggle ----------
  (function () {
    var input = document.getElementById("themeToggleInput");
    var btn = document.getElementById("themeToggleBtn");
    var moon = btn ? btn.querySelector(".theme-icon-moon") : null;
    var sun = btn ? btn.querySelector(".theme-icon-sun") : null;

    function applyIcons(isDark) {
      if (moon) moon.style.display = isDark ? "none" : "block";
      if (sun) sun.style.display = isDark ? "block" : "none";
      if (input) input.checked = isDark;
    }

    function setTheme(isDark) {
      if (isDark) {
        document.documentElement.classList.add("dark-mode");
        document.documentElement.classList.remove("light-mode");
        try { localStorage.setItem("theme", "dark"); } catch (e) {}
      } else {
        document.documentElement.classList.remove("dark-mode");
        document.documentElement.classList.add("light-mode");
        try { localStorage.setItem("theme", "bright"); } catch (e) {}
      }
      applyIcons(isDark);
    }

    var isDark = document.documentElement.classList.contains("dark-mode");
    applyIcons(isDark);

    if (btn) {
      btn.addEventListener("click", function () {
        setTheme(!document.documentElement.classList.contains("dark-mode"));
      });
    }
    if (input) {
      input.addEventListener("change", function () {
        setTheme(!!input.checked);
      });
    }
  })();

  window.SITE_APP = { getFavs: getFavs, bindFavs: initFavButtons };
})();
