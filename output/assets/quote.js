// Quote-of-the-day widget — homepage only.
// Uses the free, no-auth AnimeChan API (api.animechan.io) from
// https://github.com/public-apis/public-apis. Cached in sessionStorage so
// we only call it once per visit (the free tier is rate-limited), and we
// always have a few hand-picked fallback quotes ready in case the API is
// down, slow, or the visitor is offline.
(function () {
  var el = document.getElementById("quoteWidget");
  if (!el) return;

  var FALLBACKS = [
    { content: "A person grows up when he's able to overcome hardships. Protection is important, but there are some things that a person must learn on their own.", anime: "Naruto", character: "Jiraiya" },
    { content: "If you don't take risks, you can't create a future.", anime: "One Piece", character: "Monkey D. Luffy" },
    { content: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", anime: "Kino's Journey", character: "Kino" },
    { content: "Fear is not evil. It tells you what your weakness is.", anime: "Fairy Tail", character: "Gildarts Clive" }
  ];

  function render(q) {
    el.innerHTML =
      '<div class="quote-mark">&#8220;</div>' +
      '<p class="quote-text">' + q.content + '</p>' +
      '<p class="quote-src">&mdash; ' + q.character + (q.anime ? ', <em>' + q.anime + '</em>' : '') + '</p>';
  }

  function pickFallback() {
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }

  var cached = sessionStorage.getItem("haQuoteOfDay");
  if (cached) {
    try { render(JSON.parse(cached)); return; } catch (e) { /* fall through to fetch */ }
  }

  fetch("https://api.animechan.io/v1/quotes/random")
    .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function (json) {
      var d = json && (json.data || json);
      if (!d || !d.content) throw new Error("unexpected shape");
      var q = {
        content: d.content,
        anime: d.anime && d.anime.name,
        character: d.character && d.character.name
      };
      sessionStorage.setItem("haQuoteOfDay", JSON.stringify(q));
      render(q);
    })
    .catch(function () {
      render(pickFallback());
    });
})();
