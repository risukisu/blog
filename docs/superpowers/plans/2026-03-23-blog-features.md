# Blog Features Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three features to risu.pl blog: bilingual language toggle (EN/PL), link preview tooltips on hover, and a new-post indicator for returning visitors.

**Architecture:** All three features are client-side enhancements on a static Astro site. Feature 1 uses MDX with dual content blocks and a client-side toggle. Feature 2 uses a rehype plugin for build-time attribute transformation plus a client-side tooltip script. Feature 3 uses localStorage slug tracking with a client-side badge injection script.

**Tech Stack:** Astro 5.17.1, MDX, rehype (unified/hast), vanilla JS, CSS, localStorage

**Spec:** `docs/superpowers/specs/2026-03-23-blog-features-design.md`

---

## File Structure

```
src/
├── content.config.ts              # MODIFY: add bilingual, titlePl, descriptionPl to schema
├── plugins/
│   └── rehype-links.js            # CREATE: rehype plugin for external links + link preview attrs
├── pages/blog/
│   ├── index.astro                # MODIFY: add [NEW] badge script, pass bilingual to PostCard
│   └── [...slug].astro            # MODIFY: pass bilingual props to BlogPost layout
├── layouts/
│   └── BlogPost.astro             # MODIFY: lang toggle, dual title/date, toggle script
├── components/
│   ├── PostCard.astro             # MODIFY: add [PL] badge, data-slug attr
│   └── FormattedDate.astro        # NO CHANGE (use directly in BlogPost for dual dates)
├── styles/
│   └── global.css                 # MODIFY: tooltip styles, badge styles, lang-toggle styles
└── astro.config.mjs               # MODIFY: add rehype plugin
content/
├── blog/
│   └── gambleriada.mdx            # CREATE: merged bilingual post
└── drafts/
    ├── gambleriada-en.md           # DELETE after merge
    └── gambleriada-pl.md           # DELETE after merge
```

---

## Chunk 1: Foundation — Schema + Rehype Plugin

### Task 1: Update Content Collection Schema

Add the bilingual fields to the blog collection schema so Astro validates them.

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Add bilingual fields to schema**

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ base: './content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			tags: z.array(z.string()).default([]),
			bilingual: z.boolean().optional().default(false),
			titlePl: z.string().optional(),
			descriptionPl: z.string().optional(),
		}),
});

export const collections = { blog };
```

- [ ] **Step 2: Verify build still works**

Run: `cd D:/Claude/projects/blog && npx astro build 2>&1 | tail -5`
Expected: Build succeeds (new fields are optional, existing posts unaffected)

- [ ] **Step 3: Commit**

```bash
cd D:/Claude/projects/blog
git add src/content.config.ts
git commit -m "feat: add bilingual schema fields to blog collection"
```

---

### Task 2: Create Rehype Plugin for External Links + Link Previews

A build-time rehype plugin that:
1. Adds `target="_blank"` and `rel="noopener noreferrer"` to all external links
2. Copies `title` attribute to `data-preview` and extracts domain to `data-domain`

**Files:**
- Create: `src/plugins/rehype-links.js`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Create the rehype plugin**

```js
// src/plugins/rehype-links.js
import { visit } from 'unist-util-visit';

/**
 * Rehype plugin that enhances links:
 * 1. External links get target="_blank" + rel="noopener noreferrer"
 * 2. Links with title get data-preview + data-domain attributes
 */
export function rehypeLinks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;

      const href = node.properties?.href;
      if (!href || typeof href !== 'string') return;

      // External link detection
      const isExternal = href.startsWith('http') && !href.includes('risu.pl');
      if (isExternal) {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener noreferrer';
      }

      // Link preview: copy title to data-preview, extract domain
      const title = node.properties?.title;
      if (title && typeof title === 'string') {
        node.properties.dataPreview = title;
        try {
          const domain = new URL(href).hostname.replace(/^www\./, '');
          node.properties.dataDomain = domain;
        } catch {
          // Invalid URL — skip domain extraction
        }
        // Keep title for JS-disabled fallback (native tooltip)
      }
    });
  };
}
```

- [ ] **Step 2: Install unist-util-visit dependency**

Run: `cd D:/Claude/projects/blog && npm install unist-util-visit`

- [ ] **Step 3: Register the plugin in Astro config**

```js
// astro.config.mjs
// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { rehypeLinks } from './src/plugins/rehype-links.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://risu.pl',
  integrations: [mdx(), sitemap()],

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
    rehypePlugins: [rehypeLinks],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 4: Verify build works with plugin**

