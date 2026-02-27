# Session: Terminal Roguelike Redesign

**Date:** 2026-02-22
**Status:** Complete — deployed

## What We Did
- Full visual redesign: dark CRT terminal aesthetic inspired by Cogmind / rich ASCII roguelike
- Color system: deep blue-black bg (#0a0e14), neon accents (cyan, green, amber, magenta)
- Light mode with `:root.light` variables (muted palette)
- Replaced Atkinson font with JetBrains Mono (monospace throughout)
- Built ASCII component library: AsciiBox, AsciiDivider, TerminalPrompt, GlyphTag, PostCard
- Navigation: `>_` logo, Blog/Me links with `>` active prefix
- Theme toggle: `[DARK]`/`[LITE]` — requires 5 rapid clicks to switch to light (easter egg), shows "[WARN] light mode is for losers" toast on each click
- Home page: braille art squirrel mascot (amber), `$ whoami` intro, 3 recent posts
- Blog listing: `$ ls -la posts/`, search input + tag filter buttons, client-side JS filtering
- Blog post layout: title in AsciiBox, tags, `── EOF ──` ending
- Me page: standalone (not BlogPost layout), bio + links (Substack featured, GitHub)
- Added `tags` field to content schema, tagged all 5 sample posts
- Custom favicon: terminal `>_` glyph
- Shiki `github-dark` code highlighting
- Deleted old about.astro
- Renamed blog to "random memories"

## Commit
- `e637a50` — Redesign blog with terminal/roguelike aesthetic
- Pushed to main, GitHub Actions should deploy to risukisu.github.io/blog
