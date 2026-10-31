import { copyFileSync, existsSync } from "node:fs";

const source = "index.source.html";
const target = "index.html";

if (!existsSync(source)) {
  throw new Error(`Missing ${source}; cannot prepare the Vite entry page.`);
}

copyFileSync(source, target);
console.log(`Vite source entry restored: ${source} -> ${target}`);