Run: `cd D:/Claude/projects/blog && npx astro build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
cd D:/Claude/projects/blog
git add src/plugins/rehype-links.js astro.config.mjs package.json package-lock.json
git commit -m "feat: add rehype plugin for external links and link preview attrs"
```

---

## Chunk 2: Feature 2 — Link Preview Tooltip

### Task 3: Add Link Preview Tooltip Styles + Script

Client-side tooltip that shows on hover over links with `data-preview` attributes.

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/layouts/BlogPost.astro`

- [ ] **Step 1: Add tooltip CSS to global.css**

Append to `src/styles/global.css`:

```css
/* ── Link Preview Tooltip ──────────────────────────────────── */
.link-preview-tooltip {
  position: absolute;
  z-index: 100;
  background: var(--bg-elevated);
  border: 1px solid var(--amber);
  box-shadow: 0 0 6px rgba(255, 183, 0, 0.15);
  border-radius: 4px;
  padding: 8px 12px;
  max-width: 320px;
  font-size: 0.85em;
  line-height: 1.4;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s ease;
}
.link-preview-tooltip.visible {
  opacity: 1;
}
.link-preview-tooltip .preview-text {
  color: var(--amber);
}
.link-preview-tooltip .preview-domain {
  color: var(--amber);
  opacity: 0.5;
  font-size: 0.85em;
  margin-top: 4px;
}
.link-preview-tooltip .preview-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
}
.link-preview-tooltip .preview-arrow.arrow-top {
  top: -6px;
  border-bottom: 6px solid var(--amber);
}
.link-preview-tooltip .preview-arrow.arrow-bottom {
  bottom: -6px;
  border-top: 6px solid var(--amber);
}
```

- [ ] **Step 2: Add tooltip script to BlogPost.astro**

Add this `<script is:inline>` block at the end of `BlogPost.astro`, before `</html>`:

```html
<script is:inline>
(function() {
  // Link Preview Tooltip
  const prose = document.querySelector('.prose');
  if (!prose) return;

  let tooltip = null;
  let showTimeout = null;

  function createTooltip() {
    const el = document.createElement('div');
    el.className = 'link-preview-tooltip';
    el.innerHTML = '<div class="preview-arrow"></div><div class="preview-text"></div><div class="preview-domain"></div>';
    document.body.appendChild(el);
    return el;
  }

  function positionTooltip(link) {
    const rect = link.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    const arrow = tooltip.querySelector('.preview-arrow');
    const gap = 8;
    const flipThreshold = 40;

    // Flip above if near bottom
    const below = rect.bottom + gap + tipRect.height;
    const flipAbove = below > window.innerHeight - flipThreshold;

    let top, arrowClass;
    if (flipAbove) {
      top = rect.top + window.scrollY - tipRect.height - gap;
      arrowClass = 'preview-arrow arrow-bottom';
    } else {
      top = rect.bottom + window.scrollY + gap;
      arrowClass = 'preview-arrow arrow-top';
    }

    // Horizontal centering, clamped to viewport
    let left = rect.left + window.scrollX + rect.width / 2 - tipRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';

    arrow.className = arrowClass;
    const arrowLeft = rect.left + window.scrollX + rect.width / 2 - left - 6;
    arrow.style.left = Math.max(8, Math.min(arrowLeft, tipRect.width - 20)) + 'px';
  }

  prose.addEventListener('mouseover', function(e) {
    const link = e.target.closest('a[data-preview]');
    if (!link) return;

    clearTimeout(showTimeout);
    showTimeout = setTimeout(function() {
      if (!tooltip) tooltip = createTooltip();

      tooltip.querySelector('.preview-text').textContent = link.dataset.preview;
      tooltip.querySelector('.preview-domain').textContent = link.dataset.domain || '';

      // Temporarily remove title to prevent native tooltip
      link._origTitle = link.getAttribute('title');
      link.removeAttribute('title');

      // Position: make visible off-screen first to measure
      tooltip.style.top = '-9999px';
      tooltip.style.left = '-9999px';
      tooltip.classList.add('visible');

      requestAnimationFrame(function() {
        positionTooltip(link);
      });
    }, 150);
  });

  prose.addEventListener('mouseout', function(e) {
    const link = e.target.closest('a[data-preview]');
    if (!link) return;

    clearTimeout(showTimeout);
    if (tooltip) tooltip.classList.remove('visible');

    // Restore title
    if (link._origTitle) {
      link.setAttribute('title', link._origTitle);
      delete link._origTitle;
    }
  });

  prose.addEventListener('click', function(e) {
    if (tooltip) tooltip.classList.remove('visible');
  });
})();
</script>
```

- [ ] **Step 3: Test with a post that has a title attribute link**

Add a temporary link with title to an existing post (e.g. `the-four.md`) and run the dev server:

Run: `cd D:/Claude/projects/blog && npx astro dev`

Verify: hover over the annotated link → amber tooltip appears below with preview text and domain.

- [ ] **Step 4: Remove test link, commit**

```bash
cd D:/Claude/projects/blog
git add src/styles/global.css src/layouts/BlogPost.astro
git commit -m "feat: add link preview tooltip on hover for annotated links"
```

---

## Chunk 3: Feature 1 — Language Toggle

### Task 4: Update PostCard with [PL] Badge and data-slug

Add the `[PL]` indicator badge and slug attribute to PostCard for the index page.

**Files:**
- Modify: `src/components/PostCard.astro`

- [ ] **Step 1: Add bilingual prop and [PL] badge to PostCard**

```astro
---
import FormattedDate from './FormattedDate.astro';

