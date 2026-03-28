# 003 Public Frontend Redesign

## Status

In Progress

## Objective

Redesign the public-facing portfolio experience after the backend/admin layer is considered stable.

## Current Context

- Some navigation fixes and structural improvements have already been made
- The user explicitly noted that some recent frontend changes drifted away from the earlier public aesthetic
- Admin-style cards should not define the public language

## Constraints

- Keep the site custom and editorial, not generic
- Preserve logic improvements from the backend/content work
- Revisit filters, colors, pairs and overall navigation as a public storytelling system

## Inputs Already Available

- Supabase project data feed
- `site_config` content layer
- portfolio trail copy editable from admin

## Open Questions For This Task

- Which parts of the earlier public aesthetic must be preserved?
- Which interaction model best resolves colors/pairs without confusing navigation?
- How much of the public structure should remain fixed versus fully editable?

## Not To Do Yet

- Do not treat this as active implementation until the backend/content layer is considered stable enough

## First Implementation Pass

- Rebuild the public shell before rewriting every page in detail
- Improve hierarchy with a stronger header, contextual collection intro and clearer page states
- Make the public grid feel editorial rather than admin-derived by adding rhythm, captions and curated subsets outside the full portfolio page
- Preserve the current Supabase/site_config logic while redesigning layout and interaction language
- Reintroduce colors and pairs as meaningful public navigation cues, not only backend data fields
