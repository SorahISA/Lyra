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
- Edit file name, title, and lyrics
- Live preview with ruby annotations
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
