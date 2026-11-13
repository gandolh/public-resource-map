// Contrast over the built tokens: reads the two raw blocks of ui/app/app.css and checks every text and
// icon pair in both themes (4.5:1 for text, 3:1 for icons, control edges and the focus ring).
// Run it with `node scripts/check-contrast.mjs`; it exits 1 when a pair falls short.
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../ui/app/app.css", import.meta.url), "utf8");

function block(selector) {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf("\n}", start);
  const tokens = {};
  for (const [, name, value] of css.slice(start, end).matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens[name] = value.trim();
  return tokens;
}

const themes = { light: { ...block(":root") }, dark: { ...block(':root[data-theme="dark"]') } };
themes.dark = { ...themes.light, ...themes.dark };

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const mix = (a, b, share) => a.map((c, i) => Math.round(c * share + b[i] * (1 - share)));

const cats = Object.keys(themes.light).filter((k) => k.startsWith("cat-"));
const failures = [];
const report = [];

for (const [theme, t] of Object.entries(themes)) {
  const c = (name) => rgb(t[name]);
  const pairs = [];
  const text = (label, fg, bg) => pairs.push({ label, fg, bg, min: 4.5 });
  const ui = (label, fg, bg) => pairs.push({ label, fg, bg, min: 3 });

  // surface-3 is a hover and pressed fill: no faint text sits on it.
  for (const bg of ["surface", "surface-2", "bg"]) {
    text(`fg on ${bg}`, c("fg"), c(bg));
    text(`fg-muted on ${bg}`, c("fg-muted"), c(bg));
    text(`fg-faint on ${bg}`, c("fg-faint"), c(bg));
  }
  text("fg-on-accent on accent", c("fg-on-accent"), c("accent"));
  text("fg-on-accent on accent-hover", c("fg-on-accent"), c("accent-hover"));
  text("accent on surface", c("accent"), c("surface"));
  text("accent on accent-weak", c("accent"), c("accent-weak"));
  text("fg on accent-weak", c("fg"), c("accent-weak"));
  text("danger on surface", c("danger"), c("surface"));
  text("danger on danger-weak", c("danger"), c("danger-weak"));
  text("ok on surface", c("ok"), c("surface"));
  text("fg on surface-3", c("fg"), c("surface-3"));
  text("fg-muted on surface-3", c("fg-muted"), c("surface-3"));
  text("fg-on-danger on danger", c("fg-on-danger"), c("danger"));
  ui("outline on surface", c("outline"), c("surface"));
  ui("outline on bg", c("outline"), c("bg"));
  ui("focus ring (accent) on surface", c("accent"), c("surface"));
  ui("focus ring (accent) on bg", c("accent"), c("bg"));

  const mixShare = parseFloat(t["head-mix"]) / 100;
  for (const cat of cats) {
    const hue = c(cat);
    const head = mix(hue, c("surface"), mixShare);
    ui(`${cat} glyph on surface`, hue, c("surface"));
    ui(`${cat} glyph on tinted head`, hue, head);
    text(`${cat} label on surface`, hue, c("surface"));
    text(`fg on ${cat} tinted head`, c("fg"), head);
    text(`fg-muted on ${cat} tinted head`, c("fg-muted"), head);
    ui(`pin glyph on ${cat} pin`, c("pin-ico"), hue);
    ui(`outline on ${cat} tinted head`, c("outline"), head);
  }

  let minText = Infinity;
  let minUi = Infinity;
  for (const p of pairs) {
    const r = ratio(p.fg, p.bg);
    if (p.min === 4.5) minText = Math.min(minText, r);
    else minUi = Math.min(minUi, r);
    if (r < p.min) failures.push(`${theme}: ${p.label} ${r.toFixed(2)} < ${p.min}`);
  }
  report.push(
    `${theme}: ${pairs.length} pairs, text min ${minText.toFixed(2)}, icons and edges min ${minUi.toFixed(2)}`,
  );
}

console.log(report.join("\n"));
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
