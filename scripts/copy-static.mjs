import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname } from "node:path";

const source = "dist/index.html";
const target = "deploy/index.html";
const rootTarget = "index.html";

if (!existsSync(source)) {
  throw new Error(`Missing ${source}; Vite must finish before the postbuild step.`);
}

mkdirSync("deploy", { recursive: true });
copyFileSync(source, target);
copyFileSync(source, rootTarget);

const mb = (statSync(target).size / 1024 / 1024).toFixed(2);
console.log(`Static upload ready: ${target} (${mb} MB)`);
console.log(`Simple HTML ready: ${rootTarget} (compiled self-contained copy)`);

// PWA files used by "Install app": keep them next to the uploadable index.html
const pwaFiles = [
  "site.webmanifest",
  "icons/icon-192.jpg",
  "icons/icon-512.jpg",
  "icons/maskable-512.jpg",
  "icons/apple-touch-icon.jpg",
  "icons/favicon-96.png",
];
for (const file of pwaFiles) {
  const from = `dist/${file}`;
  if (!existsSync(from)) continue;
  const to = `deploy/${file}`;
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}
console.log("PWA assets copied to deploy/ (site.webmanifest + icons)");