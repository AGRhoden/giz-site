create or replace view public.published_project_feed as
select
  p.id,
  p.slug,
  p.title,
  p.subtitle,
  p.description,
  p.client,
  p.project_type,
  p.published_at,
  p.created_at,
  (
    select pi.storage_path
    from public.project_images pi
    where pi.project_id = p.id
      and pi.kind = 'thumb'
      and pi.is_published = true
    order by pi.sort_order asc, pi.created_at asc
    limit 1
  ) as thumb_path,
  coalesce(
    (
      select jsonb_agg(pi.storage_path order by pi.sort_order asc, pi.created_at asc)
      from public.project_images pi
      where pi.project_id = p.id
        and pi.kind = 'gallery'
        and pi.is_published = true
    ),
    '[]'::jsonb
  ) as images,
  coalesce(
    (
      select jsonb_agg(t.slug order by t.label asc)
      from public.project_tags pt
      join public.tags t on t.id = pt.tag_id
      where pt.project_id = p.id
        and t.is_public = true
    ),
    '[]'::jsonb
  ) as tag_slugs,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'slug', paired.slug,
          'title', paired.title,
          'subtitle', paired.subtitle,
          'label_override', pp.label_override,
          'pair_type', pp.pair_type
        )
        order by paired.title asc
      )
      from public.project_pairs pp
      join public.projects paired on paired.id = pp.paired_project_id
      where pp.project_id = p.id
        and paired.status = 'published'
    ),
    '[]'::jsonb
  ) as pairs
from public.projects p
where p.status = 'published';
