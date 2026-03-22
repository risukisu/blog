# Blog Features Design Spec — Language Toggle, Link Preview, New Post Indicator

> **Project:** risu.pl blog (Astro 5 + Tailwind 4, static site, GitHub Pages)
> **Date:** 2026-03-23
> **Status:** Draft

---

## Feature 1: Language Toggle (EN/PL)

### Problem

Some blog posts are written about topics specific to Poland and should be available in both English and Polish. The user doesn't want separate URLs or separate blog entries — one post, one URL, seamless in-page switching.

### Content Model

Bilingual posts use a **single `.mdx` file** with both language versions inline.

**Frontmatter additions:**

```yaml
---
title: 'Gambleriada and the story of a mug'
titlePl: 'Gambleriada i historia pewnego kubka'
description: 'A memory from Gambleriada 1998...'
descriptionPl: 'Wspomnienie z Gambleriady 1998...'
pubDate: 'Dec 19 2013'
tags: ['gaming', 'nostalgia']
bilingual: true
---
```

- `bilingual: true` — signals this post has a PL version (drives index badge + toggle visibility)
- `titlePl` / `descriptionPl` — Polish variants of title and description
- Posts without `bilingual: true` render exactly as they do today (no toggle, no changes)

**Content structure inside the MDX file:**

```mdx
<div data-lang="en">

English content here. Standard markdown works inside the div.

</div>

<div data-lang="pl">

Polish content here.

</div>
```

Both blocks are rendered into the HTML. Client-side JS shows one and hides the other.

**Authoring rule:** Blank lines are required after the opening `<div>` and before the closing `</div>` — this is how MDX distinguishes HTML wrappers from markdown content. Without blank lines, markdown inside the div renders as raw text.

**Schema update** (`content.config.ts`):

Add optional fields to the blog collection schema:

```ts
bilingual: z.boolean().optional().default(false),
titlePl: z.string().optional(),
descriptionPl: z.string().optional(),
```

### Toggle UI — Blog Post Page

**Position:** Same line as the date and tags, after tags. Part of the post metadata row.

**Appearance:** `[EN | PL]` rendered in amber (`var(--amber)`, `#ffb700`).
- Active language: bright amber
- Inactive language: muted amber (~40% opacity)
- Separator `|` in muted amber
- Cursor: pointer on the inactive option

**Behavior:**
- Default: EN (or reads from `localStorage` key `risu_preferredLang` if previously set)
- Click toggles between EN/PL
- Saves preference to `localStorage` as `risu_preferredLang` — persists across posts and visits
- On toggle:
  - `data-lang="en"` divs show/hide
  - `data-lang="pl"` divs show/hide (inverse)
  - Title swaps: two `<span>` elements inside the AsciiBox (`data-title-en` and `data-title-pl`), toggle shows/hides them. Both are server-rendered by BlogPost.astro using the `title` and `titlePl` props.
  - Date swaps: two `<time>` elements rendered side by side (`data-date-en` formatted with `en-us` locale, `data-date-pl` with `pl-PL`). Toggle shows/hides. Both are server-rendered at build time — no client-side date formatting needed.
- No URL change, no page reload
- Toggle only appears on posts where `bilingual: true`

**Prop passing:** `[...slug].astro` must pass `bilingual`, `titlePl`, and `descriptionPl` from `post.data` through to the `BlogPost` layout. The BlogPost layout's Props type must be updated to accept these three new optional fields.

**Toggle placement:** The toggle sits inside the post metadata area in `BlogPost.astro`, on the same line as the tags `<div>`. It is placed after the tags list, right-aligned within the metadata row using flex layout (`justify-content: space-between` on the tags row, tags on left, toggle on right). If no tags exist, toggle floats right alone.

**HTML structure (in BlogPost.astro layout):**

```html
<!-- Metadata row — tags + lang toggle -->
<div class="post-meta-row" style="display:flex; justify-content:space-between; align-items:center;">
  <div class="post-tags">
    {tags.map(tag => <span>[{tag}]</span>)}
  </div>
  {bilingual && (
    <span class="lang-toggle">
      <span class="lang-option active" data-lang-btn="en">EN</span>
      <span class="lang-sep">|</span>
      <span class="lang-option" data-lang-btn="pl">PL</span>
    </span>
  )}
</div>
```

