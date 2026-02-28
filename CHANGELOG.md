# Changelog

All notable changes to this project are documented here.

## 2026-02-28 — Base Path Fix, Landing Page & GDPR

### Fixed
- Removed `base: '/blog'` from Astro config — custom domain `risu.pl` serves from root, so the base path was causing all CSS, fonts, and assets to 404
- Updated all hardcoded `/blog/` prefixes in Header, Footer, BaseHead, global.css, and HeaderLink
- Moved `_template.md` out of blog content directory — was showing up as a published post
- Fixed Astro CSS scoping on cookie consent — dynamically created elements need `is:global` styles

### Added
- **Landing page** at `/` — squirrel mascot, `$ whoami` intro, recent posts section, links box
- **Projects page** at `/projects` — placeholder for future project showcases
- **Projects** nav item in header between Blog and Me
- **LinkedIn** link on the Me page
- **GA4 tracking** (Measurement ID: G-TN2YY0219L), gated behind cookie consent
- **GDPR cookie consent system:**
  - Full-width banner on first visit with [accept] / [decline]
  - Persistent cookie icon (bottom-left, amber) on every page
  - Click icon to open preferences panel — view status, change consent anytime
  - GA4 only loads after explicit user consent
  - Green glow on accept hover, magenta glow on decline hover

## 2026-02-27 — Custom Domain & Feature Work

### Added
- Custom domain `risu.pl` — CNAME file, DNS A records on OVH pointing to GitHub Pages
- Theme toggle easter egg rework: click 1 shows warning, clicks 2-4 show countdown, click 5 switches to light mode with confirmation message, all messages persist 3 seconds
- `WRITING.md` — guide for writing and publishing blog posts
- Blog post template at `src/content/blog-template.md`

### Changed
- Updated `astro.config.mjs` site URL to `https://risu.pl`

### Notes
- HTTPS TLS certificate provisioning in progress (GitHub auto-provisions via Let's Encrypt)

## 2026-02-22 — Terminal Roguelike Redesign

### Added
- Full visual redesign: dark CRT terminal aesthetic inspired by Cogmind / ASCII roguelikes
- Color system: deep blue-black background (#0a0e14), neon accents (cyan, green, amber, magenta)
- Light mode with muted palette (`:root.light` CSS variables)
- JetBrains Mono font (monospace throughout, self-hosted)
- Custom ASCII component library: AsciiBox, AsciiDivider, TerminalPrompt, GlyphTag, PostCard
- Navigation with `>_` logo and `>` active prefix on links
- Theme toggle button `[DARK]`/`[LITE]` with 5-click easter egg and "[WARN] light mode is for losers" toast
- Home page: braille art squirrel mascot (amber), `$ whoami` intro, 3 recent posts in AsciiBox
- Blog listing: `$ ls -la posts/` prompt, search input, tag filter buttons with client-side JS filtering
- Blog post layout: title in AsciiBox, tags, `── EOF ──` ending divider
- Me page: standalone layout with bio and links (Substack, GitHub)
- Tag system: `tags` field in content schema, all sample posts tagged
- Custom favicon: terminal `>_` glyph as SVG
- Shiki `github-dark` syntax highlighting for code blocks
- Blog renamed to "random memories"

### Removed
- Old `about.astro` page (replaced by Me page)

## 2026-02-22 — Initial Setup

### Added
- Astro blog project scaffolded from template
- Tailwind CSS v4 configured via Vite plugin
- GitHub Pages hosting at `risukisu.github.io/blog`
- GitHub Actions workflow for auto-deploy on push to main
- Markdown/MDX content collections for blog posts
- Session management skills (`/save`, `/resume`, `/wip`, `/sync`)
- Memory system (`memory/sessions/`, `memory/shared/`)
- RSS feed and sitemap support
- SEO with canonical URLs and OpenGraph data
