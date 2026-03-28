# Changelog

All notable changes to this project are documented here.

## 2026-03-28 — New Post, Changelog Page, dogs.txt & Language Fix

### Published
- **["How to revive a 25 year old website"](/blog/how-to-revive-a-25-year-old-website/)** — bilingual EN/PL post about rediscovering a Dragon Ball fan-site from 2001. Originally posted on LinkedIn Feb 6, 2026. Includes screenshot of the original site.

### Added
- **Changelog page** at `/changelog` — parses `CHANGELOG.md` at build time into collapsible terminal-style sections with `git log` aesthetics. Latest entry open by default.
- **`[changelog]` footer link** — sits between `[rss]` and `[github]` on every page.
- **dogs.txt** at `/.well-known/dogs.txt` — a rebellion against the cats.txt standard, featuring Brokuł (Broccoli) the dog and risu the squirrel who thinks she's a dog. Credits Mark Williams-Cook and catstxt.org.
- **Hidden paw button** — small paw print icon on every page (bottom-left, next to cookie icon, 30% opacity). Glows amber on hover. Links to dogs.txt.

### Fixed
- **Bilingual posts now always default to EN** — previously, toggling to PL on one post would carry over to all other bilingual posts via localStorage. Each post now starts fresh in English.

## 2026-03-26 — OG Image & Polish

### Changed
- Replaced default Astro OG image with custom risu squirrel design (1200x630, terminal aesthetic)

### Fixed
- Removed internal workspace files from public repo

## 2026-03-24 — Writing for No One & Shared Tooltips

### Published
- **["Writing for no one"](/blog/writing-for-no-one/)** — a post about writing without an audience

### Changed
- Extracted link preview tooltip into shared component, enabled on all pages
- Added blinking cursor to /me page
- Updated welcome message and blog link text

### Fixed
- Link formatting in writing-for-no-one.md
- Memory reference path fix

## 2026-03-22 — Bilingual Posts, Link Previews, New Post Indicator

### Added
- **Language toggle (EN/PL)** — bilingual blog posts with seamless in-page switching. Amber `[EN | PL]` toggle in the post metadata area. Active language is bright, inactive is muted. Preference saved to localStorage and persists across posts and visits. Title, date, and body content all swap on toggle.
- **Bilingual content model** — single `.mdx` file per bilingual post with language-toggled content blocks. New frontmatter fields: `bilingual`, `titlePl`, `descriptionPl`.
- **`[EN|PL]` badge on blog index** — amber indicator next to post titles for bilingual posts, so readers know before clicking.
- **Link preview tooltips** — hover over any link with a title attribute to see an amber-bordered tooltip with a preview snippet and domain name. Rehype plugin transforms links at build time. External links automatically open in new tabs. JS-disabled fallback shows native browser tooltip.
- **New post indicator** — returning visitors see a blinking green `new` badge next to posts they haven't seen before. Uses localStorage slug tracking with session rotation (badges persist for the session, clear on next visit). First-time visitors see no badges. Works for republished old content too (slug-based, not date-based).
- **Rehype plugin** (`src/plugins/rehype-links.js`) — build-time link enhancement: external link handling + title-to-data-preview transformation.

### Published
- **["Gambleriada and the story of a mug"](/blog/gambleriada/)** — first bilingual post (EN/PL). Originally written Dec 19, 2013. A memory from Gambleriada 1998 about a mug, a book, an autograph and a security guard.

## 2026-03-21 — Content Restructure & Drafts

### Changed
- Moved blog content from `src/content/` to `content/` (Astro 5 convention)
- Gambleriada posts moved to `content/drafts/` (not ready for publishing at the time)

## 2026-03-05 — Three Blog Posts & Polish

### Added
- **["The 4. Why the Mountain sometimes fights with the Mist"](/blog/the-four/)** — leadership/work post with a 2x2 alignment matrix (Mountain, River, Glacier, Mist)
- **["Random messages"](/blog/random-messages/)** — career/work post
- **["Nostalgia is a hell of a drug"](/blog/nostalgia-is-a-hell-of-a-drug/)** — gaming/life post (originally Sep 2024)

### Changed
- Widened blog post content area from 720px to 800px
- Highlighted key terms in "The Four" post (Core/Shell, matrix labels)
- Highlighted "random memories" text on Me page
- Replaced favicon with SerenityOS chipmunk emoji
- Switched GA4 to Advanced Consent Mode for cookieless analytics

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
- **GDPR cookie consent system** — full-width banner on first visit, persistent cookie icon (bottom-left, amber) on every page, preferences panel to view/change consent, GA4 only loads after explicit consent

## 2026-02-27 — Custom Domain & Feature Work

### Added
- Custom domain `risu.pl` — CNAME file, DNS A records on OVH pointing to GitHub Pages
- Theme toggle easter egg rework: click 1 shows warning, clicks 2-4 show countdown, click 5 switches to light mode with confirmation message, all messages persist 3 seconds

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
- RSS feed and sitemap support
- SEO with canonical URLs and OpenGraph data
