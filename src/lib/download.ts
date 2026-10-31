/**
 * Download helpers.
 *
 * The site never renders or copies a raw file URL. Files are requested through a
 * hidden, sandboxed iframe: the host answers with `Content-Disposition: attachment`,
 * so the browser starts the download while the page stays exactly where it is.
 */

export function notify(message: string) {
  window.dispatchEvent(new CustomEvent("af-toast", { detail: message }));
}

/** true when the URL is a raw media file the host serves as an attachment */
export function isDirectFileUrl(url: string) {
  const decoded = decodeURIComponent(url);
  return /\.(mkv|mp4|avi|webm|m4v)(\?|&|$)/i.test(decoded) || /workers\.dev\//.test(url);
}

function fileIframe(url: string): HTMLIFrameElement {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("tabindex", "-1");
  frame.style.cssText = "position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none;left:-9999px;";
  frame.src = url;
  document.body.appendChild(frame);
  // attachment downloads start immediately; the frame is only a transport
  window.setTimeout(() => frame.remove(), 60000);
  return frame;
}

function pageIframe(url: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("tabindex", "-1");
  frame.style.cssText = "position:fixed;width:1px;height:1px;border:0;opacity:0;pointer-events:none;left:-10px;top:-10px;";
  frame.src = url;
  document.body.appendChild(frame);
  window.setTimeout(() => frame.remove(), 20000);
}

/** starts a download without navigating, opening a tab or exposing the link */
export function triggerDownload(url: string, label?: string) {
  if (!url) return;
  notify(label ? `Preparing ${label} — download starting…` : "Preparing your download…");

  if (isDirectFileUrl(url)) {
    fileIframe(url);
  } else {
    // host landing page (filesdl / hubcloud / etc.)
    pageIframe(url);
  }

  window.setTimeout(() => {
    notify("If the file did not start, disable your download blocker and tap again.");
  }, 900);
}

/** Android can hand the stream to VLC / MX Player without showing the URL */
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
