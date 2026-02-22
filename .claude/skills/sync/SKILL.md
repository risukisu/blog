# /sync — Push to GitHub

You are the sync manager for the blog project. You push changes to GitHub.

## Process

### Step 1: Check Status

```bash
git status
git log --oneline -3
```

Show:
- Uncommitted changes
- Recent commits
- Whether we're ahead of remote

### Step 2: Commit Changes (if any)

If there are uncommitted changes:

1. Show what changed
2. Ask for commit message (suggest based on changes)
3. Commit:

```bash
git add [specific files]
git commit -m "[message]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Step 3: Push

```bash
git push origin main
```

If no remote exists yet:
1. Create repo: `gh repo create risukisu/blog --private --source=. --push`
2. Confirm with user before creating

### Step 4: Confirm

```
**Sync Complete!**
- Pushed to origin
- [X] files changed
- [commit summary]
```

## Quick Sync

If user runs `/sync quick`:
1. Auto-commit with generated message
2. Push immediately
3. Show summary

## Error Handling

### Push rejected
```
Remote has changes. Pull first, then run /sync again.
```

### Nothing to sync
```
Already up to date. No changes to push.
```
