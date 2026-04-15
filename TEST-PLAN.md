# Atlas QA Test Plan

**URL:** https://delphi-atlas.vercel.app
**Last updated:** 2026-04-12
**Estimated time:** 15 minutes (full pass)

**Status key:** PASS | FAIL | PARTIAL | NOT TESTED
**Severity key:** P0 = blocker, P1 = major, P2 = minor, P3 = cosmetic

---

## 1. Onboarding (first-time user)

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| OB-01 | Sign in with X | Click "Sign in with X" on login page | OAuth flow opens, redirects back after authorization | P0 | |
| OB-02 | Redirect to onboarding | Complete X sign-in as a new user | Lands on `/onboarding` page, not dashboard | P0 | |
| OB-03 | Track A: X scanning | Click Track A (auto-detect from X) | Shows scanning state, then voice dimension results | P1 | |
| OB-04 | Track A: voice dimensions display | After scan completes | 4 dimension bars shown (Humor, Formality, Brevity, Contrarian) with sensible values | P1 | |
| OB-05 | Track B: manual style picker | Click Track B (manual setup) | Style picker UI loads, can select preferences | P1 | |
| OB-06 | Adjust voice dimensions | Drag a dimension bar left/right | Value updates visually and persists to next step | P1 | |
| OB-07 | Reference voice selection | Reach the reference voice step | Reference voice cards load with avatars and follower counts | P1 | |
| OB-08 | Reference voice: select one | Click a reference voice card | Card highlights, blend ratio slider appears | P2 | |
| OB-09 | Blend ratio slider | Adjust blend slider between your voice and reference | Slider moves, ratio label updates (e.g. 70/30) | P2 | |
| OB-10 | Handoff page | Reach `/onboarding/handoff` | Shows Telegram setup instructions, next-steps guidance | P1 | |
| OB-11 | Redirect to dashboard | Click "Go to Dashboard" or finish onboarding | Lands on `/dashboard` without errors | P0 | |

---

## 2. Voice Lab & Profiles

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| VL-01 | Voice lab page loads | Navigate to `/voice-lab` | Page renders, no blank screen or crash | P0 | |
| VL-02 | Voice dimensions visible | Check voice lab page | 4 dimension bars shown with current values | P1 | |
| VL-03 | Voice profiles page loads | Navigate to `/voice-profiles` | Page renders with your profile and recipe cards | P0 | |
| VL-04 | Recipe cards display | Check voice profiles page | Voice recipe cards show blend info, source names | P1 | |
| VL-05 | Inspiration picker | Click to add/blend a reference voice | Picker opens, shows reference voices | P1 | |
| VL-06 | Blend and save | Select a reference voice, confirm blend | API call succeeds, new blend appears in saved list | P1 | |
| VL-07 | Voice comparison | Open voice comparison on voice-profiles | Can compare your voice to a reference side-by-side | P2 | |
| VL-08 | Reference voices sort | Check reference voice list ordering | Sorted by follower count (highest first) | P3 | |

---

## 3. Crafting Station

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| CS-01 | Crafting page loads | Navigate to `/crafting` | Page renders with content input zone visible | P0 | |
| CS-02 | Create draft from scratch | Type in the content input area, click generate | Draft generates, appears in main view | P0 | |
| CS-03 | Template picker | Click "Start from a template" | 5 templates shown (Hot Take, Thread Starter, Data Insight, Prediction, Question) | P1 | |
| CS-04 | Select a template | Click "Hot Take" template | Input pre-fills with template text | P1 | |
| CS-05 | Drop a PDF | Drag a PDF file onto the content input area | File accepted, text extracted, shown in input zone | P1 | |
| CS-06 | Drop other file types | Try TXT, MD, CSV files | Accepted and text extracted. Unsupported types show error message | P2 | |
| CS-07 | Generate draft (API) | Enter content, click generate | Loading state shows, then draft appears. No API errors | P0 | |
| CS-08 | Regenerate with feedback | Click regenerate, optionally add feedback text | New draft version generated incorporating feedback | P1 | |
| CS-09 | Refine with instructions | Use the refine/edit input to give specific instructions | Draft updates based on instructions | P1 | |
| CS-10 | Voice comparison in crafting | Check for voice comparison display while crafting | Voice dimensions shown alongside draft for reference | P2 | |
| CS-11 | Draft history sidebar | Click sidebar toggle or history icon | Sidebar opens showing previous drafts/versions | P1 | |
| CS-12 | Copy draft to clipboard | Click copy icon/button on a draft | Text copied to clipboard, success toast shown | P1 | |
| CS-13 | Delete a draft | Click delete on a draft | Confirmation prompt, then draft removed from list | P1 | |
| CS-14 | Crafting advisor | Check for AI suggestions/hints | Oracle crafting hints appear contextually | P2 | |

---

