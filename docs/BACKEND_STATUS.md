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
- `20260316105500_restrict_editor_access_to_admins.sql`
- `20260316123000_restrict_project_media_storage_to_admins.sql`
- `20260316130000_add_is_featured_to_published_project_feed.sql`
- `20260317012000_add_sort_year_and_pair_media_to_published_project_feed.sql`

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
- `published_project_feed` now exposes `is_featured`.
- `published_project_feed` now also exposes `sort_year` and richer pair objects with thumb metadata.
- Frontend now uses the Supabase feed as its only runtime source.
- `backend.config.js` is required for the public site and the admin.

## Frontend Preparedness
- The frontend reads published projects from `published_project_feed` through `backend.config.js`.
- The frontend resolves Supabase `storage_path` values into public media URLs before rendering thumbs and gallery images.
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
  - organizing the editor into dedicated sections for cadastro, imagens, tags and pares
  - direct tag marking by click, with inline tag creation and automatic tag grouping
  - tag editing and tag deletion directly from the tags section
  - batch tag application for multiple selected projects
  - batch publisher application for multiple selected projects
  - internal editorial flags such as revisar texto and destaque futuro
  - site-level featured toggle reflected in the public portfolio feed
  - a publication checklist focused on title, client, type and publication year
  - editing title, subtitle, client, type, publication year, description and status
  - a simpler editorial flow based on saving the project state instead of action-heavy publication controls
  - visible publication state and publication year inside cadastro
  - uploading project media to the `project-media` bucket
  - recognizing additional project images by filename convention such as `slug_thumb.jpg` and `slug_03.jpg`
  - removing uploaded media from storage and database
  - adding and removing project pairs through multi-select linking
  - mirrored pair creation so linked projects stay reciprocal
