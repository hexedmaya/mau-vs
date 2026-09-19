// Runs the real grammar with VS Code's own JavaScript and CSS grammars and checks the scopes (= colors)
// that come out. The built-in grammars are read from a VS Code installation. Without one, the tests are skipped.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const vsctm = require("vscode-textmate");
const oniguruma = require("vscode-oniguruma");
const here = path.dirname(fileURLToPath(import.meta.url));

function findBuiltins() {
  const cands = [process.env.VSCODE_EXTENSIONS];
  const local = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs", "Microsoft VS Code");
  if (local && fs.existsSync(local)) {
    for (const d of fs.readdirSync(local)) cands.push(path.join(local, d, "resources", "app", "extensions"));
    cands.push(path.join(local, "resources", "app", "extensions"));
  }
  cands.push("/Applications/Visual Studio Code.app/Contents/Resources/app/extensions", "/usr/share/code/resources/app/extensions");
  return cands.find((c) => c && fs.existsSync(path.join(c, "javascript", "syntaxes")));
}

const builtins = findBuiltins();
const skip = builtins ? false : "no VS Code installation found (set VSCODE_EXTENSIONS to its resources/app/extensions folder)";

const files = builtins && {
  "text.html.mau": path.join(here, "..", "syntaxes", "mau.tmLanguage.json"),
  "source.js": path.join(builtins, "javascript", "syntaxes", "JavaScript.tmLanguage.json"),
  "source.js.regexp": path.join(builtins, "javascript", "syntaxes", "Regular Expressions (JavaScript).tmLanguage"),
  "source.css": path.join(builtins, "css", "syntaxes", "css.tmLanguage.json"),
};

let grammar = null;
if (builtins) {
  const wasm = fs.readFileSync(path.join(path.dirname(require.resolve("vscode-oniguruma")), "onig.wasm")).buffer;
  await oniguruma.loadWASM(wasm);
  const registry = new vsctm.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (sources) => new oniguruma.OnigScanner(sources),
      createOnigString: (s) => new oniguruma.OnigString(s),
    }),
    loadGrammar: async (scope) => (files[scope] ? vsctm.parseRawGrammar(fs.readFileSync(files[scope], "utf8"), files[scope]) : null),
  });
  grammar = await registry.loadGrammar("text.html.mau");
}

// every token of a document: { text, scopes }
function tokens(src) {
  const out = [];
  let stack = vsctm.INITIAL;
  for (const line of src.split("\n")) {
    const r = grammar.tokenizeLine(line, stack);
    for (const t of r.tokens) out.push({ text: line.slice(t.startIndex, t.endIndex), scopes: t.scopes });
    stack = r.ruleStack;
  }
  return out;
}

// the scopes of the first token whose text is exactly `text`
function scopesOf(src, text, nth = 0) {
  const hits = tokens(src).filter((t) => t.text === text);
  assert.ok(hits.length > nth, `no token "${text}" in the output`);
  return hits[nth].scopes.join(" ");
}
const has = (scopes, part) => assert.ok(scopes.includes(part), `expected "${part}" in: ${scopes}`);
const hasNot = (scopes, part) => assert.ok(!scopes.includes(part), `did not expect "${part}" in: ${scopes}`);

const opts = { skip };

test("script: real JavaScript highlighting", opts, () => {
  const src = "<script>\n  const n = signal(0);\n</script>";
  has(scopesOf(src, "const"), "storage.type");
  has(scopesOf(src, "const"), "meta.embedded.block.javascript");
  has(scopesOf(src, "signal"), "entity.name.function");
  has(scopesOf(src, "script"), "entity.name.tag");
});

test("style: real CSS highlighting", opts, () => {
  const src = "<style>\n  b { color: red; }\n</style>";
  has(scopesOf(src, "color"), "support.type.property-name.css");
  has(scopesOf(src, "color"), "meta.embedded.block.css");
});

