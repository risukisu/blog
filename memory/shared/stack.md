# Tech Stack Decisions

**Decided:** 2026-02-22

## Framework
- **Astro** — static site generator built for content sites
- Blog template as starting point
- MDX support for rich content

## Styling
- **Tailwind CSS v4** — utility-first CSS
- Existing Bear Blog base styles in `src/styles/global.css`

## Hosting
- **GitHub Pages** — free, auto-deploys via GitHub Actions
- URL: `https://risukisu.github.io/blog`
- Workflow: `.github/workflows/deploy.yml`

## Content
- Markdown/MDX files in `src/content/blog/`
- Astro content collections for type-safe content

## Tooling
- Node.js 20+
- npm for packages
- Git + GitHub CLI for version control

## Planned Features (post v1.0)
- **[+1] upvote button** — per-post, one vote per user, shared community counts. Needs external backend (Firebase/Supabase/Cloudflare Worker). Maybe later.
