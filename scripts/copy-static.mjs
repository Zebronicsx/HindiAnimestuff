import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

/**
 * Post-build packaging.
 *
 * 1. dist/index.html  — Vite output (single self-contained file)
 * 2. deploy/index.html + deploy assets — drag-and-drop upload folder
 * 3. index.html       — compiled site at the project root, so hosting the
 *                       root file also works like plain HTML
 * 4. index.source.html is restored by predev / prebuild for development
 */

const source = "dist/index.html";
const target = "deploy/index.html";
const rootTarget = "index.html";

if (!existsSync(source)) {
  throw new Error(`Missing ${source}; Vite must finish before the postbuild step.`);
}

// brand assets for the upload folder / PWA icons
for (const asset of [
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
  "manifest.webmanifest",
]) {
  const from = `public/${asset}`;
  if (existsSync(from)) {
    mkdirSync("deploy", { recursive: true });
    copyFileSync(from, `deploy/${asset}`);
  }
}

copyFileSync(source, target);
copyFileSync(source, rootTarget);

const mb = (p) => (statSync(p).size / 1024 / 1024).toFixed(2);
console.log(`Static upload ready: ${target} (${mb(target)} MB)`);
console.log(`Simple HTML ready:   ${rootTarget} (${mb(rootTarget)} MB)`);
