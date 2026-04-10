# The Oracle — Product Spec

**Task:** #162
**Status:** Scoping
**Last updated:** 2026-04-10
**Owner:** Atlas / Delphi OS

> The Oracle is Atlas's conversational guide. Not a chatbot. Not a help widget. The Oracle is the in-product voice of DELPHI OS — the thing that greets new analysts, teaches them how their own voice works, and then rides shotgun every time they open the app.

---

## 1. What is The Oracle

### Role
The Oracle is the **conversational interface layer** over Atlas. Every piece of intelligence Atlas produces — voice calibration, signal detection, draft generation, analytics, alerts — can be surfaced, explained, and acted on through the Oracle.

It has three simultaneous jobs:

1. **Onboarder** — walks a new user from "just logged in" to "calibrated voice + saved blend + watched topics" in a single chat thread. (Already built — see `OracleChat.tsx`.)
2. **Copilot** — a persistent floating widget on every post-login page that answers questions, executes actions (draft, schedule, navigate, calibrate), and narrates results. (Already built — see `FloatingOracle.tsx` + `oracle-agent.tsx`.)
3. **Ambient guide** — contextual nudges embedded inside pages (`OracleWidget.tsx`) that surface the most useful thing on that page right now (e.g., dashboard: "You have 3 drafts and none shipped — pick one to post").

### Persona
- **Smart, not robotic.** Oracle talks like a trusted analyst, not a support bot.
- **Concise.** Short sentences. Line breaks over paragraphs. Never more than 2-3 bullets.
- **Never condescending.** Treats the user as a peer who knows their domain (crypto) better than Oracle does.
- **Confident when it should be, humble when it shouldn't.** "I scanned 200 tweets — here's what I see" vs. "I'm not sure yet, can you show me an example?"
- **Uses first person.** "I'll scan your tweets" not "The system will scan your tweets."
- **No emojis. No exclamation marks. No "Great question!"** — feels AI-slop.

### Tone examples (pulled from current `oracle-messages.ts`)
- Welcome: *"Welcome. I am The Oracle. I'm going to learn how you write so I can help you craft tweets that sound like you — but sharper."*
- Style pick: *"No worries, I got you. There's no wrong way to do this. We're going to build your voice from scratch."*
- Handoff: *"You're all set. I'll keep learning as you use Atlas. I'm the same brain on Telegram."*

These land. The spec below extends that register everywhere Oracle appears.

### Voice rules
- Guide, not assistant. Oracle **leads** the user through decisions rather than waiting for commands.
- Actions are **labelled in Oracle's voice** — "I'll scan your tweets" not "Start scan."
- Errors are honest: *"Calibration unavailable — I couldn't reach X. We can continue without it and calibrate later."* Not a red banner.

---

## 2. Onboarding Flow

Onboarding is a single chat thread with typed messages, inline interactive components, and a Continue button in an action zone. The whole flow is a state machine driven by `OracleStep`.

### Phases

| # | Step (`OracleStep`) | What Oracle says | What user does | Adapts based on |
|---|---|---|---|---|
| 0 | `WELCOME` | Introduces itself. Explains what's about to happen. Offers two tracks. | Picks **Track A (Connect X)** or **Track B (manual)**. | First-time vs. returning OAuth state. |
| 1a | `CONNECT_X` | "Let's link your X account. I'll sync your display name, bio, avatar, handle, then scan your tweets." | OAuth handoff to X. | If already linked, auto-advances. |
| 2a | `TRACK_A_SCANNING` | "Scanning now... give me a moment." | Watches progress. | Tweet count found drives follow-up line. |
| 3a | `TRACK_A_RESULT` | "Here's what I think your voice looks like. Adjust anything that feels off — most people tweak 2-3 dimensions." | Tweaks dimensions. | LLM-generated commentary explaining the profile is appended. |
| 4a | `TRACK_A_RATE` | "I generated a few tweets in your voice. Rate them — thumbs up means more like you." | Thumbs up/down 4 sample tweets. | Ratings feed back into voice profile (future). |
| 1b | `TRACK_B_STYLE` | "No worries, I got you. We're going to build your voice from scratch." | Picks Fun / Serious / Custom mix. | Style choice seeds default dimensions via `styleToDimensions()`. |
| 2b | `TRACK_B_CONTENT` | "Got any tweets or articles that match the style you want? Drop them here — I'll use them as individual style signals." | Pastes URLs / drops files. Optional. | Populates `ContentSignalsPreview`. |
| 3b | `TRACK_B_DIMENSIONS` | "Now let's dial in each dimension. I've set defaults based on your style choice." | Adjusts sliders. | Defaults differ per style. |
| 5 | `REFERENCES` | "Now pick some voices you admire. I'll blend elements of their style with yours. Most people pick 2-4." | Selects reference accounts. | Must pick ≥2 to continue. |
| 6 | `BLEND` | "How much should I lean on your style vs. theirs?" | Drags slider (self %). | Live preview button calls `api.oracle.message` for generated sample. |
| 7 | `TOPICS` | "Last thing — what topics should I watch for you?" | Picks topics. | Must pick ≥1. |
| 8 | `HANDOFF` | "You're all set. I'll keep learning as you use Atlas. I'm the same brain on Telegram." | Connects Telegram (optional) → goes to `/dashboard`. | Terminal — no back from here. |

