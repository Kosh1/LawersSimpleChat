create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  slug text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create unique index if not exists projects_user_slug_idx on public.projects (user_id, slug) where slug is not null;

alter table public.chat_sessions
  add column if not exists project_id uuid references public.projects (id) on delete set null;

create index if not exists chat_sessions_project_id_idx on public.chat_sessions (project_id);

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  mime_type text not null,
  size bigint not null,
  text text not null,
  truncated boolean not null default false,
  raw_text_length integer not null,
  strategy text not null,
  uploaded_at timestamptz not null default timezone('utc', now()),
  checksum text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists project_documents_project_id_idx on public.project_documents (project_id, uploaded_at desc);
create index if not exists project_documents_checksum_idx on public.project_documents (checksum);

