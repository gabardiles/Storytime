# Storytime

Turn ideas into immersive bedtime stories with AI-generated text and ElevenLabs voice.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

- **Supabase**: Create a project at [supabase.com](https://supabase.com). Get URL and keys from Project Settings > API.
- **OpenAI**: Get an API key from [platform.openai.com](https://platform.openai.com).
- **ElevenLabs**: Get an API key and voice ID from [elevenlabs.io](https://elevenlabs.io).

### 3. Database

Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor.

### 4. Storage buckets

In Supabase Dashboard: Storage > New bucket

- **story-audio** – for TTS audio (Public: Yes)
- **story-images** – for DALL-E illustrations (Public: Yes)

The app will try to create `story-images` automatically. If image uploads fail, create it manually and run the policies in `supabase/storage-policy.sql`.

### 5. Auth

Enable Email auth in Supabase: Authentication > Providers > Email.

Add redirect URL in Authentication > URL Configuration:
- Site URL: `http://localhost:3000` (or your production URL)
- Redirect URLs: `http://localhost:3000/auth/callback`

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, create a story, and listen.
