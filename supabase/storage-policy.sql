-- Run this in Supabase SQL Editor if audio/image URLs return 403
-- Allows public read access to story-audio and story-images buckets

-- Create buckets (run first):
-- insert into storage.buckets (id, name, public) values ('story-audio', 'story-audio', true) on conflict (id) do update set public = true;
-- insert into storage.buckets (id, name, public) values ('story-images', 'story-images', true) on conflict (id) do update set public = true;

create policy "story-audio public read"
on storage.objects for select
using (bucket_id = 'story-audio');

create policy "story-images public read"
on storage.objects for select
using (bucket_id = 'story-images');
