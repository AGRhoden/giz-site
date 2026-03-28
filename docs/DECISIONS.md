# Decisions

## Why This File Exists

This file records decisions that should not depend on chat history.

## Active Decisions

### 1. Project memory must live in the repo

- Chats are not a reliable source of truth.
- Important planning and implementation context must be consolidated in markdown files committed with the code.

### 2. Admin is desktop-first

- The admin panel is primarily for desktop use.
- Mobile support is secondary and intended only for occasional light edits.
- Layout choices should optimize desktop clarity before mobile parity.

### 3. Admin and public frontend are different products

- The admin can use cards, controls and maintenance-heavy UI.
- The public frontend should not inherit admin visual language.
- Public design work will be revisited separately.

### 4. Backend/admin comes before frontend redesign

- The project now prioritizes a stable editorial/admin system.
- The public frontend redesign is intentionally on standby until the backend layer is structurally reliable.

### 5. Maintenance actions must be separated from project editing

- Tag assignment belongs to the project editor.
- Taxonomy management belongs to a maintenance/system area.
- Site content editing belongs to its own workspace, not to the project editor.

### 6. Site content must not live only in static local files

- Page copy and public-structure text now need a backend source of truth.
- `site_config` in Supabase is the first step toward a fully customizable site/panel system.

### 7. Do not expose fake flexibility

- Editing existing menu labels, page content and trail copy is allowed now.
- Creating brand new pages or brand new public criteria is postponed until the frontend architecture is defined clearly enough.

### 8. Collapse controls should help scanning, not block action

- Dense maintenance blocks can be collapsible.
- The main project editing surface should stay directly usable rather than becoming a maze of hidden panels.

### 9. Paid launch should wait for public readiness

- The backend/admin can keep evolving on the current low-cost stack.
- New recurring costs should be deferred until the public frontend is navigable and a meaningful part of the portfolio is loaded.
- Authorial content production is part of launch readiness, not an afterthought.

## Implementation Consequences

- Every meaningful block of work should leave a markdown trace in `docs/` or `tasks/`.
- If a future change contradicts one of these decisions, update this file in the same branch/commit set.