## 4. Draft Queue

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| DQ-01 | Queue page loads | Navigate to `/queue` | Page renders with list of drafts | P0 | |
| DQ-02 | Drafts visible | Check queue with existing drafts | Draft cards shown with content preview, status | P0 | |
| DQ-03 | Filter tabs | Click each tab: All, Draft, Scheduled, Posted, Archived | List filters correctly, counts update | P1 | |
| DQ-04 | Drag-and-drop reorder | Drag a draft card to a new position | Card moves, new order persists | P1 | |
| DQ-05 | Schedule a draft | Click schedule icon on a draft, pick date/time | Datetime picker opens, draft moves to Scheduled status | P1 | |
| DQ-06 | Post a draft to X | Click post/publish on a ready draft | API fires, draft moves to Posted status | P0 | |
| DQ-07 | Archive a draft | Click archive on a draft | Draft moves to Archived tab | P2 | |
| DQ-08 | Select all (batch) | Click "Select all" checkbox | All visible drafts selected, batch action bar appears | P1 | |
| DQ-09 | Batch schedule | Select multiple drafts, click batch schedule | All selected drafts get scheduled | P1 | |
| DQ-10 | Batch archive | Select multiple drafts, click batch archive | All selected drafts archived | P2 | |
| DQ-11 | Queue timeline | Check for timeline visualization | Scheduled items grouped by day in timeline view | P2 | |

---

## 5. Analytics

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| AN-01 | Analytics page loads | Navigate to `/analytics` | Page renders without crash, no blank screen | P0 | |
| AN-02 | Summary stats | Check top stats section | Drafts created, feedback count, refinements count shown | P1 | |
| AN-03 | Engagement chart | Scroll to engagement section | Chart renders with data points (or empty state if new user) | P1 | |
| AN-04 | Learning log | Scroll to "Model Learning Log" section | Log entries shown with dates and insights | P2 | |
| AN-05 | PDF export | Click "Export PDF" button | PDF downloads with analytics summary | P2 | |
| AN-06 | Loading skeleton | Navigate to analytics (watch initial load) | Skeleton UI shows before data loads (no blank flash) | P3 | |

---

## 6. Campaigns

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| CA-01 | Campaigns page loads | Navigate to `/campaigns` | Page renders with campaign list or empty state | P0 | |
| CA-02 | Create new campaign | Click create/new campaign button | Campaign creation form or wizard opens | P1 | |
| CA-03 | Campaign wizard | Go to `/campaigns/wizard` | Multi-step wizard loads (source input, angle selection) | P1 | |
| CA-04 | Upload source (PDF/URL) | Drop a PDF or paste a URL in the wizard | Source accepted and processed | P1 | |
| CA-05 | Multiple tweet angles | After source processing | Multiple tweet angle options generated from the source | P1 | |
| CA-06 | Add drafts to campaign | Select angles or add existing drafts | Drafts appear in the campaign view | P1 | |
| CA-07 | View campaign detail | Click into a campaign from the list | `/campaigns/[id]` loads with all campaign drafts | P1 | |

---

## 7. Dashboard

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| DB-01 | Dashboard loads | Navigate to `/dashboard` | Page renders with stats cards, recent drafts | P0 | |
| DB-02 | Recent drafts | Check dashboard content area | Shows recent draft cards with status pills | P1 | |
| DB-03 | Oracle widget | Look for floating Oracle icon or widget | Oracle visible and clickable | P1 | |
| DB-04 | Oracle interaction | Click Oracle, type a question | Response appears in Oracle chat overlay | P1 | |
| DB-05 | Engagement feedback | Find a Posted draft, click to add engagement | Form opens with likes/retweets/impressions fields | P1 | |
| DB-06 | Submit engagement data | Fill in numbers, submit | Data saves, form closes, engagement data shown on card | P2 | |
| DB-07 | Dashboard loading skeleton | Refresh `/dashboard` (watch initial load) | Skeleton UI shows before data loads | P3 | |

---

## 8. Navigation & Global UI

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| NV-01 | NavBar links | Click each nav link (Dashboard, Crafting, Library, Analytics) | Correct page loads, active state highlights | P1 | |
| NV-02 | Logo goes to dashboard | Click the logo in NavBar | Navigates to `/dashboard` | P2 | |
| NV-03 | Search page | Click search icon in NavBar | `/search` page loads | P2 | |
| NV-04 | Alerts page | Click bell icon in NavBar | `/alerts` page loads, bell highlights when active | P2 | |
| NV-05 | Profile page | Click avatar in NavBar | `/profile` page loads showing user info | P2 | |
| NV-06 | Command palette | Press Cmd+K (or Ctrl+K) | Command palette overlay opens with search input | P1 | |
| NV-07 | Command palette navigation | Type a page name in palette, press enter | Navigates to the matching page | P1 | |
| NV-08 | Notification dropdown | Click bell icon | Dropdown shows notifications or empty state | P2 | |

