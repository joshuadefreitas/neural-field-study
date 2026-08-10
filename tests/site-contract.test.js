// Hand-authored public-study experience contracts.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const html = readFileSync(path.join(root, "index.html"), "utf8");
const css = readFileSync(path.join(root, "styles.css"), "utf8");
const app = readFileSync(path.join(root, "src/app.js"), "utf8");

test("the page follows the reusable orient, explore, inspect study structure", () => {
  for (const layer of ["orient", "explore", "inspect"]) {
    assert.match(html, new RegExp(`data-study-layer="${layer}"`));
  }
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((html.match(/class="idea-step"/g) || []).length, 3);
  assert.match(html, /The idea in one minute/);
  assert.match(html, /What the audit found/);
  assert.match(html, /What this does not show/);
  assert.match(html, /<details class="technical-record">/);
  assert.match(html, /Back to portfolio/);
});

test("plain-language copy explains the mechanism before using specialist terms", () => {
  assert.match(html, /An active cell encourages the cells nearest to it/);
  assert.match(html, /suppresses activity across a wider area/);
  assert.match(html, /not a brain simulation/i);
  assert.match(html, /The label agreed; the picture did not/);
  assert.match(html, /same seed always returns the same starting field/);
});

test("the shared visual language is local, neutral and theme-aware", () => {
  for (const font of [
    "assets/fonts/newsreader-display-300.woff2",
    "assets/fonts/newsreader-text-300.woff2",
    "assets/fonts/inter-latin.woff2",
    "assets/fonts/dm-mono-latin.woff2"
  ]) assert.ok(existsSync(path.join(root, font)), `missing ${font}`);
  for (const license of ["OFL-Newsreader.txt", "OFL-Inter.txt", "OFL-DM-Mono.txt"]) {
    assert.ok(existsSync(path.join(root, "assets/fonts", license)), `missing assets/fonts/${license}`);
  }

  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /localStorage\.getItem\("theme"\)/);
  assert.match(css, /--paper: #[0-9a-f]{6}/i);
  assert.match(css, /--line-2: #[0-9a-f]{6}/i);
  assert.match(css, /font-family: var\(--serif-display\)/);
  assert.doesNotMatch(css, /--orange:|--teal:/);
  assert.doesNotMatch(html, /<(?:img|script)\b[^>]*src="https?:/i);
  assert.doesNotMatch(html, /<link\b[^>]*(?:stylesheet|preload)[^>]*href="https?:/i);
});

test("the live experiment retains its established interaction contract", () => {
  for (const id of ["field", "toggle", "step", "reset", "intervention", "mass", "mean", "peak", "live-status"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /aria-label="Neural activity field visualization"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  const renderBody = app.match(/function render\(\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.doesNotMatch(renderBody, /live-status/, "render must not flood the live region on every frame");
  assert.match(app, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(app, /if \(!reduceMotion\.matches\) requestAnimationFrame\(frame\)/);
});

test("the future-study template records the same public contract", () => {
  const templatePath = path.join(root, "docs/STUDY-PAGE-TEMPLATE.md");
  const decisionPath = path.join(root, "docs/decisions/0002-shared-study-page-system.md");
  assert.ok(existsSync(templatePath), "missing reusable study-page template");
  assert.ok(existsSync(decisionPath), "missing study-page design decision");
  const template = readFileSync(templatePath, "utf8");
  assert.match(template, /Orient → Explore → Inspect/);
  assert.match(template, /Question before machinery/i);
  assert.match(template, /One finding, one limit/i);
  assert.match(template, /Copy test/i);
  assert.equal((template.match(/^### \d\. /gm) || []).length, 3, "template should expose exactly three governing stages");
  assert.match(template, /licen[cs]e texts/i);
});