interface Props {
	title: string;
	date: Date;
	description: string;
	tags?: string[];
	href: string;
	variant?: 'compact' | 'full';
	bilingual?: boolean;
	slug?: string;
}

const { title, date, description, tags = [], href, variant = 'full', bilingual = false, slug = '' } = Astro.props;
---

<a href={href} class:list={["post-card", variant]} data-slug={slug}>
	<div class="post-header">
		<span class="post-title">
			{title}
			{bilingual && <span class="badge-pl" data-badge-pl>[PL]</span>}
		</span>
		<span class="post-date"><FormattedDate date={date} /></span>
	</div>
	{variant === 'full' && (
		<p class="post-description">{description}</p>
	)}
	{tags.length > 0 && (
		<div class="post-tags">
			{tags.map(tag => <span class="tag">[{tag}]</span>)}
		</div>
	)}
</a>
```

Add to the `<style>` block in PostCard.astro:

```css
.badge-pl {
	color: var(--amber);
	font-size: 0.75em;
	font-weight: 400;
	margin-left: 0.5em;
}
```

- [ ] **Step 2: Pass bilingual and slug from blog index**

In `src/pages/blog/index.astro`, update the PostCard usage inside the posts loop:

```astro
<PostCard
	title={post.data.title}
	date={post.data.pubDate}
	description={post.data.description}
	tags={post.data.tags}
	href={`/blog/${post.id}/`}
	variant="full"
	bilingual={post.data.bilingual}
	slug={post.id}
/>
```

- [ ] **Step 3: Verify build**

Run: `cd D:/Claude/projects/blog && npx astro build 2>&1 | tail -5`
Expected: Build succeeds (no bilingual posts yet, so no badges render — but no errors)

- [ ] **Step 4: Commit**

```bash
cd D:/Claude/projects/blog
git add src/components/PostCard.astro src/pages/blog/index.astro
git commit -m "feat: add [PL] badge and data-slug to PostCard"
```

---

### Task 5: Add Language Toggle to BlogPost Layout

Add the EN/PL toggle UI, dual title/date elements, and the toggle script.

**Files:**
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/layouts/BlogPost.astro`

- [ ] **Step 1: Pass bilingual props from slug page to layout**

Replace the full contents of `src/pages/blog/[...slug].astro`:

```astro
---
import { type CollectionEntry, getCollection, render } from 'astro:content';
import BlogPost from '../../layouts/BlogPost.astro';

export async function getStaticPaths() {
	const posts = await getCollection('blog');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: post,
	}));
}
type Props = CollectionEntry<'blog'>;

const post = Astro.props;
const { Content } = await render(post);
---

<BlogPost
	title={post.data.title}
	description={post.data.description}
	pubDate={post.data.pubDate}
	updatedDate={post.data.updatedDate}
	heroImage={post.data.heroImage}
	tags={post.data.tags}
	bilingual={post.data.bilingual}
	titlePl={post.data.titlePl}
	descriptionPl={post.data.descriptionPl}
>
	<Content />
</BlogPost>
```

