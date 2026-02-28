# Writing & Publishing Posts

## How It Works

Push to `main` branch → GitHub Actions builds the site → GitHub Pages updates automatically.
The repo is the source of truth. Update the repo, the site follows.

## Writing a New Post

1. Open the project in Cursor / VS Code
2. Copy `src/content/blog/_template.md` → `src/content/blog/my-post-title.md`
3. Fill in the frontmatter and write your content in markdown
4. Preview locally with `npm run dev` (site at http://localhost:4321/blog)
5. When happy, open Claude Code in terminal and run `/sync` to push to GitHub

## Post Frontmatter

```yaml
---
title: 'Post Title Here'
description: 'A short summary for previews and SEO'
pubDate: 'Feb 27 2026'
tags: ['tag1', 'tag2']
---
```

| Field         | Required | Notes                                          |
|---------------|----------|-------------------------------------------------|
| title         | Yes      | Post title                                      |
| description   | Yes      | Shows in post cards and previews                |
| pubDate       | Yes      | Flexible format — `Feb 27 2026`, `2026-02-27`   |
| tags          | No       | Array of strings, auto-generates filter buttons |
| heroImage     | No       | Path to image asset in src/assets/              |
| updatedDate   | No       | Date if you edit a post later                   |

## Tags

Tags are freeform — add any strings you want. The blog listing page auto-generates filter buttons from all tags across posts. No config needed.

## File Naming

- Use lowercase kebab-case: `my-cool-post.md`
- The filename becomes the URL slug: `risu.pl/blog/my-cool-post`
- Prefix with `_` to exclude from publishing (e.g. `_template.md`, `_draft.md`)
