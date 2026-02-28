# random memories

Personal blog by [risukisu](https://github.com/risukisu) — a dark terminal/roguelike-themed site built with Astro.

**Live at [risu.pl](http://risu.pl)**

## About

A personal blog for gaming, life, work, and everything between. Styled after CRT terminals and ASCII roguelikes (Cogmind-inspired), with neon accents on a deep blue-black background.

## Features

- Dark CRT terminal aesthetic with custom ASCII components
- JetBrains Mono monospace font throughout
- Blog with tag filtering and search
- Theme toggle easter egg (5 clicks to switch to light mode)
- Braille art squirrel mascot
- GDPR-compliant cookie consent with persistent preferences icon
- GA4 analytics (consent-gated)
- RSS feed
- SEO with OpenGraph and Twitter cards

## Tech Stack

- **Framework:** [Astro](https://astro.build)
- **Styling:** [Tailwind CSS](https://tailwindcss.com) v4 + custom CSS
- **Content:** Markdown / MDX
- **Hosting:** GitHub Pages
- **Domain:** risu.pl (DNS via OVH)
- **CI/CD:** GitHub Actions — auto-deploy on push to main

## Project Structure

```
src/
├── components/     # Astro components (AsciiBox, Header, PostCard, etc.)
├── content/blog/   # Blog posts (Markdown/MDX)
├── pages/          # Routes (/, /blog, /projects, /me)
└── styles/         # Global CSS
public/
├── fonts/          # JetBrains Mono
└── favicon.svg     # Terminal >_ glyph
```

## Commands

| Command           | Action                                  |
| :---------------- | :-------------------------------------- |
| `npm install`     | Install dependencies                    |
| `npm run dev`     | Start dev server at `localhost:4321`    |
| `npm run build`   | Build production site to `./dist/`      |
| `npm run preview` | Preview build locally before deploying  |

## Pages

| Path        | Description                              |
| :---------- | :--------------------------------------- |
| `/`         | Landing page — mascot, intro, recent posts, links |
| `/blog`     | Blog listing with search and tag filters |
| `/blog/[slug]` | Individual blog posts                 |
| `/projects` | Projects showcase (coming soon)          |
| `/me`       | About page with bio and links            |