- [ ] **Step 2: Update BlogPost layout with toggle UI and dual elements**

Replace the full contents of `src/layouts/BlogPost.astro`:

```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import BaseHead from '../components/BaseHead.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import FormattedDate from '../components/FormattedDate.astro';
import AsciiBox from '../components/AsciiBox.astro';
import AsciiDivider from '../components/AsciiDivider.astro';

type Props = CollectionEntry<'blog'>['data'] & {
	bilingual?: boolean;
	titlePl?: string;
	descriptionPl?: string;
};

const {
	title,
	description,
	pubDate,
	updatedDate,
	heroImage,
	tags = [],
	bilingual = false,
	titlePl,
	descriptionPl,
} = Astro.props;
---

<html lang="en">
	<head>
		<BaseHead title={title} description={description} />
	</head>

	<body>
		<Header />
		<main>
			<article>
				<AsciiBox title={bilingual ? undefined : title}>
					{bilingual && (
						<div class="bilingual-title">
							<span data-title-en class="title-variant active">{title}</span>
							<span data-title-pl class="title-variant" style="display:none;">{titlePl}</span>
						</div>
					)}
					<div class="post-meta">
						<span data-date-en>
							<FormattedDate date={pubDate} />
						</span>
						{bilingual && (
							<span data-date-pl style="display:none;">
								<time datetime={pubDate.toISOString()}>
									{pubDate.toLocaleDateString('pl-PL', { year: 'numeric', month: 'short', day: 'numeric' })}
								</time>
							</span>
						)}
						{updatedDate && (
							<span class="updated"> · updated <FormattedDate date={updatedDate} /></span>
						)}
					</div>
					<div class="post-meta-row">
						{tags.length > 0 && (
							<div class="post-tags">
								{tags.map(tag => <span class="tag">[{tag}]</span>)}
							</div>
						)}
						{bilingual && (
							<span class="lang-toggle">
								<span class="lang-option active" data-lang-btn="en">EN</span>
								<span class="lang-sep">|</span>
								<span class="lang-option" data-lang-btn="pl">PL</span>
							</span>
						)}
					</div>
				</AsciiBox>

				{heroImage && (
					<div class="hero-image">
						<Image width={1020} height={510} src={heroImage} alt="" />
					</div>
				)}

				<div class="prose">
					<slot />
				</div>

				<AsciiDivider variant="eof" />
			</article>
		</main>
		<Footer />

		{bilingual && (
			<script is:inline>
			(function() {
				const KEY = 'risu_preferredLang';
				let lang = localStorage.getItem(KEY) || 'en';

				function setLang(newLang) {
					lang = newLang;
					localStorage.setItem(KEY, lang);

					// Toggle content blocks
					document.querySelectorAll('[data-lang]').forEach(function(el) {
						el.style.display = el.dataset.lang === lang ? '' : 'none';
					});

					// Toggle titles
					var titleEn = document.querySelector('[data-title-en]');
					var titlePl = document.querySelector('[data-title-pl]');
					if (titleEn) titleEn.style.display = lang === 'en' ? '' : 'none';
					if (titlePl) titlePl.style.display = lang === 'pl' ? '' : 'none';

					// Toggle dates
					var dateEn = document.querySelector('[data-date-en]');
					var datePl = document.querySelector('[data-date-pl]');
					if (dateEn) dateEn.style.display = lang === 'en' ? '' : 'none';
					if (datePl) datePl.style.display = lang === 'pl' ? '' : 'none';

					// Toggle button active states
					document.querySelectorAll('[data-lang-btn]').forEach(function(btn) {
						btn.classList.toggle('active', btn.dataset.langBtn === lang);
					});
				}

				// Init
				setLang(lang);

				// Click handlers
				document.querySelectorAll('[data-lang-btn]').forEach(function(btn) {
					btn.addEventListener('click', function() {
						setLang(btn.dataset.langBtn);
					});
				});
			})();
			</script>
		)}

		<script is:inline>
		(function() {
			// Link Preview Tooltip (runs on all blog posts)
			var prose = document.querySelector('.prose');
			if (!prose) return;

			var tooltip = null;
			var showTimeout = null;

			function createTooltip() {
				var el = document.createElement('div');
				el.className = 'link-preview-tooltip';
				el.innerHTML = '<div class="preview-arrow"></div><div class="preview-text"></div><div class="preview-domain"></div>';
				document.body.appendChild(el);
				return el;
			}

			function positionTooltip(link) {
				var rect = link.getBoundingClientRect();
				var tipRect = tooltip.getBoundingClientRect();
				var arrow = tooltip.querySelector('.preview-arrow');
				var gap = 8;

				var below = rect.bottom + gap + tipRect.height;
				var flipAbove = below > window.innerHeight - 40;

				var top, arrowClass;
				if (flipAbove) {
					top = rect.top + window.scrollY - tipRect.height - gap;
					arrowClass = 'preview-arrow arrow-bottom';
				} else {
					top = rect.bottom + window.scrollY + gap;
					arrowClass = 'preview-arrow arrow-top';
				}

				var left = rect.left + window.scrollX + rect.width / 2 - tipRect.width / 2;
				left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));

				tooltip.style.top = top + 'px';
				tooltip.style.left = left + 'px';
				arrow.className = arrowClass;
				var arrowLeft = rect.left + window.scrollX + rect.width / 2 - left - 6;
				arrow.style.left = Math.max(8, Math.min(arrowLeft, tipRect.width - 20)) + 'px';
			}

			prose.addEventListener('mouseover', function(e) {
				var link = e.target.closest('a[data-preview]');
				if (!link) return;
				clearTimeout(showTimeout);
				showTimeout = setTimeout(function() {
					if (!tooltip) tooltip = createTooltip();
					tooltip.querySelector('.preview-text').textContent = link.dataset.preview;
					tooltip.querySelector('.preview-domain').textContent = link.dataset.domain || '';
					link._origTitle = link.getAttribute('title');
					link.removeAttribute('title');
					tooltip.style.top = '-9999px';
					tooltip.style.left = '-9999px';
					tooltip.classList.add('visible');
					requestAnimationFrame(function() { positionTooltip(link); });
				}, 150);
			});

			prose.addEventListener('mouseout', function(e) {
				var link = e.target.closest('a[data-preview]');
				if (!link) return;
				clearTimeout(showTimeout);
				if (tooltip) tooltip.classList.remove('visible');
				if (link._origTitle) {
					link.setAttribute('title', link._origTitle);
					delete link._origTitle;
				}
			});

			prose.addEventListener('click', function() {
				if (tooltip) tooltip.classList.remove('visible');
			});
		})();
		</script>
	</body>
</html>

<style>
	main {
		width: 800px;
		max-width: calc(100% - 2em);
		margin: 0 auto;
		padding: 3em 1em;
	}
	.post-meta {
		color: var(--text-muted);
		font-size: 0.85em;
	}
	.updated {
		font-style: italic;
	}
	.post-meta-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.3em;
	}
	.post-tags {
		display: flex;
		gap: 0.5em;
		flex-wrap: wrap;
	}
	.tag {
		font-size: 0.8em;
		color: var(--text-muted);
	}
	.hero-image {
		margin: 1.5em 0;
	}
	.hero-image img {
		width: 100%;
		border-radius: 2px;
		border: 1px solid var(--border);
	}
	.prose {
		margin-top: 1.5em;
		line-height: 1.8;
	}
	/* ── Language Toggle ── */
	.bilingual-title {
		font-weight: 700;
		color: var(--cyan);
		font-size: 1em;
	}
	.lang-toggle {
		font-size: 0.8em;
		flex-shrink: 0;
	}
	.lang-option {
		color: var(--amber);
		opacity: 0.4;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.lang-option.active {
		opacity: 1;
		cursor: default;
	}
	.lang-option:hover:not(.active) {
		opacity: 0.7;
	}
	.lang-sep {
		color: var(--amber);
		opacity: 0.4;
		margin: 0 0.2em;
	}
</style>
```

