# Vercel Deployment Checklist

## Common Errors & Fixes

### 1. **Function Timeout (504 / "Task timed out")**

Story generation can take 60–180+ seconds. Vercel limits:
- **Hobby**: 10s default, **not configurable** → upgrade to Pro for long-running functions
- **Pro**: 60s default, configurable up to **300s**

The app sets `maxDuration = 300` on these routes:
- `POST /api/stories` (60s)
- `POST /api/stories/[id]/generate-media` (300s)
- `POST /api/stories/[id]/continue` (300s)

**Fix**: Upgrade to Vercel Pro, or use a different host (Railway, Render) for hobby deployments.

---

### 2. **Google TTS: "GOOGLE_APPLICATION_CREDENTIALS_JSON is invalid JSON"**

Vercel env vars must be a **single line**. Multi-line JSON breaks.

**Fix**:
1. Open your service account JSON key file
2. Minify it: remove all newlines and extra spaces
3. Paste the entire JSON as one line in Vercel → Settings → Environment Variables
4. Or use: `cat key.json | jq -c .` to output compact JSON

---

### 3. **Missing Environment Variables**

Required in Vercel:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | From Supabase Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | For server-side DB + storage |
| `OPENAI_API_KEY` | Yes | For story text + images |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Yes* | Full service account JSON, single line |
| `NEXT_PUBLIC_SITE_URL` | Recommended | e.g. `https://your-app.vercel.app` |

\* Set `SKIP_TTS=true` to disable voice (text + images only) if you don't have Google TTS yet.

---

### 4. **Supabase Auth Redirect**

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: Add `https://your-app.vercel.app/auth/callback`

---

### 5. **Storage Buckets**

Ensure these buckets exist in Supabase Storage:
- `story-audio` (public)
- `story-images` (public)

Run `supabase/storage-policy.sql` if uploads return 403.

---

### 6. **File System (rulesets/instructions.md)**

The app reads `rulesets/instructions.md` at runtime. This file is bundled in the deployment. If you get "file not found", ensure `rulesets/` is not in `.gitignore` and is committed.

---

## Quick Sanity Check

1. `npm run build` — must succeed
2. All env vars set in Vercel (including `GOOGLE_APPLICATION_CREDENTIALS_JSON`)
3. Pro plan (or accept 10s timeout on Hobby)
4. Supabase redirect URLs include production URL
