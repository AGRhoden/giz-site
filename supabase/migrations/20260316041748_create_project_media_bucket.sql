insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'project-media',
  'project-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read project media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'project-media');

create policy "Authenticated users can upload project media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'project-media');

create policy "Authenticated users can update project media"
on storage.objects
for update
to authenticated
using (bucket_id = 'project-media')
with check (bucket_id = 'project-media');

create policy "Authenticated users can delete project media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'project-media');
