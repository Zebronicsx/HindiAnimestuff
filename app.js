
/* Aniclux — Anime Streaming */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

let ANIMES = [];       // full dataset (episode links)
let INDEX = [];        // lightweight index for grids
let currentAnime = null;
let currentEpisode = null;
let currentQuality = '720p';
let browsePage = 0;
const PAGE_SIZE = 36;
let filteredBrowse = [];

// Base path for assets (works in subfolder or root)
function assetUrl(file) {
  try {
    const s = document.querySelector('script[src*="app.js"]');
    if (s && s.src) return new URL(file, s.src).href;
  } catch (_) {}
  try {
    return new URL(file, window.location.href).href;
  } catch (_) {}
  return './' + file.replace(/^\.\//, '');
}

function slugify(title, season) {
  const s = `${title || ''} ${season || ''}`.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return s || 'anime';
}


function hasStreamableLinks(anime) {
  if (!anime) return false;
  if (anime.streamable === false) return false;
  const eps = anime.episode_links || {};
  for (const q of Object.values(eps)) {
    if (!q || typeof q !== 'object') continue;
    for (const url of Object.values(q)) {
      if (url && isStreamableUrl(url)) return true;
    }
  }
  const dl = anime.downloads || {};
  for (const url of Object.values(dl)) {
    if (url && isStreamableUrl(url)) return true;
  }
  return false;
}

function isStreamableUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (/t\.me|telegram\.me|filesdl\.in|mediafire|mega\.nz|drive\.google/.test(host)) return false;
    if (/workers\.dev|r2\.dev|cloudflare|b-cdn|bunnycdn/.test(host)) return true;
    if (isAbyssUrl(url)) return true;
    return true;
  } catch (_) {
    return false;
  }
}

/** Abyss / Hydrax embed detection (short.ink, short.icu, abysscdn, playhydrax, player.abyssplayer) */
function isAbyssUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return /^(?:www\.)?(?:short\.ink|short\.icu|abysscdn\.com|playhydrax\.com|player\.abyssplayer\.com|abyssplayer\.com|hydrax\.net)$/.test(host)
      || host.endsWith('.playhydrax.com')
      || host.endsWith('.abysscdn.com');
  } catch (_) {
    return false;
  }
}

/** Build a canonical Abyss embed URL for iframe src */
function getAbyssEmbedUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    let id = '';
    if (/short\.ink|short\.icu/.test(host)) {
      id = u.pathname.replace(/^\/+|\/+$/g, '').split('/')[0] || '';
    } else {
      id = u.searchParams.get('v') || u.pathname.replace(/^\/+|\/+$/g, '').split('/').pop() || '';
    }
    if (!id) return url;
    return 'https://player.abyssplayer.com/?v=' + encodeURIComponent(id);
  } catch (_) {
    return url;
  }
}

function clearAbyssIframe() {
  const iframe = $('#abyssPlayer');
  if (!iframe) return;
  iframe.removeAttribute('src');
  iframe.hidden = true;
  iframe.classList.remove('active');
}

function clearNativeVideo() {
  const video = $('#mainPlayer');
  if (!video) return;
  video.onerror = null;
  video.removeAttribute('src');
  try { video.load(); } catch (_) {}
  video.classList.remove('active');
}

function findAnimeBySlug(slug) {
  if (!slug) return null;
  const s = decodeURIComponent(slug).toLowerCase();
  return ANIMES.find(a => (a.slug || '').toLowerCase() === s)
    || ANIMES.find(a => slugify(a.title, a.season) === s)
    || ANIMES.find(a => String(a.id) === s)
    || null;
}

function animePath(a) {
  const slug = a.slug || slugify(a.title, a.season);
  return `/anime/${slug}`;
}

function navigate(path, replace) {
  try {
    if (replace) history.replaceState(null, '', path);
    else history.pushState(null, '', path);
  } catch (e) { location.href = path; return; }
  handleRoute();
}

// ===== LINK SHORTENER (ads) — only for 1080p downloads =====
const SHORTENER = {
  apiKey: 'bcf6f322937134bd31b5724f6296554707240da8',
  apiBase: 'https://adrinolinks.in/api',
  fullBase: 'https://adrinolinks.in/full'
};

async function getAdShortLink(longUrl) {
  const apiUrl = `${SHORTENER.apiBase}?api=${encodeURIComponent(SHORTENER.apiKey)}&url=${encodeURIComponent(longUrl)}`;
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data && data.status === 'success' && (data.shortenedUrl || data.shorturl || data.short_url)) {
      return data.shortenedUrl || data.shorturl || data.short_url;
    }
    if (data && (data.shortenedUrl || data.shorturl || data.short_url)) {
      return data.shortenedUrl || data.shorturl || data.short_url;
    }
    console.warn('Shortener response:', data);
  } catch (e) {
    console.warn('Shortener API failed (CORS?), using full redirect fallback', e);
  }
  // Fallback: full page flow with base64 (works even if fetch CORS blocks)
  try {
    const b64 = btoa(unescape(encodeURIComponent(longUrl)));
    return `${SHORTENER.fullBase}?api=${encodeURIComponent(SHORTENER.apiKey)}&url=${b64}&type=1`;
  } catch (_) {
    return longUrl;
  }
}

async function downloadQuality(fileUrl, btnEl) {
  if (!fileUrl) {
    alert('Download link not found');
    return;
  }
  const label = btnEl ? btnEl.innerHTML : '';
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = '<span class="dl-label">Preparing…</span>';
  }
  try {
    const short = await getAdShortLink(fileUrl);
    window.open(short, '_blank', 'noopener,noreferrer');
  } catch (e) {
    alert('Could not create short link. Opening direct URL…');
    window.open(fileUrl, '_blank');
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = label;
    }
  }
}



