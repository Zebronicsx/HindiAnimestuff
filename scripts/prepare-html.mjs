import { readFileSync, writeFileSync } from "node:fs";

/**
 * Build the Vite development entry (index.html) from index.template.html.
 *
 * The oni crest icons are inlined as base64 so the launch splash, favicon and
 * app icon render instantly with zero extra network requests.
 */
const template = readFileSync("index.template.html", "utf8");

const icon512 = readFileSync("public/icon-512.png");
const icon64 = readFileSync("public/favicon-64.png");

const favicon =
  "data:image/png;base64," + icon64.toString("base64");
const iconUri =
  "data:image/png;base64," + icon512.toString("base64");

const html = template
  .replace(/__FAVICON__/g, favicon)
  .replace(/__ICON512__/g, iconUri);

writeFileSync("index.html", html);
console.log("Vite entry generated: index.html (inline oni icon + splash)");