Note: The tooltip script from Task 3 is now integrated directly into BlogPost.astro alongside the lang toggle script. Remove the separate tooltip script added in Task 3 — this combined version replaces it.

- [ ] **Step 3: Verify build**

Run: `cd D:/Claude/projects/blog && npx astro build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
cd D:/Claude/projects/blog
git add src/pages/blog/[...slug].astro src/layouts/BlogPost.astro
git commit -m "feat: add language toggle to blog post layout"
```

---

### Task 6: Merge Gambleriada Drafts into Bilingual MDX Post

Create the merged bilingual post and delete the separate drafts.

**Files:**
- Create: `content/blog/gambleriada.mdx`
- Delete: `content/drafts/gambleriada-en.md`
- Delete: `content/drafts/gambleriada-pl.md`

- [ ] **Step 1: Create the merged MDX file**

Create `content/blog/gambleriada.mdx` with this structure:

```mdx
---
title: 'Gambleriada and the story of a mug'
titlePl: 'Gambleriada i historia pewnego kubka'
description: 'A memory from Gambleriada 1998 — about a mug, a book, an autograph and a security guard.'
descriptionPl: 'Wspomnienie z Gambleriady w 1998 roku — o kubku, książce, autografie i ochroniarzu.'
pubDate: 'Dec 19 2013'
tags: ['gaming', 'nostalgia']
bilingual: true
---

<div data-lang="en">

*Author's note: I wrote this blog post over 12 years ago, and aside from a small addition, it's unchanged. A memory from years past ;)*

[... full English content from gambleriada-en.md, lines 9-36 ...]

</div>

<div data-lang="pl">

*Notka od autora: ten blogpost napisałem ponad 12 lat temu, i poza małym uzupełnieniem, jest w stanie niezmienionym. Wspomnienie dawnych lat ;)*

[... full Polish content from gambleriada-pl.md, lines 9-36 ...]

</div>
```

