# Blog — risu.pl ("random memories")

The live personal blog at https://risu.pl. EN/PL. The site is **built and deployed** — work here is maintenance, design tweaks, and content. Not greenfield.

## Stack

- Astro 5 + MDX (`astro.config.mjs`, `site: 'https://risu.pl'`)
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- RSS at `src/pages/rss.xml.js`, sitemap via `@astrojs/sitemap`

## Structure

- Posts: `src/content/blog/` — collections defined in `src/content.config.ts`
- Pages: `src/pages/` — index, blog, changelog, me, projects, acknowledgements, 404
- Site constants: `src/consts.ts` (`SITE_TITLE = 'random memories'`)
- Layouts/components/styles: `src/layouts/`, `src/components/`, `src/styles/`

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build (run before pushing non-trivial changes)
- `npm run preview` — preview the build

## Deploy — pushing to main IS deploying

GitHub Pages via `.github/workflows/deploy.yml`, triggered on every push to `main`. Custom domain `risu.pl` (`public/CNAME`). There is no staging — verify with `npm run build` locally first.

## Content rules

- Post voice: auto-memory `writing-voice-profile` — continuous prose, no headers, 400–800 words, anti-conclusion endings.
- Always run `/copy-deslop` before publishing.
- Public-facing changelog only — no internal/meta work in `changelog.astro` entries (auto-memory `feedback_changelog_public_only`).
