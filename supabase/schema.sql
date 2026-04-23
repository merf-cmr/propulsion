-- ============================================================
-- PROPULSION — Schéma de base de données Supabase
-- Version 1.0 — MVP
-- ============================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE : profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  first_name text not null default '',
  last_name text not null default '',
  whatsapp text,
  photo_url text,
  city text,
  country text,
  status text check (status in ('Entrepreneur', 'Salarié', 'Employé', 'Étudiant', 'Autre')),
  sectors text[] default '{}',
  description text check (char_length(description) <= 160),
  birth_date date,
  linkedin_url text,
  tiktok_url text,
  instagram_url text,
  facebook_url text,
  discord_url text,
  medium_url text,
  career_summary text,
  challenge text,
  challenge_reaction text,
  first_money_exp text,
  main_lesson text,
  current_situation text,
  propulsion_goal text,
  propulsion_achievement text,
  role text not null default 'member' check (role in ('member', 'admin')),
  is_active boolean not null default true,
  profile_completed boolean not null default false,
  created_at timestamptz not null default now(),
  last_login timestamptz
);

-- Index full-text search
create index if not exists profiles_fts_idx on public.profiles
using gin (
  to_tsvector('french',
    coalesce(first_name, '') || ' ' ||
    coalesce(last_name, '') || ' ' ||
    coalesce(city, '') || ' ' ||
    coalesce(country, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(array_to_string(sectors, ' '), '')
  )
);

-- Index pour la recherche par email
create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_is_active_idx on public.profiles (is_active);
create index if not exists profiles_city_idx on public.profiles (city);

-- ============================================================
-- TABLE : announcements
-- ============================================================
create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null check (char_length(title) <= 100),
  content jsonb,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists announcements_status_idx on public.announcements (status);
create index if not exists announcements_published_at_idx on public.announcements (published_at desc);

-- ============================================================
-- TABLE : member_of_day
-- ============================================================
create table if not exists public.member_of_day (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  custom_note text,
  featured_date date unique not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists member_of_day_date_idx on public.member_of_day (featured_date desc);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS sur toutes les tables
alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.member_of_day enable row level security;

-- ---- PROFILES ----

-- Un membre authentifié peut lire tous les profils actifs
create policy "profiles_select_active"
  on public.profiles for select
  to authenticated
  using (is_active = true);

-- Un membre peut modifier uniquement son propre profil (hors role et is_active)
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid() and
    role = (select role from public.profiles where id = auth.uid()) and
    is_active = (select is_active from public.profiles where id = auth.uid())
  );

-- Seul un admin peut tout voir (y compris inactifs)
create policy "profiles_admin_all"
  on public.profiles for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Insertion par admins uniquement (ou trigger)
create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ---- ANNOUNCEMENTS ----

-- Membres authentifiés peuvent lire les annonces publiées
create policy "announcements_select_published"
  on public.announcements for select
  to authenticated
  using (status = 'published' and published_at is not null);

-- Admins peuvent tout faire
create policy "announcements_admin_all"
  on public.announcements for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ---- MEMBER_OF_DAY ----

-- Tous les membres authentifiés peuvent lire
create policy "member_of_day_select"
  on public.member_of_day for select
  to authenticated
  using (true);

-- Admins peuvent tout faire
create policy "member_of_day_admin_all"
  on public.member_of_day for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Bucket pour les avatars membres
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Bucket pour les images d'annonces
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'announcements',
  'announcements',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Policies Storage — avatars
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_auth_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Policies Storage — announcements (admin only)
create policy "announcements_public_read"
  on storage.objects for select
  using (bucket_id = 'announcements');

create policy "announcements_admin_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'announcements' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- TRIGGER : créer un profil minimal à l'inscription auth
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role, is_active, profile_completed)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    'member',
    true,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FONCTION : Recherche full-text
-- ============================================================
create or replace function public.search_profiles(
  search_query text,
  p_sector text default null,
  p_city text default null,
  p_country text default null,
  p_status text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid, first_name text, last_name text, photo_url text,
  city text, country text, status text, sectors text[],
  description text, whatsapp text, email text, last_login timestamptz,
  rank real
)
language sql
security definer
as $$
  select
    p.id, p.first_name, p.last_name, p.photo_url,
    p.city, p.country, p.status, p.sectors,
    p.description, p.whatsapp, p.email, p.last_login,
    ts_rank(
      to_tsvector('french',
        coalesce(p.first_name, '') || ' ' ||
        coalesce(p.last_name, '') || ' ' ||
        coalesce(p.city, '') || ' ' ||
        coalesce(p.country, '') || ' ' ||
        coalesce(p.description, '') || ' ' ||
        coalesce(array_to_string(p.sectors, ' '), '')
      ),
      plainto_tsquery('french', search_query)
    ) as rank
  from public.profiles p
  where
    p.is_active = true
    and (
      search_query = '' or
      to_tsvector('french',
        coalesce(p.first_name, '') || ' ' ||
        coalesce(p.last_name, '') || ' ' ||
        coalesce(p.city, '') || ' ' ||
        coalesce(p.country, '') || ' ' ||
        coalesce(p.description, '') || ' ' ||
        coalesce(array_to_string(p.sectors, ' '), '')
      ) @@ plainto_tsquery('french', search_query)
    )
    and (p_sector is null or p.sectors @> array[p_sector])
    and (p_city is null or p.city ilike '%' || p_city || '%')
    and (p_country is null or p.country = p_country)
    and (p_status is null or p.status = p_status)
  order by rank desc, p.last_login desc nulls last
  limit p_limit
  offset p_offset;
$$;