Copy the full body content from each draft file into the respective `data-lang` div. Ensure blank lines after opening `<div>` and before closing `</div>`.

- [ ] **Step 2: Delete the draft files**

```bash
rm content/drafts/gambleriada-en.md content/drafts/gambleriada-pl.md
```

- [ ] **Step 3: Verify build and test**

Run: `cd D:/Claude/projects/blog && npx astro build 2>&1 | tail -5`
Expected: Build succeeds, gambleriada post appears in output

Run dev server and verify:
- Navigate to `/blog/` — Gambleriada appears with `[PL]` badge
- Navigate to `/blog/gambleriada/` — post renders, EN/PL toggle visible
- Click PL → content switches to Polish, title switches, date format switches
- Click EN → switches back
- Refresh page → language preference persists

- [ ] **Step 4: Commit**

```bash
cd D:/Claude/projects/blog
git add content/blog/gambleriada.mdx
git rm content/drafts/gambleriada-en.md content/drafts/gambleriada-pl.md
git commit -m "feat: publish Gambleriada as bilingual EN/PL post"
```

---

## Chunk 4: Feature 3 — New Post Indicator

### Task 7: Add New Post Badge Script to Blog Index

Slug-based localStorage tracking with session rotation.

**Files:**
- Modify: `src/pages/blog/index.astro`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add new-post badge CSS to global.css**

Append to `src/styles/global.css`:

```css
/* ── New Post Badge ──────────────────────────────────────── */
.badge-new {
  display: inline-block;
  background: var(--green);
  color: var(--bg);
  font-size: 0.75em;
  font-weight: 700;
  letter-spacing: -0.05em;
  padding: 1px 5px;
  margin-left: 0.5em;
  vertical-align: middle;
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}
```

- [ ] **Step 2: Add localStorage script to blog index**

Add this `<script is:inline>` block at the end of `src/pages/blog/index.astro`, after the existing filter script and before `</html>`:

```html
<script is:inline>
(function() {
  var PREV_KEY = 'risu_previouslySeen';
  var CURR_KEY = 'risu_currentlySeen';

  try {
    var postItems = document.querySelectorAll('.post-item .post-card[data-slug]');
    var allSlugs = [];
    postItems.forEach(function(card) {
      if (card.dataset.slug) allSlugs.push(card.dataset.slug);
    });

    var previousRaw = localStorage.getItem(PREV_KEY);
    var currentRaw = localStorage.getItem(CURR_KEY);

    if (previousRaw === null) {
      // First visit — seed both, no badges
      localStorage.setItem(PREV_KEY, JSON.stringify(allSlugs));
      localStorage.setItem(CURR_KEY, JSON.stringify(allSlugs));
      return;
    }

    var previouslySeen = JSON.parse(previousRaw) || [];
    var currentlySeen = currentRaw ? JSON.parse(currentRaw) : allSlugs;

    // Find new slugs
    var newSlugs = allSlugs.filter(function(slug) {
      return previouslySeen.indexOf(slug) === -1;
    });

    // Inject [NEW] badges
    newSlugs.forEach(function(slug) {
      var card = document.querySelector('.post-card[data-slug="' + slug + '"]');
      if (!card) return;
      var titleSpan = card.querySelector('.post-title');
      if (!titleSpan) return;

      var badge = document.createElement('span');
      badge.className = 'badge-new';
      badge.textContent = 'new';

      // Insert before [PL] badge if it exists, otherwise append
      var plBadge = titleSpan.querySelector('[data-badge-pl]');
      if (plBadge) {
        titleSpan.insertBefore(badge, plBadge);
      } else {
        titleSpan.appendChild(badge);
      }
    });

    // Rotate
    localStorage.setItem(PREV_KEY, JSON.stringify(currentlySeen));
    localStorage.setItem(CURR_KEY, JSON.stringify(allSlugs));
  } catch(e) {
    // localStorage unavailable — silently skip
  }
})();
</script>
```

