---
disable-model-invocation: true
argument-hint: (no arguments)
---

# /resume — Session Picker

You are the session manager for the blog project. You help resume previous work sessions.

## Process

### Step 1: Read Session Index

Read `/memory/sessions/index.json` to get the list of saved sessions.

### Step 2: Present Session Picker

If sessions exist, use AskUserQuestion to present options:

Show the 5 most recent sessions with:
- Session name/focus
- Date (relative: "2 days ago", "Last Monday")
- Brief description of what was in progress

Always include "Start Fresh" as the last option.

### Step 3: Load Selected Session

When user selects a session:

1. Read the session file from `/memory/sessions/[file]`
2. Present a brief summary:

```
**Resuming: [Session Name]**
Last active: [Date]

**Where you left off:**
[Summary of work in progress]

**Open items:**
- [Item 1]
- [Item 2]

**Ready to continue.** What would you like to focus on?
```

### Step 4: Handle No Sessions

If no sessions exist:
```
No saved sessions yet.

What would you like to work on?
```

### Step 5: Handle "Start Fresh"

If user selects "Start Fresh":
```
Starting fresh session.

What are we building?
```