async function init() {
  const heroTitle = $('#heroTitle');
  const heroDesc = $('#heroDesc');

  function showLoadError(msg) {
    console.error(msg);
    if (heroTitle) heroTitle.textContent = 'Failed to load anime data';
    if (heroDesc) heroDesc.textContent = String(msg);
  }

  try {
    const urls = [
      assetUrl('anime_index.json'),
      './anime_index.json',
      'anime_index.json'
    ];
    let indexData = null;
    let lastErr = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status + ' @ ' + url);
        indexData = await res.json();
        if (!Array.isArray(indexData)) throw new Error('Invalid index format');
        console.log('Loaded index from', url, indexData.length);
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!indexData) throw lastErr || new Error('Could not load anime_index.json');

    INDEX = indexData;
    ANIMES = INDEX.map(x => ({ ...x, episode_links: {} }));

    // Safe setup — never block home render
    ['setupNav', 'setupSearch', 'setupFilters', 'setupTheme', 'setupBackTop'].forEach(name => {
      try {
        if (typeof window[name] === 'function') window[name]();
        else if (typeof eval(name) === 'function') { /* noop */ }
      } catch (e) { console.warn(name, e); }
    });
    try { setupNav(); } catch (e) { console.warn(e); }
    try { setupSearch(); } catch (e) { console.warn(e); }
    try { setupFilters(); } catch (e) { console.warn(e); }
    try { setupTheme(); } catch (e) { console.warn(e); }
    try { setupBackTop(); } catch (e) { console.warn(e); }
    try { setupSideMenu(); } catch (e) { console.warn(e); }
    try { setupPlayerProtection(); } catch (e) { console.warn(e); }

    try { renderHome(); } catch (e) { console.warn('renderHome', e); }
    try { handleRoute(); } catch (e) { console.warn('handleRoute', e); }

    // Full catalog in background
    const fullUrls = [assetUrl('anime_data.json'), './anime_data.json', 'anime_data.json'];
    for (const url of fullUrls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const full = await res.json();
        if (Array.isArray(full) && full.length) {
          ANIMES = full;
          console.log('Loaded full data', full.length);
          const mg = $('#menuGenres'); if (mg) { mg.dataset.ready = ''; }
          try { setupSideMenu(); } catch (_) {}
          // Refresh open detail with full episode links
          if (currentAnime && currentAnime.id) {
            const fresh = ANIMES.find(a => String(a.id) === String(currentAnime.id));
            if (fresh) {
              currentAnime = fresh;
              try { showDetail(fresh); } catch (_) {}
            }
          } else {
            try {
              if (!location.pathname.includes('/anime/')) renderHome();
              else handleRoute();
            } catch (_) {}
          }
        }
        break;
      } catch (e) {
        console.warn('full data', url, e);
      }
    }
  } catch (e) {
    showLoadError(e && e.message ? e.message : e);
  }

  window.addEventListener('scroll', () => {
    const nav = $('#navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
  });
  window.addEventListener('popstate', () => {
    try { handleRoute(); } catch (e) { console.warn(e); }
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="/"]');
    if (a && a.origin === location.origin && !a.target) {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('/#') && !href.includes('.')) {
        e.preventDefault();
        navigate(href);
        return;
      }
    }
    const drawer = $('#downloadDrawer');
    const panel = $('#downloadPanel');
    const toggle = $('#downloadToggle');
    if (!drawer || !panel || panel.hasAttribute('hidden')) return;
    if (!drawer.contains(e.target)) {
      panel.setAttribute('hidden', '');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function handleRoute() {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'anime' && parts[1]) {
    const anime = findAnimeBySlug(parts[1]);
    if (anime) { showDetail(anime); return; }
    showPage('home');
    return;
  }
  const sParam = new URLSearchParams(location.search).get('s') || new URLSearchParams(location.search).get('q');
  if (parts[0] === 'search' || (parts.length === 0 && sParam)) {
    showPage('search');
    setupSearchPage();
    return;
  }
  if (parts[0] === 'letter' && parts[1]) {
    renderLetterPage(decodeURIComponent(parts[1]));
    return;
  }
  if (parts[0] === 'trending') {
    showPage('trending');
    renderTrendingGrid();
    return;
  }
  if (parts[0] === 'report') {
    showPage('report');
    setupReportForm();
    return;
  }
  if (parts[0] === 'dmca') {
    showPage('dmca');
    return;
  }
  if (parts[0] === 'genre' && parts[1]) {
    renderGenrePage(decodeURIComponent(parts[1]));
    return;
  }
  if (parts[0] === 'series') {
    showPage('series');
    renderCategoryGrid('series');
    return;
  }
  if (parts[0] === 'movies') {
    showPage('movies');
    renderCategoryGrid('movies');
    return;
  }
  if (parts[0] === 'watchlist') {
    showPage('watchlist');
    renderWatchlist();
    return;
  }
  // Global ?s= on any path → search
  const gq = new URLSearchParams(location.search).get('s') || new URLSearchParams(location.search).get('q');
  if (gq) {
    showPage('search');
    setupSearchPage();
    return;
  }
  showPage('home');
}


function showPage(name) {
  const map = { home: 'page-home', search: 'page-search', series: 'page-series', movies: 'page-movies', watchlist: 'page-watchlist', trending: 'page-trending', letter: 'page-letter', detail: 'page-detail', report: 'page-report', dmca: 'page-dmca', genre: 'page-genre' };
  // Stop playback when leaving the detail/watch view
  if (name !== 'detail') {
    try {
      clearNativeVideo();
      clearAbyssIframe();
      const wrap = $('#playerWrap');
      if (wrap) wrap.classList.remove('mode-abyss', 'mode-native', 'playing', 'show-controls');
    } catch (_) {}
  }
  $$('.page').forEach(p => p.classList.remove('active'));
  const id = map[name] || 'page-home';
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
  $$('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === name);
  });
  $$('.bn-item').forEach(l => {
    l.classList.toggle('active', l.dataset.page === name);
  });
}

function setupNav() {
  $$('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (el.dataset.page === 'menu') return;
      e.preventDefault();
      const page = el.dataset.page;
      closeSideMenu();
      if (page === 'home') navigate('/');
      else navigate('/' + page);
    });
  });
  $('#backBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (history.length > 1) history.back();
    else navigate('/');
  });
  const menuBtn = $('#menuTabBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openSideMenu();
    });
  }
  $('#sideMenuBackdrop')?.addEventListener('click', closeSideMenu);
  $$('.side-link[data-page]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      closeSideMenu();
      const page = a.dataset.page;
      if (page === 'home') navigate('/');
      else navigate('/' + page);
    });
  });
}

function openSideMenu() {
  const m = $('#sideMenu');
  if (m) m.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeSideMenu() {
  const m = $('#sideMenu');
  if (m) m.hidden = true;
  document.body.style.overflow = '';
}

function renderTrendingPage() {
  document.title = 'Trending — Aniclux';
  const grid = $('#trendingGrid');
  if (!grid) return;
  let list = ANIMES.filter(a => a.trending);
  if (!list.length) {
    list = [...ANIMES].filter(a => parseFloat(a.rating) > 0)
      .sort((a,b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 48);
  }
  grid.innerHTML = list.map(a => posterCardHTML(a)).join('');
  bindPosterClicks(grid);
}


// ===== SEARCH =====
function setupSearch() {
  const input = $('#searchInput');
  const results = $('#searchResults');
  if (!input) return; // navbar search removed — use /search page
  let timer;

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) {
      results.classList.remove('open');
      return;
    }
    timer = setTimeout(() => {
      const matches = ANIMES.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.genres || []).some(g => g.toLowerCase().includes(q))
      ).slice(0, 12);
      if (!matches.length) {
        results.innerHTML = '<div class="search-item" style="justify-content:center;color:var(--text-dim)">No results</div>';
      } else {
        results.innerHTML = matches.map(a => `
          <div class="search-item" data-id="${a.id}">
            <img src="${a.poster || ''}" alt="" loading="lazy" onerror="this.src='https://via.placeholder.com/40x56?text=?'" />
            <div class="search-item-info">
              <h4>${escapeHtml(a.title)}</h4>
              <span>${a.season || ''} · ${a.rating || '?'} ★</span>
            </div>
          </div>
        `).join('');
        results.querySelectorAll('.search-item').forEach(item => {
          item.addEventListener('click', () => {
            const anime = ANIMES.find(a => String(a.id) === String(item.dataset.id));
            results.classList.remove('open');
            input.value = '';
            if (anime) navigate(animePath(anime));
          });
        });
      }
      results.classList.add('open');
    }, 180);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) results.classList.remove('open');
  });
}

// ===== HOME =====
function renderHome() {
  document.title = 'Aniclux — Watch Anime Online Free';
  const list = applyLangFilter(ANIMES);
  let trending = list.filter(a => a.trending);
  if (!trending.length) {
    trending = [...list].filter(a => parseFloat(a.rating) > 0)
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 12);
  }
  const withRating = [...list].filter(a => parseFloat(a.rating) > 0)
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  const series = list.filter(a => a.ui_category !== 'movies' && a.type !== 'Movie');
  const movies = list.filter(a => a.ui_category === 'movies' || a.type === 'Movie');
  const seriesRated = withRating.filter(a => a.ui_category !== 'movies' && a.type !== 'Movie');
  const moviesRated = withRating.filter(a => a.ui_category === 'movies' || a.type === 'Movie');

  setupHero((trending.length ? trending : withRating).slice(0, 6));
  setupLangPills();
  renderAZ();

  // Watch history
  const hist = getHistory().map(id => ANIMES.find(a => String(a.id) === String(id))).filter(Boolean);
  const histEl = $('#rowHistory');
  const histEmpty = $('#historyEmpty');
  if (histEl) {
    histEl.innerHTML = hist.slice(0, 20).map(a => posterCardHTML(a)).join('');
    bindPosterClicks(histEl);
  }
  if (histEmpty) histEmpty.style.display = hist.length ? 'none' : 'block';

  renderPosterRow('#rowLatest', (trending.length ? trending : series).slice(0, 18));
  renderPosterRow('#rowMostSeries', seriesRated.slice(0, 18));
  renderPosterRow('#rowMostMovies', moviesRated.slice(0, 18));
  renderTop10('#rowTopSeries', seriesRated.slice(0, 10));
  renderTop10('#rowTopMovies', moviesRated.slice(0, 10));
  renderPosterRow('#rowOnAir', trending.slice(0, 18));
  renderPosterRow('#rowLatestMovies', movies.slice(0, 18));
}