- [ ] **Step 3: Verify build**

Run: `cd D:/Claude/projects/blog && npx astro build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Test the badge behavior**

Run dev server. Open `/blog/` in browser:
1. First visit: no badges appear (open DevTools → Application → localStorage → verify `risu_previouslySeen` and `risu_currentlySeen` are set)
2. Clear `risu_previouslySeen` from localStorage, set it to `["the-four","random-messages"]` (missing `nostalgia-is-a-hell-of-a-drug`)
3. Refresh page → `nostalgia-is-a-hell-of-a-drug` should show blinking green `[new]` badge

- [ ] **Step 5: Commit**

```bash
cd D:/Claude/projects/blog
git add src/styles/global.css src/pages/blog/index.astro
git commit -m "feat: add blinking [new] badge for unseen posts on blog index"
```

---

## Chunk 5: Final Integration + Polish

### Task 8: Integration Test and Final Cleanup

Verify all three features work together end-to-end.

**Files:** No new files — verification only.

- [ ] **Step 1: Full build**

Run: `cd D:/Claude/projects/blog && npx astro build 2>&1 | tail -10`
Expected: Clean build, no warnings

- [ ] **Step 2: Test Feature 1 (Language Toggle)**

Run dev server, navigate to `/blog/gambleriada/`:
- EN/PL toggle visible in amber, after tags
- Click PL → content, title, date switch to Polish
- Click EN → switches back
- Refresh → preference persists
- Navigate to `/blog/the-four/` → no toggle (not bilingual)
- Navigate to `/blog/` → Gambleriada shows `[PL]` badge in amber

- [ ] **Step 3: Test Feature 2 (Link Preview)**

On any post with a title-attributed link:
- Hover → amber-bordered tooltip appears after 150ms
- Shows preview text + domain
- Mouse away → tooltip fades
- Click link → opens in new tab (external links)
- With JS disabled → native browser `title` tooltip shows as fallback

- [ ] **Step 4: Test Feature 3 (New Post Indicator)**

On `/blog/`:
- Clear localStorage `risu_previouslySeen` and `risu_currentlySeen`
- Refresh → first visit, no badges, keys seeded
- Refresh again → returning visitor, no new posts, no badges
- Manually remove one slug from `risu_previouslySeen` in DevTools
- Refresh → that post shows blinking green `[new]` badge
- Badge appears before `[PL]` badge if both present

- [ ] **Step 5: Test all three together**

On `/blog/`:
- Gambleriada should show `[new]` (for first-time visitors after publish) + `[PL]`
- The `[new]` badge blinks, `[PL]` is static amber
- Click into Gambleriada → toggle works, link previews work
- Go back to index → badges still there (session rotation)

- [ ] **Step 6: Commit any final fixes**

```bash
cd D:/Claude/projects/blog
git add -A
git commit -m "fix: integration test cleanup"
```

---

## Summary

| Chunk | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 | Tasks 1-2 | Schema update + rehype plugin (foundation) |
| 2 | Task 3 | Link preview tooltip (Feature 2) |
| 3 | Tasks 4-6 | Language toggle + PostCard badge + Gambleriada post (Feature 1) |
| 4 | Task 7 | New post indicator (Feature 3) |
| 5 | Task 8 | Integration test + final polish |

**Critical path:** Task 1 (schema) → Task 4-6 (need schema for bilingual). Task 2 (rehype) → Task 3 (tooltip needs plugin). Task 7 (new post) is independent of 1-6. Task 8 depends on all.

**Total commits:** 8 (one per task)
