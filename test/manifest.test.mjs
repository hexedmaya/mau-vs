// The manifest points at files that exist: language icon (shown next to .mau files), extension icon, grammar.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const exists = (rel) => fs.existsSync(path.join(root, rel));

test("the language is mau and owns the .mau extension", () => {
  const lang = pkg.contributes.languages[0];
  assert.equal(lang.id, "mau");
  assert.deepEqual(lang.extensions, [".mau"]);
  assert.ok(exists(lang.configuration));
});

test("the file icon for .mau files exists in a light and a dark variant", () => {
  const { icon } = pkg.contributes.languages[0];
  assert.ok(icon && icon.light && icon.dark, "icon.light and icon.dark are set");
  assert.ok(exists(icon.light) && exists(icon.dark));
  assert.match(fs.readFileSync(path.join(root, icon.light), "utf8"), /<svg[^>]*viewBox/);
});

test("the extension icon is a png (the marketplace requires it) and the grammar is there", () => {
  assert.match(pkg.icon, /\.png$/);
  assert.ok(exists(pkg.icon));
  assert.ok(exists(pkg.contributes.grammars[0].path));
});

test("the package is not held back by .vscodeignore: icons are included", () => {
  const ignore = fs.readFileSync(path.join(root, ".vscodeignore"), "utf8").split(/\r?\n/);
  assert.ok(!ignore.some((l) => l.startsWith("icons")), "icons/ is not ignored");
});
