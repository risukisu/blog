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

## Campfire: featured stories (risu.pl/campfire)

The guestbook at `/campfire` (`src/pages/campfire.astro` + `src/scripts/campfire.js`) reads stories from **campfire-api** (`D:\AI_WORKSPACE_Personal\projects\campfire-api`, Vercel, `https://campfire-api-nine.vercel.app`). The owner can **feature** up to 3 stories: gold, bigger, shimmering stars whose cards stay open. Featuring is a live API call, **no blog commit or deploy**.

When the owner says any of: "feature X's story / comment on the campfire", "make X a featured star", "unfeature X", "what's featured on the campfire" — this is it. Run it with the Bash tool:

```bash
API=https://campfire-api-nine.vercel.app
TOKEN=$(tr -d '\r\n' < "$CLAUDE_SYSTEM/credentials/personal/campfire-admin-token.txt")   # never echo it
curl -s "$API/api/entries"                                                  # { entries: [...newest 100], featured: [...] }
curl -s -X POST   "$API/api/feature?id=<uuid>" -H "Authorization: Bearer $TOKEN"   # feature
curl -s -X DELETE "$API/api/feature?id=<uuid>" -H "Authorization: Bearer $TOKEN"   # unfeature
```

1. Fetch `/api/entries`, match the owner's words to an entry by `name` and/or `message`. One clear match → go. Several or none → show the candidates (name, date, message) and ask. Never guess an id.
2. POST to feature. `201` = done, `200 already:true` = was already featured, `409` = 3 already featured (show them, ask which to unfeature), `404` = id not in the stored list, `401` = token file missing or wrong.
3. Verify: fetch `/api/entries` again and confirm the id is in `featured`. Tell the owner it's live at https://risu.pl/campfire/ (visitors see it on their next page load).

The token file is the owner's one-time setup (the value of `ADMIN_TOKEN` on the Vercel project). If it's missing, say so and stop — don't read Vercel env vars. Full API reference: campfire-api `README.md` / `DESIGN.md`.

## Content rules

- Post voice: auto-memory `writing-voice-profile` — continuous prose, no headers, 400–800 words, anti-conclusion endings.
- Always run `/copy-deslop` before publishing.
- Public-facing changelog only — no internal/meta work in `changelog.astro` entries (auto-memory `feedback_changelog_public_only`).
