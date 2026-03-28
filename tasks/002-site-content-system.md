# 002 Site Content System

## Status

In progress

## Objective

Move public site copy/configuration out of scattered static files and into a manageable editorial system.

## Delivered

- new `site_config` table in Supabase
- remote storage for:
  - navigation labels
  - page HTML
  - portfolio trail copy
- admin workspace for:
  - editing menu labels
  - editing page HTML
  - editing portfolio trail copy
- frontend consumption of `site_config` with local fallback

## Current Boundaries

- Existing items can be edited
- New menu items are not created from the admin yet
- New public trail definitions are not created from the admin yet
- Full public label dictionary is not yet exposed in the admin

## Why This Boundary Exists

- Adding arbitrary new items affects frontend architecture, not just copy
- We intentionally avoided exposing fake flexibility before structure is defined

## Next Likely Steps

1. Decide whether menu/page/trail creation should become truly dynamic
2. Decide whether the public label dictionary should move into admin control
3. Add validation/guardrails for HTML content editing if needed

## Risk Notes

- The `portfolio` page content must preserve dynamic placeholders used by the frontend
- The admin currently warns about this in the UI copy, but stronger validation may be useful later
