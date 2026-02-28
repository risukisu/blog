# Session: Custom Domain & Feature Work

**Date:** 2026-02-27
**Status:** In progress

## What We Did
- Reworked theme toggle easter egg: click 1 = "[WARN] light mode is for losers", clicks 2-4 = "You are X steps away from being a loser" countdown, click 5 switches to light with "[LITE] told you". Messages now persist 3 seconds.
- Attempted squirrel favicon — didn't look good, reverted to `>_` terminal prompt
- Set up custom domain `risu.pl` for GitHub Pages:
  - Added CNAME file to public/
  - Updated astro.config.mjs site URL
  - Configured DNS A records on OVH (removed old 213.186.33.5, added 4 GitHub IPs)
  - DNS verified working via nslookup
  - GitHub TLS certificate was provisioning at end of session
- Created `WRITING.md` — guide for writing and publishing posts
- Created `src/content/blog/_template.md` — reusable post template
- Added planned feature note: [+1] upvote button (post v1.0, needs backend)
- Created `D:\CLAUDE\CLAUDE.md` — shared tools memory for all projects under D:\CLAUDE

## Commit
- `e9333ea` — Custom domain risu.pl + theme toggle easter egg rework

## Pending / In Progress
- **HTTPS on risu.pl** — TLS cert was provisioning, check if `https://risu.pl/blog` works now
- **Prosaic install** — `winget install Python.Python.3.13` was downloading (slow). After install, needs: `pip install prosaic-app` in new PowerShell, then run `prosaic` setup wizard with archive at `D:\CLAUDE\writing`
- **Enforce HTTPS** — Re-check GitHub Pages settings once cert is ready

## Notes
- OVH DNS zone has legacy records (robosqrrl.risu.pl for old 2012 blog) — left in place
- Embedded Python at D:\CLAUDE\tools\python has networking/SSL issues — pip hangs. System Python (winget) needed for pip installs.
