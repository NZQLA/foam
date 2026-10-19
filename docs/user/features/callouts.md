# Callouts

Use callouts to highlight a note, warning, or other information in the Markdown preview. Each quoted source line in the body starts on a new line, without needing a trailing `\`.

```markdown
> [!info] A useful detail
> Callout text can span multiple lines.
> It can also contain **Markdown formatting**.
```

By default, Foam recognizes the five GitHub alert types: `note`, `tip`, `important`, `warning`, and `caution`. It also recognizes `info` as a Foam synonym for GitHub's `note`, so the default callout command works in this mode. Turn off `foam.callout.githubOnly` in Settings to enable the extended callout types and custom types.

Select Markdown text and run **Foam: Add Callout to Selection** to wrap it in a callout. The default type is `info`; change it with `foam.callout.defaultType`. If the configured type is not supported by the active mode, the command falls back to `info`. Run **Foam: Remove Callout from Selection** with the complete callout selected to remove its marker and quote prefixes while keeping its title and body. Neither command has a default keyboard shortcut; assign one in Keyboard Shortcuts or `keybindings.json`.

Add `-` after the type to make a callout start collapsed. Click its title to expand or collapse it:

```markdown
> [!warning]- More details
> This starts hidden until the title is clicked.
```

Callout types and aliases ignore case and surrounding whitespace. In Settings, the five built-in GitHub types are grouped under `foam.callout.aliases.builtin`; their names are fixed, and aliases are comma-separated. The defaults include `info` for `note`, `hint` for `tip`, `must` for `important`, `!, warn, attention` for `warning`, and `!!!, danger` for `caution`.

Common non-GitHub types are prefilled under `foam.callout.aliases.custom`; you can edit or delete those rows, or add your own type and aliases. The workflow presets are `idea`, `todo`, `doing` (`>>`), `waitting` (`==`), `giveup`, and `done` (`success`, `√`, `V`). `faq` also accepts `?`, and `todo` uses an unchecked checkbox icon. The `!`, `>>`, `==`, `?`, and `√` aliases are recognized as callout names:

```json
{
  "foam.callout.aliases.enabled": true,
  "foam.callout.aliases.builtin": {
    "note": "info",
    "tip": "hint",
    "important": "must",
    "warning": "!,warn,attention",
    "caution": "!!!,danger"
  },
  "foam.callout.aliases.custom": {
    "doing": ">>",
    "faq": "help,question,?",
    "done": "success,√,V",
    "waitting": "==",
    "error": "x,failed"
  }
}
```

Aliases are off by default. Enable `foam.callout.aliases.enabled` to apply them in extended mode; aliases do not change which types GitHub-only mode recognizes. The alias settings remain visible when aliases are off because VS Code cannot conditionally hide settings.

Any callout name is recognized without registering it first. Style one or several custom names with CSS loaded through VS Code's [`markdown.styles`](custom-markdown-preview-styles.md) setting. Foam adds the `callout` class and keeps the original callout name in `data-callout`, so Obsidian-style selectors work:

```css
.callout[data-callout='good'],
.callout[data-callout='perfect'],
.callout[data-callout='nice'],
.callout[data-callout='wow'] {
  --callout-color: 117, 255, 64;
  --callout-icon: url('data:image/svg+xml;base64,PASTE_BASE64_SVG_HERE');
}
```

`--callout-icon` accepts a CSS image URL, including an SVG data URL. Custom styles can be shared across aliases by targeting `data-callout-type`, which contains the canonical type after alias resolution.

The extension's bundled `static/preview/style.css` and built-in icon SVGs are plugin files, not user configuration; direct edits to them can be replaced by a plugin update. For persistent customizations, put CSS in a workspace stylesheet and load it with `markdown.styles`. That stylesheet can override `--callout-color` and `--callout-icon`. The bundled SVG defaults remain in code so previews always have icons even when no custom stylesheet is configured.

Callouts are written as standard Markdown blockquotes, so other Markdown tools still show their content as a quote.
