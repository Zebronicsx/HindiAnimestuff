import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";

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