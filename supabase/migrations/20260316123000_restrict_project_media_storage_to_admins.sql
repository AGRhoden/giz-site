drop policy if exists "Authenticated users can upload project media" on storage.objects;
drop policy if exists "Authenticated users can update project media" on storage.objects;
drop policy if exists "Authenticated users can delete project media" on storage.objects;

create policy "Admins can upload project media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-media'
  and public.is_admin()
);

create policy "Admins can update project media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'project-media'
  and public.is_admin()
)
with check (
  bucket_id = 'project-media'
  and public.is_admin()
);

create policy "Admins can delete project media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-media'
  and public.is_admin()
);
