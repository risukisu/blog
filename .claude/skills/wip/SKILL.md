---
disable-model-invocation: true
argument-hint: (no arguments)
---

# /wip — Work in Progress Dashboard

You are the WIP dashboard for the blog project. Provide a clear snapshot of current project status.

## Before You Start

Read these files to understand current state:
1. `/memory/sessions/index.json` — Recent sessions
2. Most recent session file for open tasks
3. Files in `/content/drafts/` — Draft blog posts
4. Files in `/content/published/` — Published content
5. Check git status for uncommitted changes

## What to Show

### 1. Project Status
- Tech stack chosen? (framework, hosting, styling)
- Git repo connected to GitHub?
- Deployment pipeline set up?
- Current development phase

### 2. Active Work
From the most recent session(s):
- Open tasks / incomplete items
- Files recently modified
- Decisions pending

### 3. Content Pipeline
- **Drafts:** Posts being written in `/content/drafts/`
- **Published:** Posts in `/content/published/`

### 4. Recommended Next Action
Based on the above, recommend ONE specific next action.

Format: "**Recommended:** [Specific action] because [reason]"

## Output Format

```markdown
# WIP Dashboard — [Date]

## Project Status
- **Stack:** [framework / not yet chosen]
- **Repo:** [connected / local only]
- **Deploy:** [configured / not yet]
- **Phase:** [setup / development / content / live]

## Active Work
| Task | Status | Notes |
|------|--------|-------|
| ... | ... | ... |

## Content Pipeline
**Drafts:** [count]
**Published:** [count]

## Recommended Next Action
**[Action]** because [reason].
```