let activeLang = 'All';
function applyLangFilter(arr) {
  if (!activeLang || activeLang === 'All') return arr;
  const L = activeLang.toLowerCase();
  return arr.filter(a => (a.languages || []).some(x => String(x).toLowerCase() === L));
}

function setupLangPills() {
  const wrap = $('#langPills');
  if (!wrap) return;
  const set = new Set();
  ANIMES.forEach(a => (a.languages || []).forEach(l => set.add(l)));
  const preferred = ['Hindi', 'English', 'Japanese', 'Tamil', 'Telugu', 'Malayalam', 'Korean', 'Chinese'];
  const langs = ['All', ...preferred.filter(l => set.has(l)), ...[...set].filter(l => !preferred.includes(l)).sort()];
  wrap.innerHTML = langs.map(l =>
    `<button type="button" class="lang-pill ${l === activeLang ? 'active' : ''}" data-lang="${l}">${l}</button>`
  ).join('');
  wrap.querySelectorAll('.lang-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      activeLang = btn.dataset.lang;
      renderHome();
    });
  });
}

function renderTop10(sel, list) {
  const el = $(sel);
  if (!el) return;
  el.innerHTML = list.map((a, i) => {
    const card = posterCardHTML(a);
    return card.replace('class="poster-card"', `class="poster-card" data-rank="${i+1}"`).replace(
      '<div class="poster-img-wrap">',
      `<div class="poster-img-wrap"><span class="rank-num">${i + 1}</span>`
    );
  }).join('');
  bindPosterClicks(el);
}

function renderAZ() {
  const nav = $('#azNav');
  if (!nav) return;
  const letters = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  nav.innerHTML = letters.map(L =>
    `<button type="button" data-letter="${L}">${L}</button>`
  ).join('');
  nav.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => navigate('/letter/' + encodeURIComponent(btn.dataset.letter)));
  });
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem('aniclux-history') || '[]'); } catch (_) { return []; }
}
function pushHistory(id) {
  let h = getHistory().filter(x => String(x) !== String(id));
  h.unshift(id);
  localStorage.setItem('aniclux-history', JSON.stringify(h.slice(0, 40)));
}

function renderLetterPage(letter) {
  showPage('letter');
  const title = $('#letterTitle');
  if (title) title.textContent = letter === '#' ? '0–9' : ('Letter ' + letter);
  document.title = (title ? title.textContent : letter) + ' — Aniclux';
  const grid = $('#letterGrid');
  if (!grid) return;
  const list = ANIMES.filter(a => {
    const t = (a.title || '').trim();
    if (!t) return false;
    if (letter === '#') return !/^[a-z]/i.test(t);
    return t[0].toUpperCase() === letter;
  });
  grid.innerHTML = list.map(a => posterCardHTML(a)).join('') || '<p class="empty-hint">No titles for this letter.</p>';
  bindPosterClicks(grid);
}

function setupHero(items) {
  if (!items || !items.length) {
    const t = $('#heroTitle');
    if (t) t.textContent = 'Welcome to Aniclux';
    return;
  }
  let idx = 0;
  const dots = $('#heroDots');
  if (dots) {
    dots.innerHTML = items.map((_, i) => `<div class="hero-dot ${i === 0 ? 'active' : ''}" data-i="${i}"></div>`).join('');
  }

  function show(i) {
    idx = i;
    const a = items[i];
    if (!a) return;
    const bg = $('#heroBg');
    if (bg) bg.style.backgroundImage = `url(${a.poster || ''})`;
    const title = $('#heroTitle');
    if (title) title.textContent = a.title || 'Untitled';
    const desc = $('#heroDesc');
    if (desc) desc.textContent = a.description || '';
    const meta = $('#heroMeta');
    if (meta) {
      meta.innerHTML = `
      ${a.rating ? `<span class="rating">★ ${a.rating}</span>` : ''}
      <span>${a.season || ''}</span>
      <span>${a.episodes ? a.episodes + ' eps' : ''}</span>
      <span>${(a.languages || []).slice(0, 3).join(' · ')}</span>
    `;
    }
    const watch = $('#heroWatchBtn');
    const info = $('#heroInfoBtn');
    if (watch) watch.onclick = () => navigate(animePath(a));
    if (info) info.onclick = () => navigate(animePath(a));
    $$('.hero-dot').forEach((d, di) => d.classList.toggle('active', di === i));
  }

  show(0);
  if (dots) {
    dots.querySelectorAll('.hero-dot').forEach(d => {
      d.addEventListener('click', () => show(+d.dataset.i));
    });
  }
  if (items.length > 1) {
    setInterval(() => show((idx + 1) % items.length), 7000);
  }
}

function renderPosterRow(sel, list) {
  const el = $(sel);
  if (!el) return;
  el.innerHTML = list.map(a => posterCardHTML(a)).join('');
  bindPosterClicks(el);
}

function posterCardHTML(a) {
  const rating = a.rating && a.rating !== '?' ? a.rating : null;
  return `
    <div class="poster-card" data-id="${a.id}">
      <div class="poster-img-wrap">
        <img src="${a.poster || ''}" alt="${escapeHtml(a.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'" />
        <div class="poster-overlay"><div class="play-icon"></div></div>
        ${a.trending ? '<span class="badge">Hot</span>' : ''}
        ${rating ? `<span class="rating-badge">★ ${rating}</span>` : ''}
      </div>
      <div class="poster-title">${escapeHtml(a.title)}</div>
      <div class="poster-sub">${a.season || a.type || ''}</div>
    </div>
  `;
}

function bindPosterClicks(container) {
  if (!container) return;
  container.querySelectorAll('.poster-card').forEach(card => {
    card.addEventListener('click', () => {
      const anime = ANIMES.find(a => String(a.id) === String(card.dataset.id));
      if (anime) navigate(animePath(anime));
    });
  });
}

// ===== BROWSE =====
function setupFilters() {
  // Browse filter UI removed — safe no-op
  const sel = $('#genreFilter');
  if (!sel) return;
  const genres = new Set();
  ANIMES.forEach(a => (a.genres || []).forEach(g => genres.add(g)));
  [...genres].sort().forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    sel.appendChild(opt);
  });
  ['genreFilter', 'langFilter', 'sortFilter'].forEach(id => {
    $(`#${id}`)?.addEventListener('change', () => renderBrowse(true));
  });
  $('#loadMoreBtn')?.addEventListener('click', () => {
    browsePage++;
    renderBrowse(false);
  });
}

