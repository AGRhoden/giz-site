create extension if not exists pgcrypto;

create type public.project_status as enum (
  'draft',
  'review',
  'published',
  'archived'
);

create type public.tag_group as enum (
  'tema',
  'cor',
  'editorial',
  'interno'
);

create type public.pair_type as enum (
  'pair',
  'series',
  'collection',
  'cover_set'
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  client text,
  project_type text,
  status public.project_status not null default 'draft',
  publication_notes text,
  published_at timestamptz,
  imported_batch text,
  sort_year integer,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$')
);

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  kind text not null default 'gallery',
  alt_text text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  group_name public.tag_group not null,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tags_slug_format check (slug ~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$')
);

create table public.project_tags (
  project_id uuid not null references public.projects(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, tag_id)
);

create table public.project_pairs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  paired_project_id uuid not null references public.projects(id) on delete cascade,
  pair_type public.pair_type not null default 'pair',
  label_override text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_pairs_not_same check (project_id <> paired_project_id),
  constraint project_pairs_unique unique (project_id, paired_project_id, pair_type)
);

create table public.project_editorial_flags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  flag_key text not null,
  flag_label text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, flag_key)
);

create index projects_status_idx on public.projects (status);
create index projects_client_idx on public.projects (client);
create index projects_project_type_idx on public.projects (project_type);
create index projects_published_at_idx on public.projects (published_at desc);
create index project_images_project_id_idx on public.project_images (project_id, sort_order);
create index tags_group_name_idx on public.tags (group_name);
create index project_pairs_project_id_idx on public.project_pairs (project_id);
create index project_pairs_paired_project_id_idx on public.project_pairs (paired_project_id);
create index project_editorial_flags_project_id_idx on public.project_editorial_flags (project_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger projects_set_updated_at
before update on public.projects
for each row
execute procedure public.set_updated_at();

create trigger project_images_set_updated_at
before update on public.project_images
for each row
execute procedure public.set_updated_at();

create trigger tags_set_updated_at
before update on public.tags
for each row
execute procedure public.set_updated_at();

create trigger project_pairs_set_updated_at
before update on public.project_pairs
for each row
execute procedure public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.tags enable row level security;
alter table public.project_tags enable row level security;
alter table public.project_pairs enable row level security;
alter table public.project_editorial_flags enable row level security;

create policy "Public can read published projects"
on public.projects
for select
to anon, authenticated
using (status = 'published');

create policy "Public can read published project images"
on public.project_images
for select
to anon, authenticated
using (
  is_published = true
  and exists (
    select 1
    from public.projects
    where projects.id = project_images.project_id
      and projects.status = 'published'
  )
);

create policy "Public can read public tags"
on public.tags
for select
to anon, authenticated
using (is_public = true);

create policy "Public can read project tags for published projects"
on public.project_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_tags.project_id
      and projects.status = 'published'
  )
);

create policy "Public can read project pairs for published projects"
on public.project_pairs
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_pairs.project_id
      and projects.status = 'published'
  )
  and exists (
    select 1
    from public.projects paired
    where paired.id = project_pairs.paired_project_id
      and paired.status = 'published'
  )
);

create policy "Public can read public editorial flags for published projects"
on public.project_editorial_flags
for select
to anon, authenticated
using (
  is_public = true
  and exists (
    select 1
    from public.projects
    where projects.id = project_editorial_flags.project_id
      and projects.status = 'published'
  )
);
