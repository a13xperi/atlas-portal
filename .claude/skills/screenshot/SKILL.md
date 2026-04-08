---
name: screenshot
description: Take Playwright screenshots of Atlas pages and display them inline. Use after building UI features so the user can review without navigating.
argument-hint: [page-path or flow-description]
---

# Screenshot Skill

Take Playwright screenshots of Atlas pages and display them inline in the terminal.

## Input

`$ARGUMENTS` — one of:
- A page path like `/crafting`, `/dashboard`, `/voice-profiles`
- A flow description like "crafting advisor flow" or "onboarding track-a"
- Empty — screenshot the page most relevant to what was just built

## Protocol

### 1. Find the dev server

```
lsof -i :3000 -i :3001 -i :3002 | grep LISTEN
```

If no dev server is running, start one in the background:
```
cd /Users/a13xperi/atlas-portal && npm run dev &
```
Wait for it to be ready (poll with curl).

### 2. Generate a Playwright script at `/tmp/atlas-ss.js`

Use this template. Adapt the navigation, actions, and screenshot names to match the requested page/flow.

**Critical rules for route mocking (Playwright last-registered = highest priority):**
1. Register `${API_BASE}/api/**` catch-all FIRST (it becomes lowest priority)
2. Register broad wildcards like `api/oracle/**` BEFORE their specific matches like `api/oracle/chat`
3. Register specific endpoints LAST (they get highest priority)

**Tour suppression — set ALL of these in localStorage:**
```js
{ name: 'atlas_page_toured_crafting', value: 'true' },
{ name: 'atlas_page_toured_dashboard', value: 'true' },
{ name: 'atlas_page_toured_voice-profiles', value: 'true' },
{ name: 'atlas_page_toured_alerts', value: 'true' },
{ name: 'atlas_page_toured_analytics', value: 'true' },
{ name: 'atlas_page_toured_arena', value: 'true' },
{ name: 'demo_mode', value: 'false' },
```

**Auth — set the session cookie:**
```js
cookies: [{ name: 'atlas_session', value: '1', domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' }]
```

**Standard mock user:**
```js
const mockUser = {
  id: 't1', handle: 'testanalyst', email: 'test@atlas.dev', role: 'MANAGER',
  displayName: 'Alex Peri', tourCompleted: true,
  voiceProfile: { id: 'vp1', userId: 't1', humor: 55, formality: 65, brevity: 45,
    contrarianTone: 40, maturity: 'ADVANCED', tweetsAnalyzed: 42 }
};
```

**Standard API mocks (register in this order):**
```js
// Catch-all FIRST (lowest priority)
await page.route(`${API_BASE}/api/**`, r => r.fulfill({ json: {}, status: 200 }));
// Then specific routes (highest priority = last registered)
await page.route(`${API_BASE}/api/auth/me`, r => r.fulfill({ json: { user: mockUser }, status: 200 }));
await page.route(`${API_BASE}/api/auth/refresh`, r => r.fulfill({ json: { token: 'tok', user: mockUser }, status: 200 }));
await page.route(`${API_BASE}/api/auth/x/status`, r => r.fulfill({ json: { connected: false }, status: 200 }));
await page.route(`${API_BASE}/api/voice/profile`, r => r.fulfill({ json: { profile: mockUser.voiceProfile }, status: 200 }));
await page.route(`${API_BASE}/api/voice/blends`, r => r.fulfill({ json: { blends: [] }, status: 200 }));
await page.route(`${API_BASE}/api/voice/references`, r => r.fulfill({ json: { references: [] }, status: 200 }));
await page.route(`${API_BASE}/api/analytics/summary`, r => r.fulfill({ json: { summary: { draftsCreated: 8, draftsPosted: 3, feedbackGiven: 5, refinements: 2 } }, status: 200 }));
await page.route(`${API_BASE}/api/trending/topics`, r => r.fulfill({ json: { topics: [] }, status: 200 }));
await page.route(`${API_BASE}/api/drafts`, r => r.request().method() === 'GET' ? r.fulfill({ json: { drafts: [] }, status: 200 }) : r.fulfill({ json: { draft: { id: 'd1', content: 'Draft', sourceType: 'MANUAL', status: 'DRAFT', createdAt: new Date().toISOString(), versions: [] } }, status: 200 }));
```

**When elements are behind overlays:** Use `page.evaluate()` to click via DOM API:
```js
await page.evaluate((title) => {
  const btn = Array.from(document.querySelectorAll('button'))
    .find(b => b.querySelector('span')?.textContent?.trim() === title);
  if (btn) btn.click();
}, 'Button Title');
```

### 3. Run the script

```
node /tmp/atlas-ss.js
```

Output screenshots to `/tmp/atlas-screenshots/`. Name them sequentially: `1-description.png`, `2-description.png`, etc.

### 4. Display screenshots

Read each screenshot file with the Read tool. This renders them inline in Claude Code's terminal output. Show ALL screenshots — don't skip any.

### 5. Ask for feedback

After displaying, ask: "Anything you want changed?" Keep the script around at `/tmp/atlas-ss.js` so you can iterate quickly.

## When to use proactively

After shipping any UI change (new component, layout change, styling fix), offer: "Want me to grab screenshots?" — or just do it if the feature is visual and the user would obviously want to see it.