function renderBrowse(reset = true) {
  if (reset) browsePage = 0;
  const genre = $('#genreFilter')?.value || '';
  const lang = $('#langFilter')?.value || '';
  const sort = $('#sortFilter')?.value || 'title';

  let list = [...ANIMES];
  if (genre) list = list.filter(a => (a.genres || []).includes(genre));
  if (lang) list = list.filter(a => (a.languages || []).includes(lang));

  if (sort === 'rating') {
    list.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
  } else if (sort === 'trending') {
    list.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || a.title.localeCompare(b.title));
  } else {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  filteredBrowse = list;
  const slice = list.slice(0, (browsePage + 1) * PAGE_SIZE);
  const grid = $('#browseGrid');
  grid.innerHTML = slice.map(a => posterCardHTML(a)).join('');
  bindPosterClicks(grid);

  const btn = $('#loadMoreBtn');
  if (btn) btn.style.display = slice.length < list.length ? 'inline-flex' : 'none';
}

function renderTrending() {
  const list = ANIMES.filter(a => a.trending).length
    ? ANIMES.filter(a => a.trending)
    : [...ANIMES].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0)).slice(0, 48);
  const grid = $('#trendingGrid');
  grid.innerHTML = list.map(a => posterCardHTML(a)).join('');
  bindPosterClicks(grid);
}

