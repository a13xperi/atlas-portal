# CLAUDE.md — Atlas Employee Portal (Frontend)

## Project
Atlas by Delphi Digital — a content-to-tweet crafting platform with personalized voice/tonality for crypto analysts.
"Voice" = writing style/tonality (dimensions: Humor, Formality, Brevity, Contrarian tone), NOT literal audio.

## Stack
- Next.js 14 (App Router, `src/app/` directory)
- React 18 with TypeScript
- Tailwind CSS 3.4+ with custom design tokens
- Framer Motion for animations
- Lucide React for icons

## Repositories
- Frontend: https://github.com/a13xperi/atlas-portal
- Backend: https://github.com/a13xperi/atlas-backend

## Environments

| Tier | Frontend (Vercel) | Backend (Railway) |
|------|------------------|-------------------|
| Production | https://delphi-atlas.vercel.app | https://api-production-9bef.up.railway.app |
| Staging | https://staging-delphi-atlas.vercel.app | TBD (Railway staging env) |
| Preview | Auto per PR (`*.vercel.app`) | Hits staging backend |

Health check: https://api-production-9bef.up.railway.app/health

## Branching & Deploy Flow
- `main` → Production (protected: PR + CI required)
- `staging` → Staging (CI required)
- `feat/*`, `fix/*` → PR to `staging` → merge → test → PR to `main` → merge to prod
- **Never push directly to `main`.** All changes flow through `staging` first.
- `NEXT_PUBLIC_API_URL` is set per environment in Vercel dashboard — no hardcoded fallback.

## Architecture
```
src/
  app/
    layout.tsx          # Root layout — fonts, providers
    providers.tsx       # AuthProvider wrapper
    page.tsx            # Login (Page 1) — wired to backend
    dashboard/page.tsx  # Dashboard (Page 5) — wired to backend
    onboarding/
      track-a/page.tsx  # Track A (Page 2)
      track-b/page.tsx  # Track B (Page 3)
      handoff/page.tsx  # Post-Onboarding (Page 4)
    crafting/page.tsx   # Crafting Station (Page 6)
    voice-profiles/page.tsx  # Voice Profiles (Page 7) — wired to backend
    team-library/page.tsx    # Team Style Library (Page 8)
    alerts/page.tsx     # Alerts + Momentum (Page 9)
    analytics/page.tsx  # Analytics + Predictions (Page 10) — wired to backend
    management/page.tsx # Management Dashboard (Page 11)
    telegram/page.tsx   # Telegram Setup Guide (Page 12)
    profile/page.tsx    # Profile (placeholder)
    search/page.tsx     # Search (placeholder)
  components/
    ui/                 # Shared primitives
      GlassCard.tsx
      GradientButton.tsx
      DimensionBar.tsx
      ContentInput.tsx
      StatusPill.tsx
      NavBar.tsx
      ProgressBar.tsx
    layout/
      AppShell.tsx      # Dark app layout (post-login)
      OnboardingShell.tsx # Nature bg + glass card layout
  lib/
    api.ts              # Typed API client for all backend endpoints
    auth.tsx            # Auth context — useAuth() gives { user, token, login, register, logout }
    tokens.ts           # Design token constants
    fonts.ts            # Playfair Display + Inter setup
```

## Backend API
The API client at `src/lib/api.ts` has typed methods for every endpoint. Use it — don't create new fetch calls.

Key endpoints:
- `api.auth.register/login/me` — authentication
- `api.voice.getProfile/updateProfile` — voice dimensions
- `api.voice.getReferences/addReference` — reference voices
- `api.voice.getBlends/createBlend` — saved blends
- `api.drafts.list/get/create/update/delete` — tweet drafts
- `api.analytics.summary/learningLog/engagement/team` — analytics
- `api.alerts.feed/subscriptions/subscribe` — alerts

Auth: `useAuth()` from `src/lib/auth.tsx` provides `{ user, token, login, register, logout }`. JWT stored in localStorage.

## Design System Rules
- ALL colors come from Tailwind config / tokens.ts — never hardcode hex values
- Glass cards: bg-glass, backdrop-blur-xl, border border-glass-border, rounded-2xl
- CTAs: bg-gradient-to-r from-atlas-teal to-atlas-steel
- Dark surfaces: bg-atlas-surface
- Cards always rounded-2xl (16px), inputs always rounded-lg (8px)
- Headings: font-heading (Playfair Display, serif)
- Body: font-body (Inter, sans-serif)
- Content input zones are ALWAYS primary — drop zones for reports/articles/tweets are the hero UI
- Mic/voice note input is secondary — smaller, positioned below or beside the content zone

## NavBar
- Logo → /dashboard
- Page links: Dashboard, Crafting, Library, Analytics, Team (hidden on mobile)
- Search icon → /search
- Bell icon → /alerts (highlights teal when active)
- Avatar → /profile (shows authenticated user's initial)

## Conventions
- Use 'use client' only when needed (interactivity, state, effects)
- Prefer server components by default
- One component per file
- Tailwind classes only — no CSS modules, no styled-components
- Run `next build` after every change to verify zero errors

## Figma
- File key: XYp41bfZdl8O00QCJqAdaK
- Use Figma API with `X-Figma-Token` header to pull specs
- 11 frames in file (no frame for Track B)

## Notion
- Master build sheet page ID: 980892391d9f41e09433947186d58f27
- Build Tracker database in Notion — update after completing tasks

## CI
- GitHub Actions runs on PRs to `staging` and `main`: TypeScript check + lint
- Branch protection requires CI to pass before merge

## What's Next
1. Wire remaining pages to backend (Alerts, Management, Team Library)
2. Telegram bot service
3. AI integration — Claude API for tweet generation
4. Railway: set up staging environment with separate DB/Redis
