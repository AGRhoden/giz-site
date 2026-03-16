# Backend Status

## Current State
- Cloudflare Pages is live at `https://giz-site.pages.dev`.
- This repo is linked to Supabase project `epinzzvsbyglmztasspa`.
- Core schema migration has been applied remotely.
- Initial seed migration for the portfolio dataset has been applied remotely.

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
- 45 initial projects imported into Supabase
- tags imported from current color tags
- thumbs and gallery image paths imported

## Supabase Runtime Status
- `project-media` bucket migration applied remotely.
- `published_project_feed` view applied remotely.
- Frontend now uses the Supabase feed as its only runtime source.
- `backend.config.js` is required for the public site and the admin.

## Frontend Preparedness
- The frontend reads published projects from `published_project_feed` through `backend.config.js`.
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
