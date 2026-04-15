# Atlas Portal

Content-to-tweet crafting platform for crypto analysts. Personalized voice/tonality calibration, analytics, team management, and publishing workflow.

Built by [Delphi Digital](https://delphidigital.io).

## Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + design tokens (`src/lib/tokens.ts`)
- **Auth:** Supabase Auth via `useAuth()` (`src/lib/auth.tsx`)
- **API:** Typed client at `src/lib/api.ts` → backend at `api-production-9bef.up.railway.app`
- **Fonts:** Playfair Display (headings), Inter (body)
- **Monitoring:** Sentry

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing / auth redirect |
| `/dashboard` | Overview — KPIs, recent activity |
| `/crafting` | Tweet drafting with voice calibration |
| `/analytics` | Performance metrics and insights |
| `/voice-profiles` | Manage analyst voice/tonality settings |
| `/team-library` | Shared content and templates |
| `/management` | Team and subscription management |
| `/alerts` | Notification center |
| `/profile` | User settings |
| `/onboarding` | New user setup flow |
| `/telegram` | Telegram bot integration |
| `/search` | Content and user search |

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (must pass 0 errors)
npm run lint
npm run test
```

This repo is the **frontend** (Next.js on Vercel). The **backend** is [atlas-backend](https://github.com/a13xperi/atlas-backend) (Express on Railway). Clone both as sibling directories, then open [`atlas.code-workspace`](./atlas.code-workspace) in Cursor or VS Code to load frontend + API in one multi-root workspace.

## Environments

| Env | Frontend | Backend |
|-----|----------|---------|
| Production | https://delphi-atlas.vercel.app | https://api-production-9bef.up.railway.app |
| Staging | https://staging-delphi-atlas.vercel.app | https://api-staging-287d.up.railway.app |

## Branching

- `main` → Production (protected, PR + CI required)
- `staging` → Staging (CI required)
- Never push directly to `main`. All changes flow through `staging` first.
- Branch naming: `lane/portal-{description}`

## Coding Standards

- All colors from `src/lib/tokens.ts` — never hardcode hex values
- One component per file
- Use `src/lib/api.ts` typed client — don't create new fetch calls
- Auth via `useAuth()` from `src/lib/auth.tsx`
- Glass cards: `bg-glass backdrop-blur-xl border border-glass-border rounded-2xl`
- CTAs: `bg-gradient-to-r from-delphi-teal to-delphi-teal/60`
- Server components by default; `'use client'` only when needed
- Run `next build` after every change to verify zero errors

## Related

- **Session prompts (multi-root):** [ATLAS-WORKSPACE-PROMPT.md](./ATLAS-WORKSPACE-PROMPT.md) — copy-paste context for portal + backend agents
- **Backend:** [atlas-backend](https://github.com/a13xperi/atlas-backend) — Express + Prisma + PostgreSQL
- **Figma:** File key `XYp41bfZdl8O00QCJqAdaK`
- **CLAUDE.md:** Full workspace rules, auto-behaviors, skills, and lane protocol
