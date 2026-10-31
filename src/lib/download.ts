/**
 * Download + share helpers.
 *
 * Why this exists: the file host sends `Content-Disposition: attachment`, so a
 * plain navigation downloads the file. Opening in a new tab (`target=_blank`)
 * gets blocked inside sandboxed previews / popup blockers — that's why the old
 * download buttons looked dead. A same-tab programmatic anchor click always fires.
 */

export function notify(message: string) {
  window.dispatchEvent(new CustomEvent("af-toast", { detail: message }));
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** true when the URL is a raw media file the host serves as an attachment */
export function isDirectFileUrl(url: string) {
  const decoded = decodeURIComponent(url);
  return /\.(mkv|mp4|avi|webm|m4v)(\?|&|$)/i.test(decoded) || /workers\.dev\//.test(url);
}

export async function triggerDownload(url: string, label?: string) {
  if (!url) return;

  // Wrapper hosts (filesdl / hubcloud) are download pages, not files.
  // Open those in a tab so the app is not navigated away inside a preview frame.
  if (!isDirectFileUrl(url)) {
    notify("Opening the download page…");
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      notify("Popup blocked — use “Open direct link” instead.");
    }
    return;
  }

  notify(label ? `Starting download — ${label}` : "Starting download…");
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    await wait(700);
    a.remove();
    notify("Download started. If nothing happened, use “Open direct link”.");
  } catch {
    window.location.href = url;
  }
}

export async function copyLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    notify("Direct link copied to clipboard.");
  } catch {
    notify("Copy failed — long-press the link to copy it.");
  }
}

/** Android can hand the direct URL to VLC / MX Player through an intent */
export function openInVlc(url: string) {
  const u = new URL(url);
  const intent =
    `intent://${u.host}${u.pathname}${u.search}` +
    `#Intent;scheme=${u.protocol.replace(":", "")};type=video/x-matroska;` +
    `package=org.videolan.vlc;S.title=AnimesFreak;end`;
  window.location.href = intent;
  notify("Opening VLC… install VLC if it is not available.");
}

export const isAndroid = () =>
  typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