### How Oracle adapts during onboarding
- **OAuth state** — If the user returns from X OAuth mid-flow, `OracleChat` resumes directly in Track A (see `resumeTrackAAfterOAuth` in `OracleChat.tsx`).
- **Calibration result** — After scanning, Oracle appends a personalized line using the real `calibration.analysis` string from the backend, *then* fetches supplementary LLM commentary via `api.oracle.message` and enqueues it.
- **Blend preview** — Blend step calls `api.oracle.message` with `action: "blend-preview"` and appends a generated sample tweet in the chosen blend.
- **Can-advance gating** — The reducer's `canAdvance(state)` enforces minimum interactions before the Continue button enables (e.g., REFERENCES requires ≥2 picks).
- **Back navigation** — `GO_BACK` action + `stepHistory` stack lets users rewind up to 10 steps. Message list truncates to what existed at that step.

### UX principles inside the flow
- **Typing indicator between messages.** Delay scales with word count (`wordCount * 40ms`, clamped 300-1200ms). Feels alive without feeling slow.
- **Oracle speaks in multiple short bubbles** instead of one long message. Drain queue is in `pendingMessages`.
- **Inline components, not modals.** Everything interactive (OAuth, dimensions, style picker, references, blend, topics) renders *inside* the chat bubble.
- **ActionZone is the only Continue.** Users never hunt for a button — it's always pinned to the bottom when the step is done.

---

## 3. Post-Onboarding Appearances

Oracle appears in **three** distinct surfaces after onboarding, each with a different trigger model.

### A. `FloatingOracle` — persistent bottom-right widget
**Where:** Every post-login page, mounted in `AppShell.tsx`.
**Triggered by:** Always present. Bubble badge lights up when there's an unread contextual nudge (page change).
**What it does:**
- Shows a contextual nudge on first open for every page (`getNudge(pathname)` in `FloatingOracle.tsx`).
- Full conversational agent with tool-calling (via `oracle-agent.tsx` → `/api/oracle/agent`).
- Can execute actions: `navigate`, `generate_draft`, `list_drafts`, `get_voice_profile`, `get_analytics_summary`, `get_trending`, `get_signals`, `conduct_research` (read-only auto-execute) and `refine_draft`, `schedule_draft`, `post_draft`, `calibrate_voice`, `update_voice_dimension`, `subscribe_signal`, `generate_briefing` (confirmation-gated).
- Quick actions: "Draft a tweet", "Check analytics", "View signals", "Tune my voice".

### B. `OracleWidget` — inline page banner
**Where:** Dashboard (`src/app/dashboard/page.tsx` line 196) — currently the only place. **Planned:** Crafting, Alerts, Voice Profiles, Analytics.
**Triggered by:** Page load. Message adapts based on user stats (drafts vs. posts ratio).
**What it does:** One-line personalized nudge with an action button that routes somewhere useful.

### C. Oracle-generated messages inside other pages
**Planned, not built:** Oracle-authored lines embedded in native page UI — e.g., "Your humor is calibrated 15 points higher than last week's posts — that's a voice drift" on Voice Profiles, or "This signal has shifted 3 hours ago — angle probably changed" on a signal card.

