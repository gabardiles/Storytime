-- Run this in Supabase SQL Editor if audio URLs return 403
-- Allows public read access to the story-audio bucket

create policy "story-audio public read"
on storage.objects for select
using (bucket_id = 'story-audio');
