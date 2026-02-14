#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing env vars. Run: node --env-file=.env.local scripts/test-supabase.mjs");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function test() {
  console.log("Testing Supabase connection...\n");

  // 1. Test stories table exists and is queryable
  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select("id")
    .limit(1);

  if (storiesError) {
    console.error("❌ Stories table:", storiesError.message);
    if (storiesError.code === "42P01") {
      console.error("   → Table doesn't exist. Run supabase/schema.sql in Supabase SQL Editor.");
    }
    process.exit(1);
  }
  console.log("✓ Stories table: OK");

  // 2. Test storage bucket exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error("❌ Storage:", bucketsError.message);
    process.exit(1);
  }
  const storyAudio = buckets?.find((b) => b.name === "story-audio");
  if (!storyAudio) {
    console.error("❌ Storage: 'story-audio' bucket not found. Create it in Supabase Dashboard.");
    process.exit(1);
  }
  console.log("✓ Storage bucket 'story-audio': OK");

  console.log("\n✅ Supabase is ready.");
}

test().catch((e) => {
  console.error(e);
  process.exit(1);
});
