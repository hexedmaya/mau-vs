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
- comments, brackets and auto-closing pairs

There is no language server, no formatter and no snippets yet.

## Install

The extension is not on the marketplace yet. Copy this folder into your VS Code extensions folder, named `hexedmaya.mau-0.1.0`, and reload the window:

- Windows: `%USERPROFILE%\.vscode\extensions\`
- macOS and Linux: `~/.vscode/extensions/`

Or open this folder in VS Code and press `F5` to try it in a test window.

If a file is not recognized, pick **mau** in the language mode at the bottom right.

## Files

- `syntaxes/mau.tmLanguage.json`: the TextMate grammar
- `language-configuration.json`: brackets, comments, auto-closing pairs
- `package.json`: the extension manifest
- `icon.png`: the extension icon

## License and brand

mau License 1.0, see [LICENSE](LICENSE). The name and the logo follow the [BRAND-POLICY](BRAND-POLICY.md).