test("tags, components and attributes", opts, () => {
  const src = '<div class="box"><Item label="x" /></div>';
  has(scopesOf(src, "div"), "entity.name.tag");
  has(scopesOf(src, "class"), "entity.other.attribute-name");
  has(scopesOf(src, "box"), "string.quoted.double");
  has(scopesOf(src, "Item"), "support.class.component.mau");
  hasNot(scopesOf(src, "div"), "support.class.component");
});

test("events and bindings: on: and bind:", opts, () => {
  const src = "<input on:input={f} bind:value={name}>";
  has(scopesOf(src, "on"), "keyword.control.mau");
  has(scopesOf(src, "input", 1), "entity.other.attribute-name.mau");
  has(scopesOf(src, "bind"), "keyword.control.mau");
  has(scopesOf(src, "name"), "meta.embedded.expression.mau");
});

test("{expression} in text is JavaScript, its braces get their own scope", opts, () => {
  const src = "<p>Wert: {count()} mal</p>";
  has(scopesOf(src, "{"), "punctuation.section.embedded.begin.mau");
  has(scopesOf(src, "count"), "entity.name.function");
  has(scopesOf(src, "}"), "punctuation.section.embedded.end.mau");
  hasNot(scopesOf(src, " mal"), "meta.embedded");
});

test("{expression} inside a quoted attribute", opts, () => {
  const src = '<div class="a {open() ? \'x\' : \'\'}">';
  has(scopesOf(src, "open"), "meta.embedded.expression.mau");
  has(scopesOf(src, "open"), "string.quoted.double");
});

test("blocks: if, else if, else, each, html", opts, () => {
  const src = [
    "{#if n() > 0}", "<p>a</p>", "{:else if n() < 0}", "<p>b</p>", "{:else}", "<p>c</p>", "{/if}",
    "{#each items() as item (item.id)}", "<li>{item.name}</li>", "{/each}", "{@html trusted}",
  ].join("\n");
  const t = tokens(src);
  const kw = (text) => t.filter((x) => x.text === text && x.scopes.join(" ").includes("keyword.control.mau")).length;
  assert.ok(kw("if") >= 3, "if / else if / {/if}");
  assert.ok(kw("else") >= 2, "else if / else");
  assert.ok(kw("each") >= 2, "#each and /each");
  assert.ok(kw("as") >= 1, "as");
  assert.ok(kw("html") >= 1, "@html");
  has(scopesOf(src, "items"), "entity.name.function");
  has(scopesOf(src, "trusted"), "meta.embedded.expression.mau");
  hasNot(scopesOf(src, "<", 0), "meta.embedded");
});

test("comments", opts, () => {
  has(scopesOf("<!-- note -->\n<p></p>", " note "), "comment.block.html");
});

test("an escaped brace is text, not the start of an expression", opts, () => {
  const src = "<p>use \\{name\\} here</p>";
  const t = tokens(src);
  assert.ok(!t.some((x) => x.scopes.join(" ").includes("meta.embedded.expression.mau")), "no expression started");
  assert.ok(t.some((x) => x.scopes.join(" ").includes("constant.character.escape.mau")), "escape is marked");
  hasNot(scopesOf(src, "</", 0), "meta.embedded");
});

test("after a broken expression the next tag is still recognised", opts, () => {
  const src = "<p>{ok()}</p>\n<Item />";
  has(scopesOf(src, "Item"), "support.class.component.mau");
});

test("a whole component highlights end to end", opts, () => {
  const src = fs.readFileSync(path.join(here, "sample.mau"), "utf8");
  const t = tokens(src);
  const scoped = (part) => t.some((x) => x.scopes.join(" ").includes(part));
  for (const part of ["storage.type", "support.type.property-name.css", "entity.name.tag", "support.class.component.mau", "keyword.control.mau", "punctuation.section.embedded.begin.mau", "comment.block.html", "string.quoted.double"]) {
    assert.ok(scoped(part), `expected some token with ${part}`);
  }
});
