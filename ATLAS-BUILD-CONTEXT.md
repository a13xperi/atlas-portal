# Atlas Build Context — Shared Multi-Agent Protocol
# Last updated: 2026-04-03
# All AI tools: READ THIS FIRST before doing any work.

## SESSION COORDINATION (NEW — Apr 3, 2026)
Multiple CC sessions + Codex tasks run concurrently. Coordination via:
- **Supabase** `session_locks` table (project `zoirudjyqfqvpxsrxepr`) — atomic task locking
- **`.coordination/STATUS.json`** — machine-readable state (active sessions, claimed files, do_not_touch)
- **`.coordination/CODEX-BRIEFING.md`** — Codex reads this to avoid claimed files
- **Notion Build Tracker `Claimed By` field** — session ID of who owns the task
Before modifying any file, check `.coordination/STATUS.json` `do_not_touch` array.
Use `/claim-task` to lock work. Use `/sync-coordination` after completing work.

## PROJECT OVERVIEW
Atlas is a content-to-tweet platform for crypto analysts at Delphi Digital.
Frontend: Next.js 14, Tailwind, deployed on Vercel (delphi-atlas.vercel.app)
Backend: Express, Prisma, PostgreSQL, Redis, deployed on Railway
GitHub: a13xperi/atlas-portal (this repo), a13xperi/atlas-backend (backend)
Branch: main (auto-deploy)

## ARCHITECTURE
Browser → Vercel (Next.js 14) → Railway (Express) → PostgreSQL + Redis
AI Providers (4): OpenAI gpt-4o, Anthropic Claude, Gemini Flash, Grok-3
External: Supabase Auth, Telegram, Sentry, X/Twitter
Stats: 51 backend files (~4K LOC), 12 frontend routes, 10 components,
16 Prisma models, 4 AI providers, 35+ endpoints

## FILE OWNERSHIP — CRITICAL: DO NOT VIOLATE
Claude Code owns: src/lib/*, src/app/layout.tsx, src/app/providers.tsx
Codex owns: src/app/**/page.tsx, src/components/*, src/styles/*
Cursor owns: src/app/*/error.tsx, src/types/*, src/__tests__/*, *.test.ts
Warp owns: deployment only, no file edits
SHARED (coordinate first): README.md, .env.example, .github/*, ATLAS-BUILD-CONTEXT.md, TASK-STATUS.md

## COMMIT FORMAT
[tool] type: description
Examples: [codex] fix: remove fake alerts from alerts/page.tsx

## CONFLICT RULES
1. NEVER modify files outside your lane
2. ALWAYS git pull before starting work
3. ALWAYS push immediately after committing
4. If merge conflict: STOP, note in TASK-STATUS.md

## KNOWN P0 ISSUES
1. Alert feed exposes ALL users' alerts (backend: routes/alerts.ts) → Claude Code (atlas-backend repo)
2. /analytics crashes on empty data → Cursor
3. No error.tsx on 10/12 routes → Cursor
4. Sentry DSN hardcoded in backend lib/config.ts → Claude Code (atlas-backend repo)

## DATABASE SCHEMA
User → VoiceProfile (1:1), ReferenceVoice (1:n), SavedBlend (1:n)
User → TweetDraft (1:n), AlertSubscription (1:n), Alert (1:n)
Enums: Role (ANALYST/MANAGER/ADMIN), OnboardingTrack, DraftStatus

## FRONTEND ROUTES (src/app/)
page.tsx (login), dashboard/, onboarding/, crafting/, voice-profiles/,
alerts/, analytics/, management/, telegram/, profile/, search/, team-library/

## AUTH FLOW
Login → JWT + HttpOnly cookies → sessionStorage Bearer fallback
Dual-mode: Supabase JWT + legacy JWT
Use useAuth() from src/lib/auth.tsx — provides { user, token, login, register, logout }

## DESIGN SYSTEM
Colors: src/lib/tokens.ts (never hardcode hex)
Glass cards: bg-glass backdrop-blur-xl border border-glass-border rounded-2xl
CTAs: bg-gradient-to-r from-delphi-teal to-delphi-teal/60
Headings: font-heading (Playfair Display), Body: font-body (Inter)
API client: src/lib/api.ts (typed — use it, don't create new fetch calls)

## DESIGN PHILOSOPHY — HUMAN FIRST (core directive, Apr 2026)
Atlas must feel human and accessible, not technical and abstract.
User feedback (Anil): "too technical", "too abstract", "hard to wrap your head around".

Frontend implications:
- Personify everything: voices get real faces (Twitter avatars), not just handles or labels
- Concrete over abstract: "70% Naval" with Naval's actual face beats "70% reference_voice_3"
- Show before describe: render a face, a bar, a familiar metaphor — always before a label
- Accessible to analysts, not engineers: no jargon without context, no numbers without meaning
- Voice dimensions → frame as personality traits with anchors, not 0-100 sliders
- Blends → stack the faces of who you're mixing with, not just percentages
- Scores → plain language alongside the number
- Every new UI feature must pass: "does this require thought to interpret?" If yes, make it more human first.

## AI ROUTING
OpenAI gpt-4o → tweets, Anthropic → research, Gemini → images, Grok → trending
