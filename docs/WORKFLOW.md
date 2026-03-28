# Workflow

## Goal

Keep project memory inside the repository so work can resume even if chat history is lost.

## Rules

- Before starting a substantial task, read:
  - [PROJECT_STATE.md](/Users/antonio/Documents/giz-site/docs/PROJECT_STATE.md)
  - [DECISIONS.md](/Users/antonio/Documents/giz-site/docs/DECISIONS.md)
  - the relevant task file in [tasks](/Users/antonio/Documents/giz-site/tasks/README.md)
- After finishing a meaningful block:
  - update the relevant task markdown
  - update `PROJECT_STATE.md` if the project state changed
  - update `DECISIONS.md` if a real decision was made
- When possible, commit:
  - code
  - migrations
  - task/state/decision markdown
  in the same unit of work

## Suggested Session Closeout

At the end of a session, capture:

- what changed
- what was validated
- what is still pending
- the most likely next step

## Suggested Task Lifecycle

- `Planned`
- `In progress`
- `Blocked`
- `Done`

## Suggested Commit Habit

Each feature or repair should ideally leave behind:

- the implementation
- the task file update
- any relevant decision update

That keeps code and intent versioned together.