// ===== DETAIL / PLAYER =====
function showDetail(anime) {
  currentAnime = anime;
  currentEpisode = null;
  showPage('detail');
  document.title = (anime.title || 'Anime') + ' — Aniclux';
  pushHistory(anime.id);
  bindPulseHeart(anime.id || anime.slug || anime.title);
  const wlBtn = $('#watchlistBtn');
  if (wlBtn) {
    const on = isInWatchlist(anime.id);
    wlBtn.textContent = on ? '✓ Favourite' : '+ Favourite';
    wlBtn.classList.toggle('on', on);
    wlBtn.onclick = () => {
      const now = toggleWatchlist(anime.id);
      wlBtn.textContent = now ? '✓ Favourite' : '+ Favourite';
      wlBtn.classList.toggle('on', now);
    };
  }
  const banner = $('#dlOnlyBanner');
  if (banner) {
    const canStream = anime.streamable !== false && hasStreamableLinks(anime);
    banner.hidden = canStream;
  }

  $('#detailBg').style.backgroundImage = `url(${anime.poster || ''})`;
  $('#detailPoster').src = anime.poster || '';
  $('#detailTitle').textContent = anime.title + (anime.season ? ` — ${anime.season}` : '');
  $('#detailMeta').innerHTML = `
    ${anime.rating ? `<span class="rating">★ ${anime.rating}</span>` : ''}
    <span>${anime.type || 'TV Series'}</span>
    <span>${anime.episodes ? anime.episodes + ' Episodes' : ''}</span>
    <span>${anime.runtime || ''}</span>
  `;
  $('#detailDesc').textContent = anime.description || 'No description available.';
  $('#detailTags').innerHTML = [
    ...(anime.genres || []),
    ...(anime.languages || []).slice(0, 4)
  ].map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');

  // Reset player
  const video = $('#mainPlayer');
  const wrap = video.closest('.player-wrap');
  video.classList.remove('active');
  video.removeAttribute('src');
  video.poster = anime.poster || '';
  video.load();
  video.pause();
  
  if (wrap) {
    wrap.classList.remove('playing', 'show-controls');
    // keep ccReady so we don't rebind listeners, just reset UI
  }
  updatePlayBtn(false);
  
  const placeholder = $('#playerPlaceholder');
  placeholder.classList.remove('hidden');
  if (anime.poster) {
    placeholder.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url(${anime.poster})`;
    placeholder.style.backgroundSize = 'cover';
    placeholder.style.backgroundPosition = 'center';
  } else {
    placeholder.style.backgroundImage = '';
  }
  $('#nowPlaying').textContent = '';
  $('#qualitySelector').innerHTML = '';
  
  // Reset progress
  const fill = $('#progressFill');
  const handle = $('#progressHandle');
  const timeEl = $('#ccTime');
  if (fill) fill.style.width = '0%';
  if (handle) handle.style.left = '0%';
  if (timeEl) timeEl.textContent = '0:00 / 0:00';

  renderEpisodes(anime);
  // Auto-load first episode / movie if streamable
  const keys = Object.keys(anime.episode_links || {}).sort((a,b) => parseInt(a,10)-parseInt(b,10) || a.localeCompare(b));
  if (keys.length === 1 && hasStreamableLinks(anime)) {
    setTimeout(() => playEpisode(keys[0]), 100);
  }
  setupComments(anime.id || anime.slug || 'x');
}

function renderEpisodes(anime) {
  const links = anime.episode_links || {};
  const keys = Object.keys(links).sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const nb = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return na - nb;
  });

  $('#epCount').textContent = keys.length ? `${keys.length} available` : 'No episodes';
  const grid = $('#episodesGrid');
  if (!keys.length) {
    grid.innerHTML = '<p style="color:var(--text-dim);grid-column:1/-1">No episodes found for this title.</p>';
    return;
  }

  grid.innerHTML = keys.map(ep => {
    const quals = links[ep] || {};
    const hasAny = Object.keys(quals).length > 0;
    const label = (anime.type === 'Movie' || Object.keys(links).length === 1) ? 'Play' : `EP ${ep}`;
    return `<button class="ep-btn ${hasAny ? '' : 'disabled'}" data-ep="${ep}" ${hasAny ? '' : 'disabled'}>${label}</button>`;
  }).join('');

  grid.querySelectorAll('.ep-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => playEpisode(btn.dataset.ep));
  });

  // Do NOT auto-play on mobile — let user choose episode.
  // Poster stays full until user taps an episode.
  // (Auto-play was causing native controls bar to appear early)
}

function playEpisode(epKey) {
  // Always use latest catalog entry (index may lack episode_links)
  if (currentAnime && currentAnime.id) {
    const fresh = ANIMES.find(a => String(a.id) === String(currentAnime.id));
    if (fresh && fresh.episode_links && Object.keys(fresh.episode_links).length) {
      currentAnime = fresh;
    }
  }
  if (!currentAnime) return;
  const quals = currentAnime.episode_links?.[epKey] || {};
  const available = Object.keys(quals).filter(q => quals[q]);
  if (!available.length) {
    const np = $('#nowPlaying');
    if (np) np.textContent = 'Episode links still loading… tap again in a moment.';
    return;
  }

  currentEpisode = epKey;
  window._triedQuals = new Set();
  window._currentQuals = quals;

  const order = ['480p', '720p', '1080p'];
  const sorted = order.filter(q => available.includes(q)).concat(
    available.filter(q => !order.includes(q))
  );

  // Mobile: prefer 480p then 720p (better codec support); avoid 1080p HEVC first
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const prefer = isMobile ? ['480p', '720p', '1080p'] : ['720p', '480p', '1080p'];
  let chosen = prefer.find(q => available.includes(q)) || sorted[0];
  currentQuality = chosen;

  // Stream buttons — every quality can be streamed (including single 1080p)
  const qs = $('#qualitySelector');
  qs.innerHTML = sorted.map(q =>
    `<button type="button" class="quality-btn ${q === chosen ? 'active' : ''}" data-q="${q}" title="Stream ${q}">
      <span class="ico ico-play"></span>${q}
    </button>`
  ).join('');

  qs.querySelectorAll('.quality-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.q;
      currentQuality = q;
      window._triedQuals = new Set();
      qs.querySelectorAll('.quality-btn').forEach(b => b.classList.toggle('active', b.dataset.q === q));
      if ($('#nowPlaying')) {
        $('#nowPlaying').innerHTML = `Now playing: <strong>Episode ${epKey}</strong> · ${q}`;
      }
      loadVideo(quals[q], quals);
    });
  });

  // Download drawer — one button per quality
  const panel = $('#downloadActions');
  const toggle = $('#downloadToggle');
  const drawerPanel = $('#downloadPanel');
  if (panel) {
    panel.innerHTML = sorted.map(q =>
      `<button type="button" class="dl-item" data-q="${q}">
        <span class="dl-label">${q}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 4v10"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>
      </button>`
    ).join('');
    panel.querySelectorAll('.dl-item').forEach(btn => {
      btn.addEventListener('click', () => {
        downloadQuality(quals[btn.dataset.q], btn);
      });
    });
  }
  if (toggle && drawerPanel) {
    toggle.onclick = (e) => {
      e.stopPropagation();
      const open = drawerPanel.hasAttribute('hidden');
      if (open) {
        drawerPanel.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        drawerPanel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    };
  }

  $$('.ep-btn').forEach(b => b.classList.toggle('active', b.dataset.ep === epKey));

  if (chosen && quals[chosen]) {
    $('#nowPlaying').innerHTML = `Now playing: <strong>Episode ${epKey}</strong> · ${chosen}`;
    loadVideo(quals[chosen], quals);
  } else {
    $('#nowPlaying').textContent = `Episode ${epKey}`;
  }
}


function loadVideo(url, allQuals) {
  if (!url) {
    console.warn('loadVideo: empty url');
    return;
  }
  console.log('loadVideo', url.slice(0, 80), 'q=', currentQuality);

  const placeholder = $('#playerPlaceholder');
  const video = $('#mainPlayer');
  const iframe = $('#abyssPlayer');
  const wrap = $('#playerWrap') || (video && video.closest('.player-wrap'));
  const banner = $('#dlOnlyBanner');
  const controls = $('#customControls');

  if (window._vCheckTimer) {
    clearInterval(window._vCheckTimer);
    window._vCheckTimer = null;
  }

  window._currentQuals = allQuals || window._currentQuals || {};
  window._triedQuals = window._triedQuals || new Set();
  window._triedQuals.add(currentQuality);

  // Non-streamable (Telegram, MediaFire, etc.)
  if (!isStreamableUrl(url)) {
    clearNativeVideo();
    clearAbyssIframe();
    if (controls) controls.style.display = 'none';
    if (placeholder) {
      placeholder.classList.remove('hidden');
      placeholder.style.pointerEvents = 'auto';
      placeholder.innerHTML = '<p>This video cannot be streamed in the browser.<br>Please use the <b>Download</b> button below.</p>';
    }
    if (banner) banner.hidden = false;
    if (wrap) wrap.classList.remove('mode-abyss', 'mode-native', 'playing');
    return;
  }

  if (banner) banner.hidden = true;

  // —— Abyss / Hydrax iframe path ——
  if (isAbyssUrl(url)) {
    clearNativeVideo();
    if (controls) controls.style.display = 'none';
    if (wrap) {
      wrap.classList.remove('mode-native', 'playing', 'show-controls');
      wrap.classList.add('mode-abyss');
    }
    if (placeholder) {
      placeholder.classList.remove('hidden');
      placeholder.style.pointerEvents = 'none';
      placeholder.innerHTML = '<p class="player-loading">Loading player…</p>';
    }
    if (iframe) {
      const embed = getAbyssEmbedUrl(url);
      iframe.onload = function () {
        if (placeholder) placeholder.classList.add('hidden');
      };
      iframe.onerror = function () {
        if (placeholder) {
          placeholder.classList.remove('hidden');
          placeholder.style.pointerEvents = 'auto';
          placeholder.innerHTML = '<p><b>Player failed to load</b><br>Try another quality or use <b>Download</b>.</p>';
        }
      };
      iframe.src = embed;
      iframe.hidden = false;
      iframe.classList.add('active');
    }
    return;
  }

  // —— Native HTML5 video path (Cloudflare Workers / direct media) ——
  clearAbyssIframe();
  if (!video) return;
  if (controls) controls.style.display = '';
  if (wrap) {
    wrap.classList.remove('mode-abyss');
    wrap.classList.add('mode-native');
  }

  video.onerror = null;
  video.removeAttribute('src');
  try { video.load(); } catch (_) {}

  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('controlslist', 'nodownload noplaybackrate');
  video.playsInline = true;
  video.controls = false;
  video.disablePictureInPicture = true;
  video.poster = (currentAnime && currentAnime.poster) || '';
  video.src = url;
  video.classList.add('active');

  if (placeholder) {
    placeholder.classList.add('hidden');
    placeholder.style.pointerEvents = 'none';
  }
  if (wrap) {
    wrap.classList.remove('playing');
    wrap.classList.add('show-controls');
  }

  try { setupCustomControls(); } catch (e) { console.warn('controls', e); }
  updatePlayBtn(false);

  function switchToFallback(reason) {
    const order = ['720p', '480p'];
    const tried = window._triedQuals;
    const next = order.find(q => window._currentQuals[q] && !tried.has(q));
    if (!next) {
      updatePlayBtn(false);
      if (placeholder) {
        placeholder.classList.remove('hidden');
        placeholder.style.pointerEvents = 'auto';
        placeholder.innerHTML = '<p><b>Playback failed</b><br>This quality may be blocked or unsupported on your device.<br>Try another quality button, or use <b>Download</b>.</p>';
      }
      if (banner) {
        banner.hidden = false;
        banner.innerHTML = 'Streaming failed for available qualities. Use <strong>Download</strong> instead.';
      }
      return;
    }
    currentQuality = next;
    tried.add(next);
    document.querySelectorAll('.quality-btn').forEach(b => {
      if (b.dataset.mode === 'stream') b.classList.toggle('active', b.dataset.q === next);
    });
    if ($('#nowPlaying')) {
      $('#nowPlaying').innerHTML = `Now playing: <strong>Episode ${currentEpisode}</strong> · ${next} <span style="color:#ffc107;font-size:0.85em">(auto)</span>`;
    }
    loadVideo(window._currentQuals[next], window._currentQuals);
  }

  video.onerror = function () {
    console.warn('video error', video.error && video.error.code, url.slice(0, 60));
    switchToFallback('error');
  };

  let checks = 0;
  window._vCheckTimer = setInterval(() => {
    checks++;
    if (!video.src) { clearInterval(window._vCheckTimer); return; }
    if (video.videoWidth > 0) {
      clearInterval(window._vCheckTimer);
      window._vCheckTimer = null;
      return;
    }
    if (checks >= 4 && video.currentTime > 0.4 && video.videoWidth === 0) {
      clearInterval(window._vCheckTimer);
      window._vCheckTimer = null;
      video.pause();
      switchToFallback('no frames');
    }
    if (checks > 16) {
      clearInterval(window._vCheckTimer);
      window._vCheckTimer = null;
    }
  }, 500);

  const tryPlay = () => {
    const p = video.play();
    if (p && p.catch) p.catch(() => { updatePlayBtn(false); wrap?.classList.remove('playing'); });
  };
  video.addEventListener('canplay', function onCan() {
    video.removeEventListener('canplay', onCan);
    tryPlay();
  }, { once: true });
  setTimeout(tryPlay, 800);
}

function formatTime(s) {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}

function updatePlayBtn(playing) {
  const btn = $('#playPauseBtn');
  if (btn) {
    const play = btn.querySelector('.svg-play');
    const pause = btn.querySelector('.svg-pause');
    if (play && pause) {
      play.hidden = !!playing;
      pause.hidden = !playing;
    } else {
      btn.innerHTML = playing
        ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>'
        : '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    }
  }
  const center = document.querySelector('.center-play');
  if (center) {
    center.innerHTML = '<span class="ico ico-play ico-lg"></span>';
    center.style.opacity = playing ? '0' : '1';
    center.style.pointerEvents = playing ? 'none' : 'auto';
  }
  const muteBtn = $('#muteBtn');
  const video = $('#mainPlayer');
  if (muteBtn && video) {
    {
      const vol = muteBtn.querySelector('.svg-vol');
      const mut = muteBtn.querySelector('.svg-mute');
      if (vol && mut) { vol.hidden = video.muted; mut.hidden = !video.muted; }
      else muteBtn.innerHTML = video.muted
        ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M5 10v4h3l4 4V6L8 10H5z"/></svg>'
        : '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M5 10v4h3l4 4V6L8 10H5zm11.5 2a3.5 3.5 0 0 0-1.8-3.1v6.2A3.5 3.5 0 0 0 16.5 12z"/></svg>';
    }
  }
  const wrap = document.querySelector('.player-wrap');
  if (wrap) {
    if (playing) wrap.classList.add('playing');
    else wrap.classList.remove('playing');
  }
}

let controlsTimer = null;
function showControlsTemp() {
  const wrap = document.querySelector('.player-wrap');
  if (!wrap) return;
  wrap.classList.add('show-controls');
  clearTimeout(controlsTimer);
  controlsTimer = setTimeout(() => {
    if (wrap.classList.contains('playing')) wrap.classList.remove('show-controls');
  }, 3500);
}


async function enterLandscapeFullscreen(wrap, video) {
  // Toggle off if already in forced FS
  if (wrap.classList.contains('force-landscape-fs')) {
    exitForcedLandscape(wrap);
    return;
  }
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (_) {}
    try { screen.orientation?.unlock?.(); } catch (_) {}
    exitForcedLandscape(wrap);
    return;
  }

  // 1) Try native fullscreen + orientation lock
  let nativeOk = false;
  try {
    if (wrap.requestFullscreen) {
      await wrap.requestFullscreen({ navigationUI: 'hide' }).catch(() => wrap.requestFullscreen());
      nativeOk = true;
    } else if (wrap.webkitRequestFullscreen) {
      wrap.webkitRequestFullscreen();
      nativeOk = true;
    }
  } catch (_) {}

  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch (_) {}

  // 2) Always apply CSS forced landscape as reliable fallback
  // (orientation.lock often blocked on Android)
  setTimeout(() => {
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    // If still portrait OR native FS failed → CSS rotate method
    if (isPortrait || !document.fullscreenElement) {
      // Exit native FS if it left us in portrait pillarbox
      if (document.fullscreenElement) {
        try { document.exitFullscreen(); } catch (_) {}
      }
      enterForcedLandscape(wrap);
    }
  }, 200);
}

function enterForcedLandscape(wrap) {
  wrap.classList.add('force-landscape-fs');
  document.body.classList.add('fs-lock-scroll');
  // Store original parent placement
  if (!wrap.dataset.fsActive) wrap.dataset.fsActive = '1';

  // Update FS button icon if present
  const fsBtn = document.getElementById('fsBtn');
  if (fsBtn) fsBtn.innerHTML = '<span class="ico ico-close"></span>';

  // Back button / escape to exit
  const onKey = (e) => {
    if (e.key === 'Escape') exitForcedLandscape(wrap);
  };
  document.addEventListener('keydown', onKey);
  wrap._fsKeyHandler = onKey;

  // Tap X area: long-press or use fs button again
  showControlsTemp();
}

function exitForcedLandscape(wrap) {
  if (!wrap) wrap = document.querySelector('.player-wrap');
  if (!wrap) return;
  wrap.classList.remove('force-landscape-fs');
  document.body.classList.remove('fs-lock-scroll');
  delete wrap.dataset.fsActive;
  const fsBtn = document.getElementById('fsBtn');
  if (fsBtn) fsBtn.innerHTML = '<span class="ico ico-expand"></span>';
  if (wrap._fsKeyHandler) {
    document.removeEventListener('keydown', wrap._fsKeyHandler);
    delete wrap._fsKeyHandler;
  }
  try { screen.orientation?.unlock?.(); } catch (_) {}
}

/**
 * Client-side player protections (casual deterrence only).
 * Does not claim DRM, download prevention, or resistance to DevTools.
 */
function setupPlayerProtection() {
  const wrap = $('#playerWrap') || document.querySelector('.player-wrap');
  if (!wrap || wrap.dataset.protectReady === '1') return;
  wrap.dataset.protectReady = '1';

  // Disable context menu on player container (not whole page)
  wrap.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Discourage text selection / drag of player chrome
  wrap.addEventListener('selectstart', (e) => {
    if (!e.target.closest('input, textarea')) e.preventDefault();
  });
  wrap.addEventListener('dragstart', (e) => e.preventDefault());

  // Native video: block right-click on the media element itself
  const video = $('#mainPlayer');
  if (video) {
    video.addEventListener('contextmenu', (e) => e.preventDefault());
    video.setAttribute('controlslist', 'nodownload noplaybackrate');
    try { video.disablePictureInPicture = true; } catch (_) {}
  }

  // Abyss iframe is cross-origin — cannot touch its DOM; protections are outer-only
}

function setupCustomControls() {
  const video = $('#mainPlayer');
  if (!video) return;
  const wrap = video.closest('.player-wrap');
  if (!wrap) return;
  if (wrap.dataset.ccReady === '1') return;
  wrap.dataset.ccReady = '1';

  let centerBtn = wrap.querySelector('.center-play');
  if (!centerBtn) {
    centerBtn = document.createElement('button');
    centerBtn.className = 'center-play';
    centerBtn.type = 'button';
    centerBtn.setAttribute('aria-label', 'Play');
    centerBtn.innerHTML = '<span class="ico ico-play ico-lg"></span>';
    wrap.appendChild(centerBtn);
  }

  if (wrap.dataset.ccReady === '1') {
    updatePlayBtn(!video.paused && !video.ended);
    return;
  }
  wrap.dataset.ccReady = '1';

  function togglePlay() {
    if (video.paused || video.ended) {
      video.play().then(() => {
        updatePlayBtn(true);
        showControlsTemp();
      }).catch(() => updatePlayBtn(false));
    } else {
      video.pause();
      updatePlayBtn(false);
      wrap.classList.add('show-controls');
    }
  }

  centerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePlay();
  });

  const playBtn = $('#playPauseBtn');
  const muteBtn = $('#muteBtn');
  const fsBtn = $('#fsBtn');
  const progressWrap = $('#progressWrap');
  const progressFill = $('#progressFill');
  const progressHandle = $('#progressHandle');
  const timeEl = $('#ccTime');

  playBtn?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); togglePlay(); });
  muteBtn?.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    video.muted = !video.muted;
    const vol = muteBtn.querySelector('.svg-vol');
    const mut = muteBtn.querySelector('.svg-mute');
    if (vol && mut) { vol.hidden = video.muted; mut.hidden = !video.muted; }
    else muteBtn.innerHTML = video.muted
      ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M5 10v4h3l4 4V6L8 10H5z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M5 10v4h3l4 4V6L8 10H5zm11.5 2a3.5 3.5 0 0 0-1.8-3.1v6.2A3.5 3.5 0 0 0 16.5 12z"/></svg>';
    showControlsTemp();
  });
  fsBtn?.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    enterLandscapeFullscreen(wrap, video);
    showControlsTemp();
  });

  progressWrap?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!video.duration) return;
    const rect = progressWrap.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * video.duration;
    showControlsTemp();
  });

  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressHandle) progressHandle.style.left = pct + '%';
    if (timeEl) timeEl.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
  });
  video.addEventListener('loadedmetadata', () => {
    if (timeEl) timeEl.textContent = '0:00 / ' + formatTime(video.duration);
  });
  video.addEventListener('play', () => updatePlayBtn(true));
  video.addEventListener('playing', () => updatePlayBtn(true));
  video.addEventListener('pause', () => { updatePlayBtn(false); wrap.classList.add('show-controls'); });
  video.addEventListener('ended', () => { updatePlayBtn(false); wrap.classList.add('show-controls'); });

  wrap.addEventListener('click', (e) => {
    if (e.target.closest('.custom-controls') || e.target.closest('.center-play')) return;
    if (video.paused) togglePlay();
    else showControlsTemp();
  });
}


function renderCategoryGrid(cat) {
  const id = cat === 'movies' ? 'moviesGrid' : 'seriesGrid';
  const grid = document.getElementById(id);
  if (!grid) return;
  let list = ANIMES.filter(a => {
    if (cat === 'movies') return a.ui_category === 'movies' || a.type === 'Movie';
    return a.ui_category === 'anime' || a.category === 'anime';
  });
  grid.innerHTML = list.map(a => posterCardHTML(a)).join('');
  bindPosterClicks(grid);
}

function renderTrendingGrid() {
  const grid = document.getElementById('trendingGrid');
  if (!grid) return;
  let list = ANIMES.filter(a => a.trending);
  if (!list.length) {
    list = [...ANIMES].filter(a => parseFloat(a.rating) > 0)
      .sort((a,b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 40);
  }
  grid.innerHTML = list.map(a => posterCardHTML(a)).join('');
  bindPosterClicks(grid);
  document.title = 'Trending — Aniclux';
}

function renderWatchlist() {
  const grid = $('#watchlistGrid');
  const empty = $('#watchlistEmpty');
  if (!grid) return;
  let ids = [];
  try { ids = JSON.parse(localStorage.getItem('aniclux-watchlist') || '[]'); } catch (_) {}
  const list = ids.map(id => ANIMES.find(a => String(a.id) === String(id))).filter(Boolean);
  grid.innerHTML = list.map(a => posterCardHTML(a)).join('');
  bindPosterClicks(grid);
  if (empty) empty.style.display = list.length ? 'none' : 'block';
}

function toggleWatchlist(id) {
  let ids = [];
  try { ids = JSON.parse(localStorage.getItem('aniclux-watchlist') || '[]'); } catch (_) {}
  const i = ids.indexOf(id);
  if (i >= 0) ids.splice(i, 1);
  else ids.push(id);
  localStorage.setItem('aniclux-watchlist', JSON.stringify(ids));
  return ids.includes(id);
}

function isInWatchlist(id) {
  try {
    return JSON.parse(localStorage.getItem('aniclux-watchlist') || '[]').includes(id);
  } catch (_) { return false; }
}

let searchPageReady = false;
function setupSearchPage() {
  const input = $('#searchPageInput');
  const results = $('#searchPageResults');
  const empty = $('#searchEmpty');
  const status = $('#searchStatus');
  const form = $('#searchForm');
  if (!input || !results) return;
  document.title = 'Search — Aniclux';

  // Read ?s= from URL (hindianimestuff style)
  const params = new URLSearchParams(location.search);
  const qs = params.get('s') || params.get('q') || '';
  if (qs && !input.value) input.value = qs.replace(/\+/g, ' ');

  const run = (updateUrl) => {
    const q = input.value.trim();
    const qLower = q.toLowerCase();
    const filter = document.querySelector('.sf-chip.active')?.dataset.filter || 'all';
    if (updateUrl) {
      const url = q ? ('/search?s=' + encodeURIComponent(q).replace(/%20/g, '+')) : '/search';
      if (location.pathname + location.search !== url) {
        history.replaceState(null, '', url);
      }
    }
    if (qLower.length < 1) {
      results.innerHTML = '';
      if (status) status.textContent = '';
      if (empty) {
        empty.style.display = 'block';
        empty.textContent = 'Type a title — example: /search?s=demon+slayer';
      }
      return;
    }
    // multi-word: all tokens must match title/genres
    const tokens = qLower.split(/[\s+]+/).filter(Boolean);
    let matches = ANIMES.filter(a => {
      const hay = [
        a.title || '',
        a.season || '',
        (a.genres || []).join(' '),
        (a.languages || []).join(' ')
      ].join(' ').toLowerCase();
      return tokens.every(t => hay.includes(t));
    });
    if (filter === 'anime') matches = matches.filter(a => a.ui_category !== 'movies' && a.type !== 'Movie');
    if (filter === 'movies') matches = matches.filter(a => a.ui_category === 'movies' || a.type === 'Movie');
    matches = matches.slice(0, 100);
    if (status) status.textContent = matches.length + ' result' + (matches.length === 1 ? '' : 's') + ' for “' + q + '”';
    if (empty) empty.style.display = matches.length ? 'none' : 'block';
    if (!matches.length && empty) empty.textContent = 'No results for “' + q + '”';
    results.innerHTML = matches.map(a => {
      const rating = a.rating && a.rating !== '?' ? a.rating : '';
      const meta = [a.type || a.ui_category, a.season, rating ? ('★ ' + rating) : ''].filter(Boolean).join(' · ');
      return `<article class="sr-row" data-id="${a.id}">
        <img class="sr-poster" src="${a.poster || ''}" alt="" loading="lazy" onerror="this.style.opacity=0.3"/>
        <div class="sr-info">
          <h3 class="sr-title">${escapeHtml(a.title)}</h3>
          <p class="sr-meta">${escapeHtml(meta)}</p>
          <p class="sr-genres">${escapeHtml((a.genres || []).slice(0,4).join(', '))}</p>
        </div>
        <span class="sr-go">→</span>
      </article>`;
    }).join('');
    results.querySelectorAll('.sr-row').forEach(row => {
      row.addEventListener('click', () => {
        const anime = ANIMES.find(a => String(a.id) === String(row.dataset.id));
        if (anime) navigate(animePath(anime));
      });
    });
  };

  if (!input.dataset.bound) {
    input.dataset.bound = '1';
    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => run(true), 180); });
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        run(true);
      });
    }
    document.querySelectorAll('.sf-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.sf-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        run(false);
      });
    });
  }
  run(false);
  setTimeout(() => input.focus(), 150);
}



function renderGenrePage(genre) {
  showPage('genre');
  const title = $('#genreTitle');
  if (title) title.textContent = genre;
  document.title = genre + ' — Aniclux';
  const grid = $('#genreGrid');
  if (!grid) return;
  const list = ANIMES.filter(a => (a.genres || []).some(g => String(g).toLowerCase() === genre.toLowerCase()));
  grid.innerHTML = list.map(a => posterCardHTML(a)).join('') || '<p class="empty-hint">No titles in this genre.</p>';
  bindPosterClicks(grid);
}

function setupComments(animeId) {
  const list = $('#commentList');
  const form = $('#commentForm');
  if (!list || !form) return;
  const key = 'aniclux-comments-' + animeId;
  const load = () => {
    let items = [];
    try { items = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
    list.innerHTML = items.map(c => `
      <div class="comment-item">
        <span class="c-name">${escapeHtml(c.name)}</span>
        <span class="c-time">${escapeHtml(c.time || '')}</span>
        <p class="c-body">${escapeHtml(c.msg)}</p>
      </div>`).join('') || '<p class="empty-hint">No comments yet. Be the first!</p>';
  };
  load();
  if (!form.dataset.bound) {
    form.dataset.bound = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = ($('#cName')?.value || '').trim() || 'Anon';
      const msg = ($('#cMsg')?.value || '').trim();
      if (!msg) return;
      let items = [];
      try { items = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
      items.unshift({ name, msg, time: new Date().toLocaleString() });
      localStorage.setItem(key, JSON.stringify(items.slice(0, 50)));
      // Optional EmailJS hook (set window.EMAILJS_CONFIG if you have keys)
      try {
        if (window.emailjs && window.EMAILJS_CONFIG) {
          emailjs.send(window.EMAILJS_CONFIG.service, window.EMAILJS_CONFIG.template, {
            from_name: name, message: msg, anime_id: animeId, page: location.href
          });
        }
      } catch (_) {}
      form.reset();
      load();
    });
  }
}

function setupReportForm() {
  document.title = 'Report — Aniclux';
  const form = $('#reportForm');
  const note = $('#reportNote');
  if (!form || form.dataset.bound) return;
  form.dataset.bound = '1';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#rTitle')?.value || '';
    const email = $('#rEmail')?.value || '';
    const msg = $('#rMsg')?.value || '';
    const body = encodeURIComponent(`Title: ${title}\nEmail: ${email}\n\n${msg}`);
    // Prefer EmailJS if configured; else mailto
    try {
      if (window.emailjs && window.EMAILJS_CONFIG) {
        emailjs.send(window.EMAILJS_CONFIG.service, window.EMAILJS_CONFIG.template, {
          from_name: email || 'Guest', message: `REPORT: ${title}\n${msg}`, page: location.href
        }).then(() => { if (note) note.textContent = 'Report sent. Thank you!'; });
        return;
      }
    } catch (_) {}
    window.location.href = 'mailto:report@aniclux.app?subject=' + encodeURIComponent('Broken link: ' + title) + '&body=' + body;
    if (note) note.textContent = 'Opening email app…';
  });
}

function setupTheme() {
  const btn = $('#themeBtn');
  if (!btn) return;
  const moon = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/></svg>';
  const sun = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const apply = () => {
    const isLight = document.body.classList.contains('light');
    btn.innerHTML = isLight ? sun : moon;
  };
  if (localStorage.getItem('aniclux-theme') === 'light') document.body.classList.add('light');
  apply();
  btn.onclick = () => {
    document.body.classList.toggle('light');
    localStorage.setItem('aniclux-theme', document.body.classList.contains('light') ? 'light' : 'dark');
    apply();
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


// ===== UI WIDGETS: GhostFibers, Share, BackTop, PulseHeart =====

function setupSideMenu() {
  const menu = $('#sideMenu');
  const overlay = $('#menuOverlay');
  const openers = [$('#openMenuBtn'), $('#menuTabBtn')].filter(Boolean);
  const closer = $('#closeMenuBtn');
  if (!menu) return;
  const open = () => {
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    if (overlay) { overlay.hidden = false; overlay.classList.add('show'); }
  };
  const close = () => {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    if (overlay) { overlay.hidden = true; overlay.classList.remove('show'); }
  };
  openers.forEach(b => b.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    menu.classList.contains('open') ? close() : open();
  }));
  closer?.addEventListener('click', (e) => { e.preventDefault(); close(); });
  overlay?.addEventListener('click', close);
  menu.querySelectorAll('a[data-page]').forEach(a => a.addEventListener('click', close));

  // Genre chips in menu
  const wrap = $('#menuGenres');
  if (wrap && !wrap.dataset.ready) {
    wrap.dataset.ready = '1';
    const set = new Set();
    ANIMES.forEach(a => (a.genres || []).forEach(g => set.add(g)));
    const list = [...set].sort().slice(0, 24);
    wrap.innerHTML = list.map(g => `<button type="button" data-genre="${escapeHtml(g)}">${escapeHtml(g)}</button>`).join('');
    wrap.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        close();
        navigate('/genre/' + encodeURIComponent(btn.dataset.genre));
      });
    });
  }
}


function setupBackTop() {
  const btn = $('#backTopBtn');
  if (!btn) return;
  const onScroll = () => btn.classList.toggle('show', window.scrollY > 400);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function setupShare() {
  const fab = $('#shareFab');
  const btn = $('#shareBtn');
  if (!fab || !btn) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    fab.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!fab.contains(e.target)) fab.classList.remove('open');
  });
  const url = () => location.href;
  const title = () => document.title;
  const tw = $('#shareTwitter');
  const fb = $('#shareFacebook');
  const wa = $('#shareWhatsapp');
  const cp = $('#shareCopy');
  if (tw) tw.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url())}&text=${encodeURIComponent(title())}`, '_blank');
  });
  if (fb) fb.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`, '_blank');
  });
  if (wa) wa.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(`https://wa.me/?text=${encodeURIComponent(title() + ' ' + url())}`, '_blank');
  });
  if (cp) cp.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url());
      cp.title = 'Copied!';
      setTimeout(() => { cp.title = 'Copy link'; }, 1500);
    } catch (_) {
      prompt('Copy link:', url());
    }
  });
}

