import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(path, "utf8");
const cardPath = "client/src/components/class/class-card.tsx";
const classesPath = "client/src/pages/classes.tsx";

function elements(path, content = read(path)) {
  const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert.equal(source.parseDiagnostics.length, 0, `${path} must parse`);
  const result = [];
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      result.push({
        tag: node.tagName.getText(source),
        attrs: Object.fromEntries(node.attributes.properties
          .filter(ts.isJsxAttribute)
          .map((attr) => [attr.name.getText(source), attr.initializer?.getText(source) ?? "true"])),
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return result;
}

test("class navigation uses a native, named title link with a focus indicator", () => {
  const source = read(cardPath);
  const links = elements(cardPath).filter(({ tag }) => tag === "Link");
  assert.ok(links.some(({ attrs }) => attrs.href?.includes("/classes/") && attrs.className?.includes("focus-visible")));
  assert.match(source, /<Link[\s\S]*?>\s*\{classItem.title\}\s*<\/Link>/);
  assert.ok(!elements(cardPath).some(({ tag, attrs }) => tag === "div" && attrs.onClick));
  assert.ok(!/<Link[\s\S]*?<button[\s\S]*?<\/Link>/.test(source));
});

test("all seven mobile chip removals are labeled native buttons", () => {
  const source = read(classesPath);
  const mobileSection = source.slice(source.indexOf("{/* Active filter chips on mobile */}"), source.indexOf("{/* AI search indicator — mobile */}"));
  const chips = elements(classesPath, `<>${mobileSection}</div>)}</>`).filter(({ tag, attrs }) =>
    tag === "button" && attrs["aria-label"]?.startsWith('"Remove '));
  assert.equal(chips.length, 7);
  assert.equal(new Set(chips.map(({ attrs }) => attrs["aria-label"])).size, 7);
  assert.ok(chips.every(({ attrs }) => attrs.type === '"button"' && attrs.onClick));
  assert.ok(!elements(classesPath).some(({ tag, attrs }) => tag === "X" && attrs.onClick));
});

test("public searches have persistent accessible names", () => {
  for (const path of [
    "client/src/components/home/search-filters.tsx",
    classesPath,
    "client/src/pages/coaches.tsx",
  ]) {
    assert.ok(elements(path).some(({ tag, attrs }) => tag === "Input" && attrs["aria-label"]?.includes("Search")));
  }
});

test("icon actions, social links, and quantity controls have names", () => {
  for (const path of [cardPath, "client/src/pages/class-details.tsx"]) {
    const controls = elements(path);
    assert.ok(controls.some(({ attrs }) => attrs["aria-label"]?.includes("Share")));
    assert.ok(controls.some(({ attrs }) => attrs["aria-label"]?.includes("Unlike") && attrs["aria-pressed"]));
  }
  for (const path of ["client/src/pages/class-details.tsx", "client/src/pages/time-bound-package-details.tsx"]) {
    const controls = elements(path);
    for (const direction of ["Increase", "Decrease"]) {
      assert.ok(controls.some(({ tag, attrs }) => tag === "Button" && attrs["aria-label"] === `"${direction} number of spots"`));
    }
  }
  const header = elements("client/src/components/layout/header.tsx");
  assert.ok(header.some(({ attrs }) => attrs["aria-label"] === '"Open navigation menu"'));
  assert.ok(header.some(({ tag, attrs }) => tag === "Link" && attrs["aria-label"]?.includes("My calendar") && attrs["aria-label"]?.includes("My bookings")));
  const social = elements("client/src/components/layout/footer.tsx").filter(({ tag, attrs }) =>
    tag === "a" && /instagram|facebook|linkedin/.test(attrs.href ?? ""));
  assert.equal(social.length, 3);
  assert.ok(social.every(({ attrs }) => attrs["aria-label"]));
});

function rgb(values) {
  const [h, percentS, percentL] = values.match(/[\d.]+/g).map(Number);
  const s = percentS / 100, l = percentL / 100, a = s * Math.min(l, 1 - l);
  return [0, 8, 4].map((n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  });
}
function luminance(rgb) {
  return rgb.map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}

test("light and dark brand pairs and enabled hover states meet 4.5:1", () => {
  const css = read("client/src/index.css");
  for (const theme of [":root", ".dark"]) {
    const block = css.slice(css.indexOf(`${theme} {`)).split("}")[0];
    const tokens = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([\d. %]+);/g)]
      .map(([, name, value]) => [name, rgb(value)]));
    for (const name of ["primary", "secondary", "accent"]) {
      const fg = luminance(tokens[`${name}-foreground`]);
      // Shared button/badge hovers darken the solid background by 10%.
      // Explicit public primary/90 backgrounds composite over white.
      const states = [tokens[name], tokens[name].map((v) => v * 0.9)];
      if (name === "primary") states.push(tokens[name].map((v) => v * 0.9 + 0.1));
      for (const color of states) {
        const bg = luminance(color);
        const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        assert.ok(ratio >= 4.5, `${theme} ${name}: ${ratio.toFixed(2)}:1`);
      }
    }
  }
  for (const component of ["button", "badge"]) {
    const source = read(`client/src/components/ui/${component}.tsx`);
    assert.doesNotMatch(source, /hover:bg-(primary|secondary)\/\d+/);
  }
});

test("viewport permits zoom", () => {
  const viewport = read("client/index.html").match(/<meta name="viewport"[^>]+>/)?.[0];
  assert.ok(viewport);
  assert.doesNotMatch(viewport, /maximum-scale|user-scalable|minimum-scale/);
});
