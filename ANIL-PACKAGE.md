# Atlas — Anil Onboarding Package
_Last updated: 2026-04-10_

## What It Is
Atlas is a content-to-tweet platform for Delphi Digital analysts. You feed it research (paste text, drop a URL, or record audio) and it generates tweet drafts in your voice.

## Access
**URL:** https://delphi-atlas.vercel.app
**Auth:** Login via X (Twitter OAuth). Connect your X account — that's the first step and required for voice calibration to work.

---

## What Works Now

**Crafting** (`/crafting`) — Core feature. Paste an article, drop a URL, or record a voice note. Select an angle (alpha, contrarian, educational, etc.), pick your voice profile, and Atlas generates a tweet. Refine via chips or free-text prompts. Draft history is saved.

**Brief** (`/briefing`) — AI-generated morning brief across topics you configure (DeFi, Macro, AI & Crypto, etc.). Has a "Craft from this brief" shortcut into the drafting flow. Highlighted as the hero feature.

**Voice Profiles** (`/voice-profiles`) — Your writing style is stored as a voice profile. Set this up first — all tweet generation uses it. You can blend multiple reference voices.

**Feed** (`/feed`) — Curated research feed from Delphi Research, X, and on-chain data.

**Search** (`/search`) — Search across research and past drafts.

**Queue** (`/queue`) — Drafts waiting to be posted. Draft management view.

**Campaigns** (`/campaigns`) — Group drafts into campaigns (e.g., one report → multiple tweets).

**Alerts** (`/alerts`) — Subscribe to on-chain or market alerts, get notified via Telegram.

**Admin Dashboard** (`/admin/dashboard`) — God-mode command center (ADMIN users only):
- **Team Access tab**: Feature matrix showing which roles (Owner/Admin/Analyst) can see each feature. Toggle switches persist to DB. Team roster grouped by role with inline role promotion.
- **Intelligence tab**: Platform Pulse KPIs, Atlas Score leaderboard, Top Content this week, Engagement Accuracy chart, adoption metrics, activity feed.

---

## Known Limitations

- `/analytics` can crash on empty data — don't worry about it yet
- Onboarding tour is live but some targets are still wiring up — click through it, then explore manually
- No custom domain yet (delphi-atlas.vercel.app is the real URL)

---

## First Steps

1. Go to https://delphi-atlas.vercel.app
2. Log in with X (Twitter) — connect X first, before anything else
3. Complete the onboarding flow — it sets up your voice profile
4. Go to `/briefing` to see today's brief, click "Craft from this" to test the core flow
5. Go to `/crafting` and paste any Delphi research article to generate a tweet

---

## Feedback
DM Alex or drop notes in Notion. What matters: Does the voice feel right? Is the angle selector useful? What's broken or confusing?
