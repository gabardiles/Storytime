# Google TTS Migration Plan

## Goal
Replace ElevenLabs with Google Cloud Text-to-Speech to reduce costs. Google offers:
- **1M characters/month free** (Neural2)
- **4M characters/month free** (Standard/WaveNet)
- ~$16/million chars (Neural2) vs ElevenLabs ~$0.30/1k chars = ~$300/million

## Current Flow
- `lib/tts.ts` → ElevenLabs API → MP3 → Supabase Storage
- `lib/voices.ts` → ElevenLabs voice IDs
- `app/create/page.tsx` → Voice selector (default, old-man, adam, old-slow-man)
- API routes pass `voiceOptionId` to `generateAudioForParagraph`

## Implementation Steps

### 1. Google Cloud Setup
- Create project at [console.cloud.google.com](https://console.cloud.google.com)
- Enable **Cloud Text-to-Speech API**
- Create service account → Keys → Add JSON key
- Env var: `GOOGLE_APPLICATION_CREDENTIALS_JSON` (full JSON as string) or `GOOGLE_CLOUD_PROJECT` + key file for local

### 2. Code Changes
- **lib/tts.ts**: Replace ElevenLabs fetch with Google TTS REST API
- **lib/voices.ts**: Map option IDs to Google voice names (e.g. `en-US-Neural2-D`, `en-US-Chirp-HD-F` for Storytime)
- **lib/languages.ts**: Map language codes to Google `languageCode` (en, sv-SE, etc.)
- Keep same `generateAudioForParagraph` signature; storage flow unchanged

### 3. Voice Mapping
| Option ID    | Google Voice           | Description              |
|-------------|------------------------|--------------------------|
| default     | en-US-Chirp-HD-F       | Storytime-optimized      |
| old-man     | en-US-Neural2-D        | Mature male              |
| adam        | en-US-Neural2-C        | Clear male               |
| old-slow-man| en-US-Wavenet-D        | Slow, soothing           |

### 4. Env Vars
- Remove: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- Add: `GOOGLE_APPLICATION_CREDENTIALS_JSON` (full service account JSON as string)
- Optional: `GOOGLE_TTS_VOICE_NAME` (override default voice)

### 5. Output Format
- Google returns base64 MP3 (or we request MP3 via `audioConfig.audioEncoding`)
- Upload to Supabase same as before
