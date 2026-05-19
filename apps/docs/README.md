# FastBackend Docs

Documentation site for FastBackend, built with Next.js (same stack as UIGen `apps/docs`).

Uses npm (not pnpm workspace).

## Development

```bash
cd fastbackend/apps/docs
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Content

Markdown pages live in `content/{section}/{slug}.md`. Navigation is defined in `lib/nav.ts`. Only pages listed in `nav` are routed and indexed for search.

## Search

Search index is built at compile time:

```bash
npm run prebuild   # writes public/search-index.json
```

Press `Cmd+K` / `Ctrl+K` in the docs layout to search.
