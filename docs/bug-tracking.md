# Bug Tracking Pipeline

Automated E2E bug discovery with dual-write to Supabase and Notion.

## Overview

```
npm run e2e
    ↓
Playwright runs 21 tests across 14 pages
    ↓
Screenshots → test-results/screenshots/
Errors detected → console, page, HTTP 400+
    ↓
supabase-reporter.ts auto-logs failures → Supabase public.bugs table
    ↓
Notion Bug Tracker (manual sync or future automation)
```

## Where Things Live

| Asset | Location |
|---|---|
| **Notion Bug Tracker** | [Bug Tracker DB](https://www.notion.so/47c6c83818284c3eb5e15917bfe542c3) on the Atlas Build Sheet |
| **Supabase bugs table** | Sage project (`zoirudjyqfqvpxsrxepr`) → `public.bugs` |
| **E2E test suite** | `e2e/pages/*.spec.ts` (10 spec files, 21 tests) |
| **Error capture** | `e2e/fixtures/console.ts` |
| **Supabase reporter** | `e2e/reporters/supabase-reporter.ts` |
| **Playwright config** | `playwright.config.ts` |
| **Screenshots** | `test-results/screenshots/` (22 PNGs per run) |

## Running Bug Discovery

```bash
# First time setup
npm install
npx playwright install chromium

# Run tests
npm run e2e
```

After the run:
- New test failures auto-insert to Supabase (deduped by title)
- Screenshots are saved to `test-results/screenshots/`
- Console shows `[supabase-reporter] Logged N new bug(s)` or `all already logged. Skipping.`

## How the Reporter Works

`e2e/reporters/supabase-reporter.ts` implements Playwright's `Reporter` interface:

1. **`onBegin`** — detects the current git branch
2. **`onTestEnd`** — for each failed/timed-out test, extracts the page route and error, stores in a `Map<title, bug>` (retries overwrite, preventing duplicates within a run)
3. **`onEnd`** — queries Supabase for existing bug titles, filters to only new bugs, auto-assigns `bug_number`, and inserts

### Deduplication

- **Within a run:** Uses a `Map` keyed by title — retries overwrite the same entry
- **Across runs:** Queries `public.bugs` for existing titles with `source = 'e2e_automated'` before inserting

### Environment Variables (optional)

The reporter has defaults baked in, but you can override:

```bash
SUPABASE_URL=https://zoirudjyqfqvpxsrxepr.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

## Bug Severity Scale

| Severity | Meaning |
|---|---|
| `critical` | App crash, data loss, auth bypass |
| `high` | API failures, broken core flows |
| `medium` | Broken UI, inconsistent data, failed tests |
| `low` | Missing context, minor UX issues |
| `cosmetic` | Visual inconsistencies, layout gaps |

## Supabase Table Schema

Table: `public.bugs`

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key (auto-generated) |
| `bug_number` | integer | Sequential bug number |
| `title` | text | Bug title |
| `description` | text | Detailed description |
| `page_route` | text | Page route (e.g. `/dashboard`) |
| `severity` | text | critical / high / medium / low / cosmetic |
| `status` | text | open / in_progress / fixed / wont_fix / duplicate |
| `steps_to_reproduce` | text | Repro steps |
| `source` | text | `e2e_automated` or `manual` |
| `project` | text | `atlas-portal` |
| `branch` | text | Git branch where found |
| `test_run_date` | timestamptz | When the test run occurred |
| `created_at` | timestamptz | Row creation time |
| `updated_at` | timestamptz | Last update time |

## Notion Bug Tracker

The Notion database mirrors Supabase and includes a `Supabase ID` field for cross-referencing. Columns:

- **Bug** (title) — bug title
- **Severity** (select) — critical/high/medium/low/cosmetic
- **Status** (status) — Not started / In progress / Done
- **Route** — page route
- **Description** — bug description
- **Steps to Reproduce** — repro steps
- **Supabase ID** — UUID linking to the Supabase row
- **Source** (select) — E2E Automated / Manual
- **Branch** — git branch
- **Bug Number** — sequential number

## Files Changed for Bug Tracking

```
e2e/
  fixtures/
    console.ts              # Error capture (existed)
  reporters/
    supabase-reporter.ts    # NEW — auto-logs to Supabase
  pages/
    dashboard.spec.ts       # FIXED — strict-mode selector
playwright.config.ts        # MODIFIED — reporter registered
package.json                # MODIFIED — added @supabase/supabase-js
docs/
  bug-tracking.md           # NEW — this file
```
