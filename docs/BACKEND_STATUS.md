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
- Add a safe `Limpar seleção` action to the upload intake.

## Admin Progress
- Added a first admin surface at `/admin`.
- Admin currently supports:
  - email and password login
  - password recovery by email
  - magic link as fallback access flow
  - restricted admin access through an explicit admin allowlist
  - project search and filtering by status
  - creating draft projects from one or many uploaded files
  - grouping incoming files by naming convention such as `projeto_thumb.jpg` and `projeto_01.jpg`
  - automatic initial upload of thumb and gallery images during project creation
  - optional overwrite of existing project media when the internal identifier already exists
  - upload reporting for created projects, updated projects, duplicates and invalid filenames
  - automatic `revisar texto` marking for projects created from the initial upload flow
  - organizing the editor into dedicated sections for cadastro, mais imagens, tags and pares
  - direct tag marking by click, with inline tag creation and automatic tag grouping
  - internal editorial flags such as revisar texto and destaque futuro
  - a publication checklist for title, client, type, thumb and image 01
  - editing internal identifier, title, subtitle, client, type, description, internal notes and status
  - a simpler editorial flow based on saving the project state instead of action-heavy publication controls
  - visible publication state and published timestamp inside cadastro
  - uploading project media to the `project-media` bucket
  - editing image type, alt text, sort order and publication state
  - removing uploaded media from storage and database
  - adding and removing project pairs through search + click
  - mirrored pair creation so linked projects stay reciprocal
