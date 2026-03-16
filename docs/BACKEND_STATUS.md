# Backend Status

## Current State
- Cloudflare Pages is live at `https://giz-site.pages.dev`.
- This repo is linked to Supabase project `epinzzvsbyglmztasspa`.
- Core schema migration has been applied remotely.
- Initial seed migration from `projetos.json` has been applied remotely.

## Database Migrations
- `20260316041248_init_giz_portfolio_schema.sql`
- `20260316041542_seed_initial_projects_from_json.sql`
- `20260316041748_create_project_media_bucket.sql`

## What Is Already Modeled
- `projects`
- `project_images`
- `tags`
- `project_tags`
- `project_pairs`
- `project_editorial_flags`
- public-read RLS for published portfolio content

## Seeded Content
- 45 initial projects imported from `projetos.json`
- tags imported from current color tags
- thumbs and gallery image paths imported

## Supabase Runtime Status
- `project-media` bucket migration applied remotely.
- `published_project_feed` view applied remotely.
- Frontend switched to Supabase feed using the public project URL and publishable key.
- Local JSON fallback remains in the codebase, but production config is now using Supabase.

## Frontend Preparedness
- The frontend now supports an optional Supabase-backed source through `backend.config.js`.
- If `window.GIZ_BACKEND_CONFIG.enabled = true`, the site will try to read from the `published_project_feed` view.
- Fallback to local `projetos.json` remains active by default.
- Project pair UI hooks are in place and will appear when pair data exists.

## Next Recommended Steps
- Add an import/update script for future batches.
- Build the private admin/editor workflow.
- Define how paired projects will be created and edited in the future admin flow.

## Admin Progress
- Added a first admin surface at `/admin`.
- Admin currently supports:
  - email-based magic link login
  - restricted admin access through an explicit admin allowlist
  - project search and filtering by status
  - creating draft projects
  - editing title, subtitle, client, type, description and status
  - adding and removing project pairs
  - mirrored pair creation so linked projects stay reciprocal
