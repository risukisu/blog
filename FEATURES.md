# Features

Complete documentation of all features on risu.pl, how they work, and how things are calculated.

---

## Bilingual Posts (EN/PL)

Posts can be published in both English and Polish using a single `.mdx` file.

**Content model:**
- Wrap English content in `<div data-lang="en">` and Polish in `<div data-lang="pl">`
- Add frontmatter fields: `bilingual: true`, `titlePl`, `descriptionPl`
- Title and date swap independently via `data-title-en/pl` and `data-date-en/pl` attributes

**Toggle behavior:**
- Amber `EN | PL` toggle appears in the post metadata area
- Active language is bright, inactive is muted (40% opacity)
- Every bilingual post defaults to EN on page load
- Clicking PL saves preference to `localStorage` key `risu_preferredLang`, but it resets to EN on next page load
- Content swap: all `[data-lang]` elements toggle `display: none` based on selected language

**Blog index:**
- Bilingual posts show an amber `[EN|PL]` badge next to the title

**Files:** `src/layouts/BlogPost.astro`, `src/content.config.ts`

---

## Link Preview Tooltips

Hovering over links with a `title` attribute shows an amber-bordered tooltip with a preview snippet and domain name.

**Build-time (rehype plugin):**
- `src/plugins/rehype-links.js` runs during Astro build
- External links (URLs starting with `http` that don't include `risu.pl`) get `target="_blank"` and `rel="noopener noreferrer"`
- The link's `title` attribute is copied to `data-preview`
- Domain is extracted from the URL (with `www.` stripped) and stored in `data-domain`
- Original `title` is preserved as fallback for browsers with JS disabled

**Client-side (tooltip display):**
- Mouseover on any `<a data-preview>` triggers a 150ms delayed tooltip
- Tooltip position is calculated relative to the link: centered horizontally, below by default
- If not enough space below, flips above with an arrow pointing down
- Viewport bounds checking with 8px edge padding
- Hides on: mouseout, click, or scroll

**Styling:** Amber border, dark background, max-width 320px, z-index 100

**Files:** `src/components/LinkPreviewTooltip.astro`, `src/plugins/rehype-links.js`

---

## New Post Indicator

Returning visitors see a blinking green `new` badge next to posts they haven't seen before.

**How it's calculated:**

1. **First visit:** Both localStorage keys (`risu_previouslySeen`, `risu_currentlySeen`) are seeded with all current post slugs. No badges shown.
2. **Returning visit:** Current post slugs are compared against `previouslySeen`. Any slug not in `previouslySeen` gets a green `new` badge injected into its `.post-title`.
3. **Session rotation:** After displaying badges, `previouslySeen` is updated to `currentlySeen`, and `currentlySeen` is refreshed with all current slugs. This means badges persist for the current session but clear on the next visit.

**Key design decisions:**
- Slug-based, not date-based — republishing old content with a new slug shows it as "new"
- Error handling: try-catch silently skips if localStorage is unavailable
- Badge placement: inserted before `[EN|PL]` badge if present, otherwise appended

**Files:** `src/pages/blog/index.astro` (lines 132-189)

---

## Cookie Consent & GA4 Analytics

Privacy-first analytics using Google Analytics 4 with Advanced Consent Mode.

**How GA4 loads:**
- GA4 script (`gtag.js`) loads immediately on every page
- All consent categories default to `denied` (analytics, ads, user data, personalization)
- In denied state, GA4 sends cookieless aggregate pings only — no cookies set, no user-level tracking
- If `localStorage` key `cookie-consent` is `'accepted'`, consent is upgraded to `granted` on page load

**Consent flow:**
1. **First visit:** Full-width banner at bottom with `[accept]` / `[decline]`
2. **After choice:** Banner disappears permanently. Choice stored in `cookie-consent` localStorage key.
3. **Persistent cookie icon:** Always visible bottom-left (36px amber button). Click to open preferences panel.
4. **Preferences panel:** Shows current status (`accepted` / `declined` / `not set`), allows changing consent at any time

**On accept:** `gtag('consent', 'update', { 'analytics_storage': 'granted' })` — GA4 begins full tracking with cookies
**On decline:** `gtag('consent', 'update', { 'analytics_storage': 'denied' })` — cookieless pings only

**GA4 Measurement ID:** `G-TN2YY0219L`

**Files:** `src/components/BaseHead.astro`

---

## Theme Toggle (Dark/Light + Easter Egg)

Dark mode is default. Light mode requires a 5-click easter egg to activate.

**Normal behavior:**
- Button shows `[DARK]` in dark mode, `[LITE]` in light mode
- Single click in light mode switches back to dark immediately
- Theme stored in `localStorage` key `theme`
- Flash prevention: inline script in `<head>` applies `.light` class before page renders

**5-click easter egg (dark mode only):**
- Click counter resets if 3 seconds pass between clicks
- Click 1: `[WARN] light mode is for losers` (amber glow, 3s fade)
- Clicks 2-4: `You are X steps away from being a loser`
- Click 5: switches to light mode, shows `[LITE] told you`
- Warning messages animate with scale effect (0.6 → 1.1 → 1)

**CSS variables:**
- Dark: `--bg: #0a0e14`, neon accents (cyan, green, amber, magenta), glow shadows
- Light: muted palette, no glow shadows

**Files:** `src/components/ThemeToggle.astro`, `src/styles/global.css`

---

## dogs.txt Easter Egg

A rebellion against the cats.txt standard by Mark Williams-Cook.

**The file:** `/.well-known/dogs.txt` — markdown file featuring:
- Brokuł (Broccoli) the dog, with ASCII art
- risu the squirrel who thinks she's a dog, with braille Unicode art
- Site description, links, AI chatbot instructions ("Good boy. Now sit. Stay.")
- Credit to Mark Williams-Cook and catstxt.org

**Paw button:**
- Small paw print SVG icon, fixed bottom-left next to cookie icon (`left: 3.5em`)
- 30% opacity by default — barely visible
- On hover: full opacity, amber color, amber glow
- Links to `/.well-known/dogs.txt`
- Present on every page (injected via BaseHead.astro)

**Files:** `public/.well-known/dogs.txt`, `src/components/BaseHead.astro`

---

## Changelog Page

Live changelog at `/changelog` that parses `CHANGELOG.md` at build time.

**How parsing works:**
1. `CHANGELOG.md` is imported as raw text during Astro build
2. Lines matching `## YYYY-MM-DD — Title` split the file into sections
3. Each section becomes a collapsible `<details>` element
4. Only the latest entry is open by default

**Content transformation pipeline:**
1. Markdown links `[text](url)` → `<a class="log-link">` (cyan, glow on hover)
2. Backticks `` `code` `` → `<code>` tags
3. `### Heading` → `<div class="log-heading">` (amber, bold, underline)
4. `- **Key** — Value` → structured item with `✦︎` bullet
5. `- **Key**` → item without description
6. `- plain text` → item with bullet only

**Styling notes:**
- Category headings (Published, Added, Fixed, Changed): bold amber with amber underline
- Linked titles: cyan with glow on hover
- Non-linked titles: bold, no special color
- Collapsible arrows: `▸` (closed) / `▾` (open, cyan)
- Uses `:global()` CSS selectors because `set:html` content bypasses Astro's scoped styles

**Files:** `src/pages/changelog.astro`, `CHANGELOG.md`

---

## Tag System & Search

Posts support tags and the blog index has real-time filtering.

**Tags:**
- Defined in frontmatter: `tags: ['life', 'gaming']` (default: `[]`)
- All unique tags extracted and displayed as filter buttons in `[brackets]`
- Active tag: cyan with glow. `[all]` is active by default.

**Search:**
- Text input filters posts in real-time on each keystroke
- Case-insensitive match against title and description
- Combined with tag filter: `matchesSearch && matchesTag`

**Empty state:** Shows "no matching posts found." when no results match

**Divider logic:** ASCII dividers (`· · · · ·`) between posts hide dynamically when adjacent posts are filtered out

**Files:** `src/pages/blog/index.astro`

---

## RSS Feed

Standard RSS 2.0 feed generated at build time.

- **URL:** `/rss.xml`
- **Library:** `@astrojs/rss`
- **Content:** All blog posts with title, description, pubDate, tags, and link
- **Discovery:** `<link rel="alternate">` in `<head>`, `[rss]` link in footer

**Files:** `src/pages/rss.xml.js`

---

## Content Schema

Zod schema defining all available frontmatter fields for blog posts.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | string | yes | — | Post title |
| `description` | string | yes | — | Short summary for previews and SEO |
| `pubDate` | date | yes | — | Publication date (auto-coerced from string) |
| `updatedDate` | date | no | — | Last update date |
| `heroImage` | image | no | — | Astro image asset for hero |
| `tags` | string[] | no | `[]` | Array of tag strings |
| `bilingual` | boolean | no | `false` | Enable bilingual mode |
| `titlePl` | string | no | — | Polish title (if bilingual) |
| `descriptionPl` | string | no | — | Polish description (if bilingual) |

**Files:** `src/content.config.ts`

---

## Design System

Terminal/roguelike aesthetic inspired by Cogmind.

**Typography:** JetBrains Mono (monospace) — Regular 400 and Bold 700, self-hosted WOFF2

**Color palette (dark mode):**
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#0a0e14` | Primary background |
| `--bg-surface` | `#0d1117` | Elevated surfaces |
| `--cyan` | `#00e5ff` | Links, accents |
| `--green` | `#39ff14` | Success, active states |
| `--amber` | `#ffb700` | Warnings, highlights |
| `--magenta` | `#ff2d7b` | Alerts, decline actions |

**Components:** AsciiBox (bordered containers), AsciiDivider (4 variants: line/dots/arrow/eof), TerminalPrompt (`visitor@risu ~ $`), GlyphTag

**Layout:** max-width 720px, responsive breakpoint at 720px (font drops to 14px)

---

## localStorage Keys Reference

| Key | Feature | Values |
|-----|---------|--------|
| `theme` | Theme toggle | `'light'` or absent (dark default) |
| `cookie-consent` | GDPR consent | `'accepted'` / `'declined'` |
| `risu_preferredLang` | Bilingual toggle | `'en'` / `'pl'` |
| `risu_previouslySeen` | New post indicator | JSON array of slugs |
| `risu_currentlySeen` | New post indicator | JSON array of slugs |

---

## Future Improvements

### Channel Breakdown for Analytics

Currently GA4 collects aggregate traffic data. A valuable future addition would be a **channel breakdown dimension** to analyze traffic channel by channel (organic search, direct, social, referral, email, etc.) and track changes over time. This would help understand:

- Which channels drive the most readers
- How channel mix shifts after publishing new content or sharing on social media
- Whether specific post types perform better on certain channels
- Traffic source trends over time (month-over-month channel comparison)

This could be implemented as:
- A custom GA4 exploration report with default channel grouping as a dimension
- A dedicated analytics dashboard page on the site (similar to the changelog page)
- Periodic CSV exports from GA4 processed into a static report at build time
