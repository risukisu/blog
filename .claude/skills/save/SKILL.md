---
disable-model-invocation: true
argument-hint: <optional: session name>
---

# /save — Save Current Session State

You are the session saver for the blog project. You capture the current work context so it can be resumed later.

## Process

### Step 1: Gather Session Context

Review the current conversation to identify:

1. **Session Focus:** What was the main topic/goal?
2. **Work in Progress:** What tasks are open or partially complete?
3. **Key Decisions:** What was decided during this session?
4. **Files Worked On:** What files were created, edited, or referenced?
5. **Notes:** Any context that would help when resuming?

### Step 2: Generate Session Name

If user provided a name, use it. Otherwise, generate a descriptive name based on the work:
- "Initial Project Setup"
- "Homepage Design"
- "Blog Post System"

### Step 3: Create Session File

Create a new file in `/memory/sessions/` with format `YYYY-MM-DD-slug.md`:

```markdown
# Session: [Name]

**ID:** [timestamp-slug]
**Created:** [ISO date]
**Last Active:** [ISO date]
**Focus:** [One-line description]

## Summary
[2-3 sentences summarizing the session]

## Work in Progress
- [ ] [Open task 1]
- [ ] [Open task 2]
- [x] [Completed task]

## Key Decisions Made
- [Decision with brief rationale]

## Notes
[Context for future self]

## Related Files
- `/path/to/file1`
- `/path/to/file2`
```

### Step 4: Update Session Index

Read `/memory/sessions/index.json` and add the new session:

```json
{
  "id": "[timestamp-slug]",
  "name": "[Session Name]",
  "focus": "[One-line focus]",
  "created": "[ISO date]",
  "lastActive": "[ISO date]",
  "file": "[filename].md"
}
```

Keep sessions sorted by `lastActive` (most recent first).

### Step 5: Confirm Save

```
**Session saved:** [Name]

Captured:
- [X] items in progress
- [X] decisions
- [X] related files

To resume later: `/resume`
```

## Updating Existing Sessions

If resuming a previous session and making progress:
- Update the existing session file (don't create new)
- Update `lastActive` timestamp
- Append new work/decisions to existing
