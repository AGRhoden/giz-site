create policy "Authenticated users can manage projects"
on public.projects
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can manage project images"
on public.project_images
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can manage tags"
on public.tags
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can manage project tags"
on public.project_tags
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can manage project pairs"
on public.project_pairs
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can manage project editorial flags"
on public.project_editorial_flags
for all
to authenticated
using (true)
with check (true);
