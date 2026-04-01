# AGENTS.md — Atlas Portal (Codex Context)

## Project
Atlas Portal — Next.js 14 frontend for a tweet-crafting platform serving crypto analysts. Personalized voice/tonality system.

## Stack
- Next.js 14 (App Router), React 18, TypeScript 5
- Tailwind CSS 3.4, Framer Motion 12
- Jest 30 + @testing-library/react
- Deployed on Vercel

## Structure
```
src/
  app/           — Next.js App Router pages
    alerts/      — Alert management UI
    analytics/   — Usage analytics dashboard
    crafting/    — Tweet crafting workspace (core feature)
    dashboard/   — Main dashboard
    onboarding/  — User onboarding flow
    profile/     — User profile settings
    voice-profiles/ — Voice/tonality configuration
  components/
    layout/      — App shell, sidebar, navigation
    ui/          — Reusable UI components
  lib/           — API client, auth, tokens, utilities
  __tests__/     — Test files mirroring src structure
```

## Commands
- `npm test` — Run Jest test suite
- `npm run build` — Next.js production build (equivalent to `next build`)
- `npm run dev` — Development server
- `npm run lint` — ESLint

## Branch Convention
- All Codex branches: `codex/{description}`
- Target branch: `staging` (never push directly to `main`)

## PR Convention
- PR title: concise description of the change
- Target: `staging`

## DO NOT MODIFY
- `.github/workflows/` — CI configuration
- `vercel.json` — Deployment config
- `src/lib/tokens.ts` — Design token definitions (source of truth for colors)
- `src/lib/auth.tsx` — Auth provider (shared state)

## Coding Standards
- Prefer server components; use `'use client'` only when needed
- All colors from `src/lib/tokens.ts` — never hardcode hex values
- One component per file
- Use the typed API client at `src/lib/api.ts` — don't create new fetch calls
- Glass card pattern: `bg-glass backdrop-blur-xl border border-glass-border rounded-2xl`
- Headings: `font-heading` (Playfair Display), Body: `font-body` (Inter)

## Testing Patterns
- Jest with @testing-library/react
- Component tests use `render()` + assertions on DOM elements
- Pattern: `describe('ComponentName')` → `it('should ...')` blocks
- Use `toHaveClass()`, `toBeInTheDocument()`, `toHaveTextContent()`
- Test files at `src/__tests__/components/` or `src/__tests__/lib/`
