# mau for VS Code

<img src="icon.png" alt="mau" width="96" align="right">

Syntax highlighting for `.mau` files, part of mau, the small frontend framework. By hexedmaya.

A `.mau` file has a script, one root element and a style, and the extension colors each of them for what it is:

```html
<script>
  const n = signal(0);
</script>

{#if n() > 0}
  <Item label={"clicked " + n()} on:click={() => n.set(n() + 1)} />
{/if}

<style>
  :scope { padding: 1rem; }
</style>
```

## What is highlighted

- the markup, with its tags and attributes
- JavaScript in `<script>` and in every `{expression}`
- CSS in `<style>`
- blocks: `{#if}`, `{:else if}`, `{:else}`, `{#each ... as ...}`, `{@html}`
- `on:` and `bind:` attributes
- components (`<Item />`) in their own color
- `\{` and `\}` as an escaped brace, not as the start of an expression
- comments, brackets and auto-closing pairs

There is no language server, no formatter and no snippets yet.

## Install

The extension is not on the marketplace yet.

Download `mau-0.1.1.vsix` from the [latest release](https://github.com/hexedmaya/mau-vs/releases/latest) and install it:

```
code --install-extension mau-0.1.1.vsix
```

Or build it from the source in this folder:

```
npx @vscode/vsce package
code --install-extension mau-0.1.1.vsix
```

Reload the VS Code window afterwards. If a file is not recognized, pick **mau** in the language mode at the bottom right.

To try changes without installing, open this folder in VS Code and press `F5`.

## Test

The tests run the real grammar together with VS Code's own JavaScript and CSS grammars and check which color category each piece of text gets. They need a VS Code installation, which they find on their own. Set `VSCODE_EXTENSIONS` to its `resources/app/extensions` folder if they do not.

```
npm install
npm test
```

## Files

- `syntaxes/mau.tmLanguage.json`: the TextMate grammar
- `language-configuration.json`: brackets, comments, auto-closing pairs
- `package.json`: the extension manifest
- `test/`: the grammar tests and a sample component
- `icon.png`: the extension icon
- `icons/mau.svg`: the icon VS Code shows next to `.mau` files

## License and brand

mau License 1.0, see [LICENSE](LICENSE). The name and the logo follow the [BRAND-POLICY](BRAND-POLICY.md).
