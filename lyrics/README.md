# Lyra Lyrics Workspace (GitHub Pages)

Static lyrics workspace for Japanese lyrics with custom phonetic annotations.

## Syntax

Use bracket format:

- `[天球|そら]`
- `[シルエットダンス|silhouette dance]`

The left side is base text, right side is phonetic text rendered with `ruby/rt`.

## Features

- Nested folder/file workspace
- Create folders and files
- Drag and drop files/folders to move them
- Edit file name and title
- Per-row editor: two lines (`lyrics` + `comment`)
- Comment line shown under lyrics in preview
- Inline style markers:
  - `**bold**`
  - `__underline__`
  - `{#dEaD64}text{/color}` (6-digit hex)
- Keyboard shortcuts while editing rows:
  - `Ctrl+B` for bold
  - `Ctrl+U` for underline
  - `Ctrl+L` for hex color tag
- Live preview with ruby annotations
- Focus mode: maximize Editor or Preview (Preview uses responsive multi-column layout)
- Cookie-based persistence (no backend)
- Export/import full workspace JSON

## Storage

Data is stored in browser cookies (chunked across multiple cookies).

- Stored per browser profile
- Sent with requests to the same site (cookie behavior)
- Has size limits; very large workspaces may fail to save in cookies

Use Export regularly as backup.

## Publish with GitHub Pages

1. Push these files to your repository.
2. Open repository settings -> `Pages`.
3. Select `Deploy from a branch`.
4. Choose branch/folder and save.

GitHub will provide a public URL.