### Blog Index Indicator

**Position:** Next to the post title on `risu.pl/blog`.

**Appearance:** Small amber `[PL]` text, same amber color as the toggle. Sits after the post title, before any other metadata.

**Behavior:** Static indicator, not clickable. Driven by `bilingual: true` in frontmatter.

**Implementation:** In the blog index template, check `post.data.bilingual` and conditionally render the badge.

### Migration

The existing Gambleriada drafts (`gambleriada-en.md` and `gambleriada-pl.md`) need to be:
1. Merged into a single `gambleriada.mdx` file
2. Content wrapped in `<div data-lang="en">` / `<div data-lang="pl">` blocks
3. Frontmatter updated with `bilingual: true`, `titlePl`, `descriptionPl`
4. Moved from `content/drafts/` to `content/blog/`

---

## Feature 2: Link Preview on Hover

### Problem

Blog posts reference obscure topics (Polish gaming magazines, niche cultural references). Readers benefit from a quick definition/context on hover without leaving the page.

### Authoring

Uses standard markdown **title attribute** syntax:

```md
[Gambler](https://en.wikipedia.org/wiki/Gambler_(magazine) "Polish video game magazine published 1993-2002, one of the first gaming publications in Poland.")
```

This renders as `<a href="..." title="...">`. No MDX component needed, posts can stay as `.md` files.

Links without a `title` attribute behave normally — no tooltip, just the existing cyan glow on hover.

### Tooltip Card

**Trigger:** Mouse hover on any `<a>` tag that has a `title` attribute within `.prose` content area.

**Appearance:**
- Background: `var(--bg-elevated)` (dark card)
- Border: 1px solid `var(--amber)` (`#ffb700`)
- Text color: `var(--amber)` for the preview text
- Domain line: muted amber (~50% opacity), smaller font, shows extracted domain (e.g. `wikipedia.org`)
- Border radius: 4px
- Padding: 8px 12px
- Max-width: 320px
- Font: JetBrains Mono (inherits), smaller size (~0.85em)
- Subtle amber glow on the border: `box-shadow: 0 0 6px rgba(255, 183, 0, 0.15)`

**Positioning:**
- Appears below the link by default (8px gap)
- Flips above if the tooltip would extend within 40px of the viewport bottom
- Horizontally centered on the link, clamped to 8px from viewport edges
- Small CSS triangle arrow (6px, `border` trick) pointing to the link, colored amber to match the border

**Animation:**
- Fade in on hover (150ms delay before showing, to avoid flicker on casual mouse movement)
- Fade out on mouse leave (100ms)

**Behavior:**
- Replaces the browser's native `title` tooltip (remove `title` attr on hover, restore on leave, or use a custom data attribute)
- Link remains fully clickable
- Tooltip dismisses on click (user is navigating away)

### External Links

