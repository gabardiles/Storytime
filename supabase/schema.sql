-- Storytime Database Schema
-- Run this in Supabase SQL Editor

-- Extensions (uuid)
create extension if not exists "pgcrypto";

-- STORIES
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  title text null,
  tone text not null,
  length_key text not null,
  ruleset_id text not null default 'default',
  context_json jsonb not null default '{}'::jsonb,
  status text not null default 'done',
  created_at timestamptz not null default now()
);

create index if not exists stories_created_at_idx on public.stories (created_at desc);
create index if not exists stories_user_id_idx on public.stories (user_id);

-- CHAPTERS
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  chapter_index int not null,
  recap_json jsonb null,
  status text not null default 'done',
  created_at timestamptz not null default now(),
  unique (story_id, chapter_index)
);

create index if not exists chapters_story_id_idx on public.chapters (story_id);

-- PARAGRAPHS
create table if not exists public.paragraphs (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  paragraph_index int not null,
  text text not null,
  audio_url text null,
  image_url text null,
  image_prompt text null,
  status text not null default 'text_ready',
  created_at timestamptz not null default now(),
  unique (chapter_id, paragraph_index)
);

create index if not exists paragraphs_chapter_id_idx on public.paragraphs (chapter_id);

-- RLS
alter table public.stories enable row level security;
alter table public.chapters enable row level security;
alter table public.paragraphs enable row level security;

drop policy if exists "stories_select_own" on public.stories;
create policy "stories_select_own"
on public.stories for select
using (auth.uid() = user_id);

drop policy if exists "stories_insert_own" on public.stories;
create policy "stories_insert_own"
on public.stories for insert
with check (auth.uid() = user_id);

drop policy if exists "stories_update_own" on public.stories;
create policy "stories_update_own"
on public.stories for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "chapters_select_via_story" on public.chapters;
create policy "chapters_select_via_story"
on public.chapters for select
using (
  exists (
    select 1 from public.stories s
    where s.id = chapters.story_id and s.user_id = auth.uid()
  )
);

drop policy if exists "chapters_insert_via_story" on public.chapters;
create policy "chapters_insert_via_story"
on public.chapters for insert
with check (
  exists (
    select 1 from public.stories s
    where s.id = chapters.story_id and s.user_id = auth.uid()
  )
);

drop policy if exists "chapters_update_via_story" on public.chapters;
create policy "chapters_update_via_story"
on public.chapters for update
using (
  exists (
    select 1 from public.stories s
    where s.id = chapters.story_id and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stories s
    where s.id = chapters.story_id and s.user_id = auth.uid()
  )
);

drop policy if exists "paragraphs_select_via_story" on public.paragraphs;
create policy "paragraphs_select_via_story"
on public.paragraphs for select
using (
  exists (
    select 1
    from public.chapters c
    join public.stories s on s.id = c.story_id
    where c.id = paragraphs.chapter_id and s.user_id = auth.uid()
  )
);

drop policy if exists "paragraphs_insert_via_story" on public.paragraphs;
create policy "paragraphs_insert_via_story"
on public.paragraphs for insert
with check (
  exists (
    select 1
    from public.chapters c
    join public.stories s on s.id = c.story_id
    where c.id = paragraphs.chapter_id and s.user_id = auth.uid()
  )
);

drop policy if exists "paragraphs_update_via_story" on public.paragraphs;
create policy "paragraphs_update_via_story"
on public.paragraphs for update
using (
  exists (
    select 1
    from public.chapters c
    join public.stories s on s.id = c.story_id
    where c.id = paragraphs.chapter_id and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.chapters c
    join public.stories s on s.id = c.story_id
    where c.id = paragraphs.chapter_id and s.user_id = auth.uid()
  )
);

-- Storage bucket for story audio (create via Supabase Dashboard: Storage > New bucket)
-- Bucket name: story-audio
-- Public: Yes (so audio URLs work without signed URLs)
-- Run this policy so public URLs work (Storage > Policies > New policy, or run in SQL Editor):
-- insert into storage.buckets (id, name, public) values ('story-audio', 'story-audio', true) on conflict (id) do update set public = true;
-- create policy "story-audio public read" on storage.objects for select using (bucket_id = 'story-audio');
