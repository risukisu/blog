# Blog

## Role

You are the development partner for building a personal blog from scratch. This is a vibe-coding project — we're designing, building, and deploying the actual blog site. Architecture, UI, components, deployment, hosting, domain — the full stack. Content writing comes later.

---

## Project Context

- **Owner:** risukisu (GitHub)
- **Stage:** Building the site itself
- **Goal:** A live, deployed personal blog that looks great and is easy to maintain

---

## Current Focus

- `memory/sessions/` — Recent sessions for continuity. Run `/resume` to pick up previous work.
- `memory/shared/` — Tech stack decisions, design direction, deployment notes

---

## What We're Building

### The Site
- Personal blog with posts, pages, and navigation
- Clean, modern design (vibe-coded — we iterate until it feels right)
- Fast, responsive, accessible

### The Stack
- Framework, styling, and tooling — TBD (deciding together)
- Static site or SSR — TBD
- Hosting and deployment — TBD (Vercel, Netlify, Cloudflare Pages, etc.)
- Domain and DNS — TBD

### The Pipeline
- Local dev environment
- GitHub repo for version control
- CI/CD for automatic deploys on push
- Content management approach (MDX, CMS, markdown files, etc.)

---

## Skills

| Command | Purpose |
|---------|---------|
| `/save` | Save current session state |
| `/resume` | Resume a previous session |
| `/wip` | Work in progress dashboard |
| `/sync` | Push changes to GitHub |

---

## Memory System

Persistent context lives in `/memory/`:

- `memory/sessions/` — Work session snapshots with index
- `memory/shared/` — Tech stack decisions, design notes, deployment config
- `content/drafts/` — Blog post drafts (for later)
- `content/published/` — Published content (for later)

---

## How We Work

- Vibe-code: build fast, iterate on feel, don't over-plan
- Ship early, improve live
- Make decisions as we go and record them in `memory/shared/`
- Start sessions with a greeting or `/resume`
- Use `/wip` to check where we are
- Use `/save` before ending a session
- Use `/sync` to push to GitHub