### Trigger matrix

| Surface | Trigger | Example |
|---|---|---|
| Floating (nudge) | Page change | Dashboard: "Welcome back. What would you like to work on today?" |
| Floating (agent) | User opens widget + types | "Draft a tweet about restaking" → generates + confirms |
| Inline banner | Page load + stats | Dashboard: "You've crafted 3 drafts — time to post one." |
| Voice drift | Background check (planned) | Voice Profiles: "Your last 10 posts are 12% more formal than your profile." |
| Signal relevance (planned) | New signal matches watched topic | Alerts: "ETH restaking just spiked. You watch this — want an angle?" |
| Crafting assist (planned) | User stares at empty input >30s | Crafting: "Stuck? Here are 3 angles on today's top signal." |
| Post-publish (planned) | Tweet published via Atlas | Any page: "Your restaking take landed — 24 likes in 10min. Above your average." |

### Escalation rules
- Oracle **never interrupts mid-task.** It waits for natural breakpoints (page change, empty input state, post-publish).
- Nudges are **dismissible** (`OracleWidget` has a close button) and **not repeated** in the same session unless context materially changes.
- Floating bubble has an unread dot, not a toast or modal. User controls when to open.

---

## 4. Content Signals Integration

**Status:** Shipped in PR merged as `ca2b65e` (content-signals inline renderer in `OracleChat`). The `ContentSignalsPreview` component renders a 2-4 card grid of detected signals from content the user drops in Track B.

### What content signals are
Compact cards — icon + label + value — that represent things Oracle has noticed about content the user has shared with it. Current shape (`ContentSignal` type in `ContentSignalsPreview.tsx`):

```ts
{ icon: LucideIcon, label: string, value: string, tone: "teal" | "amber" | "violet" | "rose" }
```

Default examples: Trending topic, Engagement spike, Best time to post, Voice match.

### How Oracle uses them
1. **In onboarding Track B** — When the user drops tweet URLs / reports in `TRACK_B_CONTENT`, Oracle renders `ContentSignalsPreview` with the signals it extracted from that content. This is how Oracle teaches the user what Atlas can see in their content before they commit to a voice.
2. **In crafting (planned)** — When a user drops a report into the Crafting Station, Oracle should render a signal card grid explaining what it found: trending angle, voice match confidence, best time to post, similar past drafts.
3. **In alerts/signals page (planned)** — Every alert card gets an Oracle interpretation line: "This matches your Humor 65 / Contrarian 80 profile — you'd crush a 2-tweet thread here."
4. **In analytics (planned)** — Signal cards explaining *why* a post performed (time, topic, voice match) rather than just the raw engagement number.

### Data contract (proposed, not yet implemented)
```ts
interface ContentSignalsResponse {
  signals: ContentSignal[];     // 2-4 cards, each with display shape above
  narrative: string;            // One-line Oracle summary
  confidence: "high" | "med" | "low";
  sourceRef?: string;           // What content generated these
}
```

Backend endpoint: `POST /api/oracle/signals` — accepts `{ content: string | url[], context?: page }`.

### Oracle's job with signals
Oracle is the **narrator** of signals, not just their display layer. Whenever a signal appears in the UI, Oracle should have an opinion about it in plain English — and that opinion should appear in a speech bubble, not a static label.

---

## 5. State Machine Overview

### Current states (in `oracle-types.ts`)
```
WELCOME
  ├─ track-a → CONNECT_X → TRACK_A_SCANNING → TRACK_A_RESULT → TRACK_A_RATE ┐
  └─ track-b → TRACK_B_STYLE → TRACK_B_CONTENT → TRACK_B_DIMENSIONS ────────┤
                                                                             │
                                                  REFERENCES ◄──────────────┘
                                                      ↓
                                                    BLEND
                                                      ↓
                                                    TOPICS
                                                      ↓
                                                   HANDOFF (terminal)
```

Transitions live in `NEXT_STEP` map (`oracle.ts` line 6). Gating lives in `canAdvance()`. State persists in `OracleState` with a `stepHistory` stack for back navigation.

### Inline component types (`InlineComponentType`)
`x-oauth`, `scan-progress`, `dimensions`, `tweet-ratings`, `style-picker`, `references`, `blend`, `topics`, `content-signals`, `handoff-telegram`.

