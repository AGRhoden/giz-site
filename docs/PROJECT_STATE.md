# Project State

## Snapshot

- Project: `giz-site`
- Goal: editorial portfolio site with a custom admin panel and a Supabase-backed content system
- Hosting: Cloudflare Pages
- Backend: Supabase project `epinzzvsbyglmztasspa`
- Current priority: close the public frontend phase before taking on real launch costs

## Current Status

### Admin

- Admin login works with email/password, password recovery and magic link support.
- Project editing is working and now feels substantially more stable for real use.
- The admin is split into two workspaces:
  - `Projetos`
  - `Conteúdo do site`
- `Projetos` currently covers:
  - search and status filtering
  - alphabetical navigation
  - project editing
  - image upload and removal
  - tag assignment on the project
  - pair linking
  - batch editing
  - initial import flow
- `Conteúdo do site` currently covers:
  - taxonomy management
  - menu labels
  - static page HTML
  - portfolio trail text

### Supabase

- Core portfolio schema exists remotely.
- `published_project_feed` is live and now includes:
  - `is_featured`
  - `sort_year`
  - richer pair payloads with metadata/thumb info
- `site_config` now exists remotely and is the new editorial source for:
  - navigation labels
  - page content
  - portfolio trail copy
- The following migrations are confirmed both locally and remotely:
  - `20260316041248_init_giz_portfolio_schema.sql`
  - `20260316041542_seed_initial_projects_from_json.sql`
  - `20260316041748_create_project_media_bucket.sql`
  - `20260316050000_create_published_project_feed_view.sql`
  - `20260316053000_enable_authenticated_editor_access.sql`
  - `20260316105500_restrict_editor_access_to_admins.sql`
  - `20260316123000_restrict_project_media_storage_to_admins.sql`
  - `20260316130000_add_is_featured_to_published_project_feed.sql`
  - `20260317012000_add_sort_year_and_pair_media_to_published_project_feed.sql`
  - `20260317164000_create_site_config_table.sql`

### Public Site

- The frontend reads project data from Supabase.
- The frontend now also reads site-level content from `site_config`, with local-file fallback.
- The public frontend now becomes the next major work phase.
- Launch spending should remain conservative until the public experience is navigable and substantially loaded.

## Working Assumptions

- Desktop is the primary target for the admin panel.
- Mobile admin access is secondary and only for occasional light edits.
- The admin should prioritize clarity, hierarchy and speed over generic dashboard aesthetics.
- The public frontend must not inherit admin-style card logic blindly.

## Known Gaps

- Site content editing currently supports changing existing items, not creating brand new menu items or brand new portfolio trails.
- The full public label dictionary is not yet editable in the admin.
- The public frontend still needs a fresh visual/system pass after the backend phase is considered stable.

## Resume Here

If a future session needs to resume quickly:

1. Read [DECISIONS.md](/Users/antonio/Documents/giz-site/docs/DECISIONS.md).
2. Read the relevant file in [tasks](/Users/antonio/Documents/giz-site/tasks/README.md).
3. Check `git status`.
4. If the work touches Supabase-backed site content, verify `site_config` exists remotely before debugging UI behavior.

## Last Consolidated Direction

- Backend/admin is structurally strong enough for real content operations.
- The content system has been moved out of static-file-only land and into Supabase.
- Next major phase: deliberate public frontend redesign with a custom visual language, followed by launch preparation.