function setupPulseHeart() {
  // called from showDetail with anime id
}

function bindPulseHeart(animeId) {
  const btn = $('#pulseHeart');
  const countEl = $('#pulseCount');
  if (!btn || !countEl) return;
  const key = 'aniclux-like-' + animeId;
  const countKey = 'aniclux-like-count-' + animeId;
  let liked = localStorage.getItem(key) === '1';
  let count = parseInt(localStorage.getItem(countKey) || '0', 10);
  if (!count) count = 800 + (String(animeId).length * 37) % 900;
  const paint = () => {
    btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
    countEl.textContent = count.toLocaleString();
  };
  paint();
  btn.onclick = () => {
    liked = !liked;
    count += liked ? 1 : -1;
    if (count < 0) count = 0;
    localStorage.setItem(key, liked ? '1' : '0');
    localStorage.setItem(countKey, String(count));
    paint();
  };
}

function setupGhostFibers() {
  const canvas = $('#ghostFibers');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = 0, t = 0;
  const threads = 56;
  const mouse = { x: 0.5, y: 0.5 };

  function resize() {
    const parent = canvas.parentElement;
    w = parent.clientWidth;
    h = parent.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    t += 0.008 * 0.5; // speed
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5 + (mouse.x - 0.5) * 40;
    const cy = h * 0.55 + (mouse.y - 0.5) * 30;

    for (let i = 0; i < threads; i++) {
      const p = i / threads;
      const hueTwist = p * 1.2 + t * 0.4;
      const amp = (0.15 + p * 0.35) * h * 0.35;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const nx = x / w;
        const y = cy
          + Math.sin(nx * Math.PI * 2 * (1 + p) + t * 2 + hueTwist) * amp * 0.45
          + Math.sin(nx * 6 + t + i * 0.15) * amp * 0.2
          + (p - 0.5) * 40;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const alpha = 0.08 + (1 - Math.abs(p - 0.5) * 1.5) * 0.25;
      const r = 140 + p * 40;
      const g = 90 + p * 30;
      const b = 220 + p * 20;
      ctx.strokeStyle = `rgba(${r|0},${g|0},${b|0},${Math.max(0.04, alpha)})`;
      ctx.lineWidth = 1 + (1 - p) * 1.4;
      ctx.stroke();

      // dots along fiber
      if (i % 3 === 0) {
        for (let d = 0; d < 6; d++) {
          const nx = (d / 6 + t * 0.05 + p) % 1;
          const x = nx * w;
          const y = cy
            + Math.sin(nx * Math.PI * 2 * (1 + p) + t * 2 + hueTwist) * amp * 0.45
            + Math.sin(nx * 6 + t + i * 0.15) * amp * 0.2
            + (p - 0.5) * 40;
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(223,209,252,${0.15 + alpha})`;
          ctx.fill();
        }
      }
    }
    // soft glow center
    const grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, h * 0.5);
    grd.addColorStop(0, 'rgba(139,92,246,0.12)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    raf = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  const hero = $('#hero');
  if (hero) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
    });
  }
  draw();
}


document.addEventListener('DOMContentLoaded', init);