### What's built
- [x] Full 11-step state machine + reducer
- [x] Message queue with typing-indicator drain
- [x] Back navigation (up to 10 steps)
- [x] All 10 inline components
- [x] Track A calibration via `api.voice.calibrate` + LLM commentary overlay
- [x] Track B content signals renderer (PR #230 equivalent)
- [x] Blend preview tweet generation via `api.oracle.message`
- [x] OAuth resume flow
- [x] Persistence after each step (voice profile, references, blend, topics)
- [x] Floating widget with full tool-calling agent (`oracle-agent.tsx`)
- [x] Action executor covering 15 action types
- [x] Per-page contextual nudges
- [x] Inline `OracleWidget` on dashboard

### What's missing
- [ ] **Oracle memory across sessions.** Today every `FloatingOracle` conversation starts fresh. Oracle should remember the last 5 things it did for this user.
- [ ] **Voice drift detection.** No background process comparing recent post dimensions against saved profile. The "voice drift" nudge surface doesn't exist yet.
- [ ] **Signal-relevance surfacing.** The alerts page doesn't have Oracle interpretations on signal cards.
- [ ] **Crafting page Oracle help.** No "I notice you're stuck" nudge, no signal extraction on content drop.
- [ ] **Post-publish reactions.** Oracle doesn't speak after a tweet publishes.
- [ ] **Signals API endpoint.** `POST /api/oracle/signals` doesn't exist — signals today are hardcoded defaults in `ContentSignalsPreview`.
- [ ] **Inline-page Oracle messages** (not widgets, not floating — native voice lines embedded in page UI) beyond the dashboard banner.
- [ ] **Escalation logic.** Today the floating widget shows nudges on every page change regardless of recency. No "don't repeat within N minutes" throttle.
- [ ] **Richer onboarding telemetry.** We don't log which step users abandon, how long they spend at each step, or which content signals actually drive style confidence.

---

## 6. Key UX Principles

1. **Concise.** Never more than 2 sentences per bubble, never more than 3 bubbles before a user interaction is needed. If Oracle has a lot to say, break it across interactive beats.
2. **Actionable.** Every Oracle message should either (a) end in a question, (b) offer an inline component, or (c) have an action button. No dead-end text.
3. **Never interrupts.** Oracle waits for natural breakpoints. No toasts, no modals, no notification sounds. The floating bubble gets an unread dot — the user decides when to open.
4. **Escalates gracefully.** Unknown query → chat answer. Chat answer needs data → read-only action auto-executes. Action changes state → confirmation required. User confirms → Oracle narrates the result. Chain breaks → Oracle admits it and offers a fallback.
5. **Explains its work.** When Oracle does something (calibrates, generates, schedules), it tells the user *what* it did and *why*. No black-box actions.
6. **Voice consistency.** Oracle sounds identical in onboarding, in the floating widget, on the dashboard banner, and on Telegram. Same persona, same register, same first-person voice.
7. **Fallback without shame.** When Oracle can't do something (API down, auth missing, confidence low), it says so directly and offers the next-best option. Never blank errors.
8. **Discoverability through bounce, not pop-ups.** The floating bubble subtly animates on load (`subtle-bounce` keyframe) to attract the eye. No interstitials, no mandatory tours.

---

## 7. Next 3 Implementation Priorities

Based on what exists and what's missing, the highest-leverage work is:

### Priority 1 — Content Signals API + Oracle narration on Crafting page
**Why:** The inline renderer exists but is fed hardcoded defaults. The real win is when a user drops a report into the Crafting Station and Oracle extracts real signals (trending angle, voice match, similar past drafts) and narrates them in a chat bubble.
**Scope:**
- Build `POST /api/oracle/signals` backend endpoint returning real signals from dropped content.
- Add Oracle narration widget to `/crafting` that renders `ContentSignalsPreview` + a one-line Oracle summary under it.
- Wire `FloatingOracle` quick action "Interpret this for me" to call the same endpoint with the current draft content.

### Priority 2 — Voice Drift Detection + Oracle nudge on Voice Profiles
**Why:** The promise of Atlas is a living voice that sharpens over time. Today there's no surface that tells users when their real posts have drifted from their calibrated profile. This is the single highest-value Oracle nudge we can build.
**Scope:**
- Backend: compare last 10 published tweets' inferred dimensions against saved profile. Return a `{ drifted: boolean, dimensions: {field, delta}[], narrative: string }` object.
- Frontend: on `/voice-profiles` page load, call the endpoint and show an Oracle message ("Your last 10 posts are 12% more formal than your profile — want me to update it?") with a confirm action that triggers `calibrate_voice` or `update_voice_dimension`.
- Extend `FloatingOracle` contextual nudge on `/voice-profiles` to use this data when available.

### Priority 3 — Oracle Memory: cross-session conversation continuity
**Why:** Today every `FloatingOracle` conversation is a cold start. This kills the "smart, not robotic" persona. Memory of the last N interactions is the single change that makes Oracle feel like the same brain the user talked to yesterday.
**Scope:**
- Backend: persist Oracle conversations (last 50 messages per user) in the existing DB. Include executed action history.
- Frontend: `oracle-agent.tsx` loads the last 20 messages on mount instead of starting empty. Opening the floating widget shows the last conversation, not a blank slate.
- Add a "Clear conversation" action in the widget header so users can reset when they want to.
- Persist across pages so navigating doesn't lose context.

---

## Appendix A — Key Files

| File | Purpose |
|---|---|
| `src/components/onboarding/OracleChat.tsx` | Onboarding chat UI — state machine consumer, inline component renderer, persistence side effects |
| `src/components/onboarding/OracleAvatar.tsx` | Avatar component used in onboarding header + messages |
| `src/components/onboarding/OracleMessage.tsx` | Single message bubble renderer |
| `src/components/onboarding/TypingIndicator.tsx` | Animated "..." typing indicator |
| `src/components/onboarding/ActionZone.tsx` | Bottom pinned Continue / action buttons |
| `src/components/onboarding/ContentSignalsPreview.tsx` | 2-4 card signal grid inline in chat |
| `src/components/oracle/OracleWidget.tsx` | Inline page banner (currently only on dashboard) |
| `src/components/oracle/FloatingOracle.tsx` | Persistent bottom-right chat widget on all post-login pages |
| `src/lib/oracle-types.ts` | `OracleState`, `OracleStep`, `OracleAction`, `ChatMessage`, `InlineComponentType` |
| `src/lib/oracle-messages.ts` | `ORACLE_MESSAGES` map — every scripted Oracle line, keyed by step |
| `src/lib/oracle.ts` | `oracleReducer`, `canAdvance`, `NEXT_STEP`, `initialOracleState` |
| `src/lib/oracle-agent.tsx` | React context + provider for the floating widget's tool-calling agent |
| `src/lib/oracle-agent-types.ts` | `OracleAgentAction`, `OracleActionResult`, `AgentChatMessage`, action type union |
| `src/lib/oracle-action-executor.ts` | Executes agent actions (navigate, generate_draft, etc.) and returns results |
| `src/lib/api.ts` (lines 573-622) | Oracle API client: `message`, `chat`, `agent` |
| `src/app/dashboard/page.tsx` (lines 196-207) | Only current inline `OracleWidget` usage |
| `src/components/layout/AppShell.tsx` (line 59) | Where `FloatingOracle` is mounted globally |

## Appendix B — Open Questions

1. **Should Oracle memory be server-side or local?** Server-side enables Telegram parity but has privacy implications. Local is simpler but loses cross-device continuity.
2. **Should Oracle take actions that cost money (post to X, publish a draft) without confirmation?** Current default is no — every state-changing action has `requiresConfirmation: true`. Worth revisiting per action type.
3. **Who owns Oracle's "voice of Oracle" — product, design, or engineering?** Scripted messages currently live in code (`oracle-messages.ts`). As we add LLM-generated variants, we need a copy review loop.
4. **How does Oracle handle multi-user teams?** Today Oracle is 1:1 with a user. Team Style Library exists — does Oracle speak differently when a team admin is asking vs. an analyst?
5. **Is the Telegram Oracle literally the same brain?** Handoff screen says it is. Architecturally, `api.oracle.chat` / `api.oracle.agent` could be shared between portal + Telegram bot, but this needs verification.
