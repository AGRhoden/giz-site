create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users admin_user
    where lower(admin_user.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
       or admin_user.auth_user_id = auth.uid()
  );
$$;

insert into public.admin_users (email)
values ('antonio.g.rhoden@gmail.com')
on conflict (email) do nothing;

drop policy if exists "Authenticated users can manage projects" on public.projects;
drop policy if exists "Authenticated users can manage project images" on public.project_images;
drop policy if exists "Authenticated users can manage tags" on public.tags;
drop policy if exists "Authenticated users can manage project tags" on public.project_tags;
drop policy if exists "Authenticated users can manage project pairs" on public.project_pairs;
drop policy if exists "Authenticated users can manage project editorial flags" on public.project_editorial_flags;

create policy "Admins can manage projects"
on public.projects
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage project images"
on public.project_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage tags"
on public.tags
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage project tags"
on public.project_tags
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage project pairs"
on public.project_pairs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage project editorial flags"
on public.project_editorial_flags
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
