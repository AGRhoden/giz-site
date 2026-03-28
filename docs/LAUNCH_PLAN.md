# Launch Plan

## Goal

Publish the real site only after the public frontend is navigable, coherent and substantially loaded with portfolio content.

## Current Launch Position

- The backend/admin layer is structurally usable.
- The next major phase is the public frontend.
- No new paid infrastructure should be added just to "have the site online" before the public experience is ready.

## Recommended Launch Order

### Phase 1. Finish the public frontend

- Rework public layout, hierarchy and navigation.
- Preserve the stronger logic already built into filters, pairs and content structure.
- Make the portfolio feel editorial and public-facing rather than admin-derived.
- Resolve navigation confusion, especially around filter state and returning to `Início`.

### Phase 2. Load meaningful content

- Continue importing and organizing projects in the admin.
- Add a substantial portion of the real portfolio before launch.
- Produce the missing authorial texts that the public experience depends on.
- Review page copy in `Conteúdo do site` so launch content is not placeholder-grade.

### Phase 3. Launch preparation

- Confirm the production domain.
- Keep frontend hosting on Cloudflare Pages.
- Keep backend, auth, storage and site content on Supabase.
- Confirm `backend.config.js` values and production redirects.
- Test public site, admin login, password recovery, uploads and site-content saving on the real domain.

### Phase 4. Public launch

- Point the final domain.
- Run a final cross-check of navigation and content.
- Only at this point consider enabling any recurring paid plan if needed.

## Infrastructure Recommendation

### Keep

- `Cloudflare Pages` for the public frontend
- `Supabase` for database, auth, storage and site content
- `GitHub` for version history and deploy workflow

### Use only for backup

- `iCloud`
- `Google Drive`
- `OneDrive`

These storage services help preserve source material, exports and repository backups, but they are not the runtime layer for this project.

## Cost Guidance

### Before the frontend is ready

- `Cloudflare Pages`: `US$ 0/month`
- `GitHub`: `US$ 0/month`
- `Supabase`: stay on `US$ 0/month` if current limits remain comfortable during buildout
- Domain: postpone if desired until closer to real launch

### At real launch

- Recommended baseline: `Supabase Pro` at `US$ 25/month`
- Optional: Supabase custom domain at `US$ 10/month`
- Domain registration: separate cost, depending on registrar and TLD

## Launch Gate

Do not move into paid launch mode until all of the following are true:

- the public frontend feels intentionally designed and easy to navigate
- core filters and pairs work clearly
- a meaningful part of the portfolio is loaded
- key public texts are written
- admin and content workflows feel stable enough for routine use

## Practical Reading

Before resuming launch work, read:

- [PROJECT_STATE.md](/Users/antonio/Documents/giz-site/docs/PROJECT_STATE.md)
- [DECISIONS.md](/Users/antonio/Documents/giz-site/docs/DECISIONS.md)
- [003-public-frontend-redesign.md](/Users/antonio/Documents/giz-site/tasks/003-public-frontend-redesign.md)