---

## 9. Mobile (375px width)

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| MB-01 | Mobile sidebar menu | Tap hamburger icon (top-right) | Sidebar slides in from left with all nav links | P1 | |
| MB-02 | Close mobile menu | Tap overlay or X button | Sidebar slides out, overlay disappears | P1 | |
| MB-03 | Navigate all pages (mobile) | Tap each nav link from mobile menu | All pages load without horizontal overflow | P1 | |
| MB-04 | Crafting station (mobile) | Open `/crafting` at 375px | Content input and draft output usable, no overlap | P1 | |
| MB-05 | Queue page (mobile) | Open `/queue` at 375px | Draft cards stack vertically, drag still works or disabled gracefully | P1 | |
| MB-06 | Oracle on mobile | Check for Oracle widget at 375px | Widget accessible, doesn't obscure content | P2 | |
| MB-07 | Dashboard (mobile) | Open `/dashboard` at 375px | Stats cards stack, recent drafts readable | P1 | |

---

## 10. Admin

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| AD-01 | Admin dashboard | Navigate to `/admin/dashboard` | Page loads with admin controls | P2 | |
| AD-02 | QA test runner | Navigate to `/admin/qa` | Test definitions load, can expand and run tests | P2 | |
| AD-03 | Bug tracker | Navigate to `/admin/bugs` | Bug list loads or shows empty state | P2 | |
| AD-04 | Style tile | Navigate to `/admin/style-tile` | Design system reference renders | P3 | |
| AD-05 | Admin prompts | Navigate to `/admin/prompts` | Prompt management page loads | P2 | |

---

## 11. Edge Cases

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| EC-01 | Empty state: no drafts | Login as user with zero drafts | Dashboard/Queue show helpful empty states, not blank | P1 | |
| EC-02 | Empty state: no campaigns | Open `/campaigns` with zero campaigns | Empty state with call-to-action to create first campaign | P2 | |
| EC-03 | API down: crafting | Disconnect backend, try to generate a draft | Error message shown (not blank screen or infinite spinner) | P1 | |
| EC-04 | API down: dashboard | Disconnect backend, load dashboard | Error boundary catches, shows retry or message | P1 | |
| EC-05 | Loading states | Navigate between pages quickly | Skeleton UIs show during data fetch (dashboard, analytics, crafting, queue) | P2 | |
| EC-06 | Error boundary pages | Trigger an error on any page | Error boundary catches, shows "Something went wrong" with retry | P1 | |
| EC-07 | Session expiry | Wait for JWT to expire, then take an action | Re-auth prompt or auto-redirect to login (no silent failure) | P0 | |
| EC-08 | 404 page | Navigate to `/nonexistent-route` | Custom 404 page shown, not a crash | P2 | |
| EC-09 | Command palette empty search | Open Cmd+K, type gibberish | "No results" state, doesn't crash | P3 | |

---

## 12. Performance

| # | Test | Steps | Expected | Sev | Status |
|---|------|-------|----------|-----|--------|
| PF-01 | Dashboard load time | Navigate to `/dashboard`, time it | Renders in under 3 seconds | P1 | |
| PF-02 | Crafting load time | Navigate to `/crafting`, time it | Renders in under 3 seconds | P1 | |
| PF-03 | No layout shift | Watch any page load carefully | No content jumping around after initial render | P2 | |
| PF-04 | Image optimization | Inspect images in DevTools | Images use `next/image` (or `<img>` with appropriate sizing) | P3 | |
| PF-05 | Queue with many drafts | Load queue with 20+ drafts | Page still responsive, drag-and-drop still smooth | P2 | |

---

## Quick Pass (5 minutes, P0 only)

For a fast smoke test, hit just the P0 items:

1. **OB-01** -- Sign in with X works
2. **OB-02** -- New user hits onboarding
3. **OB-11** -- Onboarding completes to dashboard
4. **DB-01** -- Dashboard loads
5. **CS-01** -- Crafting page loads
6. **CS-02** -- Can create a draft
7. **CS-07** -- Draft generation API works
8. **DQ-01** -- Queue page loads
9. **DQ-02** -- Drafts visible in queue
10. **DQ-06** -- Can post a draft to X
11. **AN-01** -- Analytics page loads
12. **CA-01** -- Campaigns page loads
13. **VL-01** -- Voice lab loads
14. **VL-03** -- Voice profiles loads
15. **EC-07** -- Session expiry handled

---

## Notes

- All tests assume the user is authenticated unless testing auth flow
- "Loads" means: page renders meaningful content, no blank screen, no uncaught errors in console
- Mobile tests: use Chrome DevTools device toolbar at 375x812 (iPhone SE/13 mini)
- Backend health: https://api-production-9bef.up.railway.app/health -- check this first if anything fails
- Existing automated QA tests live at `/admin/qa` with 79+ test definitions
