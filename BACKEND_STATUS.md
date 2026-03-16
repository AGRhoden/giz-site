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

## Pending Check
- The storage bucket migration was created locally, but the last `supabase db push` hit a temporary pooler authentication circuit breaker.
- Re-run `supabase db push` later to confirm `project-media` bucket creation if it did not apply.

## Frontend Preparedness
- The frontend now supports an optional Supabase-backed source through `backend.config.js`.
- If `window.GIZ_BACKEND_CONFIG.enabled = true`, the site will try to read from the `published_project_feed` view.
- Fallback to local `projetos.json` remains active by default.
- Project pair UI hooks are in place and will appear when pair data exists.

## Next Recommended Steps
- Verify the bucket migration status and apply if still pending.
- Add an import/update script for future batches.
- Connect the frontend to Supabase reads behind a feature flag.
- Build the private admin/editor workflow.