**All external links** (href starts with `http` and doesn't match `risu.pl`) automatically get:
- `target="_blank"`
- `rel="noopener noreferrer"`

This applies regardless of whether the link has a title/preview. Implemented as a `rehype` plugin that runs at build time.

### Implementation Approach

**Option A — rehype plugin (build-time):**
Transform `<a title="...">` into `<a data-preview="..." data-domain="..." title="...">` at build time. The `title` attribute is **kept** for accessibility (JS-disabled fallback shows native browser tooltip). The client-side script hides the native tooltip on hover by temporarily removing `title`, then restoring it on mouse leave.

This is the recommended approach — the heavy lifting (attribute transformation, domain extraction, external link detection) happens at build time. The client script is minimal (position tooltip, show/hide).

---

## Feature 3: New Post Indicator

### Problem

Returning visitors have no way to know which posts are new since their last visit. The blog currently has only 3 posts, but as it grows, this becomes more valuable.

### Mechanism — Slug-Based Tracking with Session Rotation

Uses `localStorage` to track which post slugs a visitor has seen.

**Keys:**
- `risu_previouslySeen` — JSON array of slugs from the previous visit session
- `risu_currentlySeen` — JSON array of slugs from the current/latest visit session

**Algorithm (runs on blog index page load):**

```
previouslySeen = localStorage.get('risu_previouslySeen')
currentlySeen = localStorage.get('risu_currentlySeen')
allSlugs = getAllPostSlugs()

if previouslySeen is null:
    // First visit ever — no badges
    // Seed both keys so the NEXT visit triggers the returning-visitor branch
    localStorage.set('risu_previouslySeen', allSlugs)
    localStorage.set('risu_currentlySeen', allSlugs)
    return  // No badges shown

// Returning visitor
newSlugs = allSlugs.filter(slug => !previouslySeen.includes(slug))
// Mark newSlugs with [NEW] badge

// Rotate: previous = current, current = all current slugs
localStorage.set('risu_previouslySeen', currentlySeen)
localStorage.set('risu_currentlySeen', allSlugs)
```

**Why slug-based, not date-based:** The user republishes old content (e.g., Gambleriada from 2013) on the new blog. Date-based detection would miss it because `pubDate` is in the past. Slug-based detection correctly identifies it as unseen.

**Why session rotation (C approach):** If the timestamp updated on every page load, badges would disappear after one index visit. With rotation, badges persist for the entire visit session. They only clear on the NEXT visit to the blog index.

### Badge UI

**Position:** Next to the post title on `risu.pl/blog`, before the `[PL]` indicator if both apply. Order: `Post Title [NEW] [PL]`

**DOM insertion:** The `[PL]` badge is server-rendered in `PostCard.astro` with a `data-badge-pl` attribute. The `[NEW]` badge is JS-injected. The script inserts the `[NEW]` span **before** the `[PL]` badge element (using `insertBefore` on the `data-badge-pl` element), or appends after the title if no `[PL]` badge exists. Each post card's title container gets a `data-slug` attribute for the script to target.

**Appearance:**
- Solid green background (`var(--green)`, `#39ff14`)
- Dark text (`var(--bg)`, `#0a0e14`)
- Negative letter-spacing (`-0.05em`)
- Small font size (~0.75em)
- Padding: `1px 5px`
- No border-radius (sharp rectangle — terminal aesthetic)

**Animation:** `blink 1s step-end infinite` — matches the terminal cursor blink used throughout the site:
```css
@keyframes blink {
  50% { opacity: 0; }
}
```

**Visibility:** Blog index page only. Not shown on individual post pages.

---

## Color Assignment Summary

| Element | Color | Variable |
|---------|-------|----------|
| Links, tags | Cyan | `var(--cyan)` `#00e5ff` |
| Language toggle, link preview tooltip | Amber | `var(--amber)` `#ffb700` |
| New post badge | Green | `var(--green)` `#39ff14` |

---

## Files Affected

| File | Changes |
|------|---------|
| `content.config.ts` | Add `bilingual`, `titlePl`, `descriptionPl` to schema |
| `src/pages/blog/index.astro` | Add `[NEW]` badge localStorage script |
| `src/pages/blog/[...slug].astro` | Pass `bilingual`, `titlePl`, `descriptionPl` from `post.data` to BlogPost layout |
| `src/layouts/BlogPost.astro` | Add language toggle UI, dual title/date elements, title-swap script, lang-toggle styling. Update Props type. |
| `src/components/PostCard.astro` | Add `[PL]` badge (server-rendered), `data-slug` attribute on title container |
| `src/styles/global.css` | Link preview tooltip styles, new-post badge styles |
| `astro.config.mjs` | Add rehype plugin for external links + link preview transformation |
| `content/blog/gambleriada.mdx` | New: merged bilingual post (from two draft files) |
| `content/drafts/gambleriada-en.md` | Delete (merged into .mdx) |
| `content/drafts/gambleriada-pl.md` | Delete (merged into .mdx) |

---

## Out of Scope

- Full site i18n (navigation, footer, etc. stay English)
- Automatic translation
- Language-specific URL routing (`/pl/blog/...`)
- Server-side language detection
- Link preview for internal links
- Analytics on language preference or new-post badge clicks
