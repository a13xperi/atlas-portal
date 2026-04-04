export interface TestCase {
  id: string;
  name: string;
  steps: string[];
  expected: string;
  knownIssue?: string;
  category?: "functional" | "ux" | "performance" | "visual";
  priority?: "critical" | "high" | "medium" | "low";
}

export interface TestSection {
  id: string;
  icon: string;
  title: string;
  tests: TestCase[];
}

export const sections: TestSection[] = [
  {
    id: "auth",
    icon: "lock",
    title: "1. Authentication",
    tests: [
      {
        id: "AUTH-01",
        name: "Register new account",
        steps: [
          "Go to delphi-atlas.vercel.app",
          'Click "Sign Up" tab or link',
          "Fill: handle qa_manual_01, email qa_manual@test.com, password TestManual123!",
          "Click Submit",
        ],
        expected: "Account created. Redirected to onboarding or dashboard. No errors.",
      },
      {
        id: "AUTH-02",
        name: "Register with duplicate email",
        steps: [
          "Try registering again with the same email qa_manual@test.com",
        ],
        expected:
          'Error message appears: "Email already registered" or "Handle already taken". Form does NOT submit.',
      },
      {
        id: "AUTH-03",
        name: "Register with weak password",
        steps: ["Try registering with password 123"],
        expected: "Validation error — password too short. Form blocked.",
      },
      {
        id: "AUTH-06",
        name: "Login with valid credentials",
        steps: [
          "Go to login page",
          "Enter qa_test_0404@test.com / TestPass123!",
          "Click Sign In",
        ],
        expected:
          "Redirected to /dashboard. Stats cards visible. No error flash.",
      },
      {
        id: "AUTH-07",
        name: "Login with wrong password",
        steps: [
          "Enter valid email, wrong password wrongpass",
          "Click Sign In",
        ],
        expected: 'Error: "Invalid credentials". Stay on login page.',
      },
      {
        id: "AUTH-09",
        name: "Session persistence",
        steps: [
          "Login successfully",
          "Close the browser tab",
          "Open delphi-atlas.vercel.app in a new tab",
        ],
        expected: "Still logged in. Dashboard loads without re-login.",
      },
      {
        id: "AUTH-11",
        name: "Logout flow",
        steps: [
          "Click your avatar (top-right corner)",
          "Click Logout",
        ],
        expected: "Redirected to login page. Cookies cleared.",
      },
      {
        id: "AUTH-12",
        name: "Protected route redirect",
        steps: [
          "After logout, manually type delphi-atlas.vercel.app/dashboard in address bar",
        ],
        expected:
          "Redirected to login page. Should NOT see dashboard content.",
        knownIssue:
          "PF-02: May briefly flash dashboard skeleton before redirect (client-side auth only).",
      },
    ],
  },
  {
    id: "dashboard",
    icon: "layout-dashboard",
    title: "2. Dashboard",
    tests: [
      {
        id: "DASH-01",
        name: "Dashboard loads correctly",
        steps: [
          "Login with qa_test_0404@test.com / TestPass123!",
          "You should land on /dashboard",
        ],
        expected:
          "Page renders with: stat cards (Drafts, Posts, Feedback, Reports), recent drafts section, quick action buttons.",
      },
      {
        id: "DASH-02",
        name: "Stats cards show data",
        steps: ["Look at the 4 metric cards at the top"],
        expected:
          "Numbers displayed (may be 0 for new user). No NaN or undefined.",
      },
      {
        id: "DASH-06",
        name: "Empty state (new user)",
        steps: ["Check the recent drafts area"],
        expected:
          'Shows empty state message like "No drafts yet" — not a broken/blank layout.',
      },
      {
        id: "DASH-07",
        name: "Loading skeleton",
        steps: [
          'Open DevTools > Network > throttle to "Slow 3G"',
          "Reload page",
        ],
        expected:
          "Skeleton shimmer animation shows while data loads. No layout shift when data arrives.",
      },
      {
        id: "DASH-05",
        name: "Navigation works",
        steps: [
          "Click each item in the left sidebar/nav: Dashboard, Crafting, Library, Analytics, Team",
        ],
        expected:
          "Each page loads. Active state highlighted in nav. Back button works.",
      },
    ],
  },
  {
    id: "crafting",
    icon: "pen-tool",
    title: "3. Crafting Station",
    tests: [
      {
        id: "CRAFT-01",
        name: "Generate tweet from text",
        steps: [
          "Navigate to /crafting",
          "Paste this into the input: Bitcoin just hit $120k as BlackRock ETF inflows reach $2B this week. Institutional adoption is accelerating.",
          "Click Generate",
        ],
        expected:
          "AI generates a tweet draft within ~5 seconds. Content is relevant, within 280 chars.",
      },
      {
        id: "CRAFT-04",
        name: "Refine with chips",
        steps: [
          "After generating a draft, look for refinement chips/buttons",
          'Click "Shorter" or "More punchy"',
        ],
        expected:
          "Draft updates with refinement applied. Loading indicator during generation.",
      },
      {
        id: "CRAFT-05",
        name: "Multiple refinements",
        steps: ["Apply 3 different refinements in sequence"],
        expected:
          "Each builds on the last. Quality doesn't degrade. Version count increments.",
      },
      {
        id: "CRAFT-06",
        name: "Manual edit",
        steps: [
          "Click into the draft text and manually edit some words",
        ],
        expected:
          "Text is editable. Changes stick (don't get overwritten).",
      },
      {
        id: "CRAFT-07",
        name: "Save draft",
        steps: [
          "After generating, click Save (or equivalent)",
        ],
        expected:
          "Draft saved with DRAFT status. Appears in draft list/history.",
      },
      {
        id: "CRAFT-08",
        name: "Reply mode",
        steps: [
          "Switch to Reply mode",
          "Paste a tweet URL or text to reply to",
          "Select a reply angle (bullish, contrarian, etc.)",
          "Generate",
        ],
        expected:
          "Reply generated that contextually matches the original tweet + selected angle.",
      },
      {
        id: "CRAFT-11",
        name: "News-to-post mode",
        steps: [
          "Switch to News mode",
          "Paste an article URL or article text",
          "Generate",
        ],
        expected: "Tweet generated from article content.",
      },
      {
        id: "CRAFT-13",
        name: "Thread generation",
        steps: [
          "Generate a longer piece of content",
          "Click Thread button",
        ],
        expected:
          "Content split into numbered thread segments. Each within char limit.",
      },
      {
        id: "CRAFT-16",
        name: "Post to X (blocked)",
        steps: ["Click Post to X on a draft"],
        expected:
          'Error: "Link your X account first" — since no X account is connected.',
      },
      {
        id: "CRAFT-18",
        name: "Version history sidebar",
        steps: [
          "Check for a version history panel/sidebar after generating + refining",
        ],
        expected:
          "Shows all draft versions with timestamps. Can click to view previous versions.",
      },
      {
        id: "CRAFT-19",
        name: "Image generation",
        steps: [
          "Look for an image/visual concept button on a draft",
          "Click to generate an image",
        ],
        expected:
          "Image generated and displayed inline with the draft.",
      },
    ],
  },
  {
    id: "voice",
    icon: "mic",
    title: "4. Voice Profiles",
    tests: [
      {
        id: "VP-01",
        name: "Voice profile page loads",
        steps: ["Navigate to /voice-profiles"],
        expected:
          "All 12 voice dimensions displayed with sliders. Current values shown (default: 50 each).",
      },
      {
        id: "VP-02",
        name: "Adjust dimension sliders",
        steps: [
          "Move the Humor slider to 80",
          "Move Formality to 20",
          "Save changes",
        ],
        expected:
          "Values update visually. Save confirms. Reload shows persisted values.",
      },
      {
        id: "VP-03",
        name: "Apply preset",
        steps: [
          "Find preset buttons (CT Degen, Research Analyst, Balanced)",
          "Click CT Degen",
        ],
        expected:
          "All 12 dimensions snap to preset values. Visual change is immediate.",
      },
      {
        id: "VP-05",
        name: "Calibrate from Twitter handle",
        steps: [
          "Find the calibration section",
          "Enter a Twitter handle (e.g. cobie)",
          "Click Calibrate",
        ],
        expected:
          "Tweets analyzed. Dimensions auto-adjust. tweetsAnalyzed count shown. Confidence score displayed.",
      },
      {
        id: "VP-08",
        name: "Reference accounts",
        steps: ["Check the reference voices section"],
        expected:
          "16 curated global accounts shown (Ansem, Cobie, Elon, Naval, etc.) with avatars.",
      },
      {
        id: "VP-11",
        name: "Create a blend",
        steps: [
          "Select 2 reference accounts",
          "Set percentages (e.g. 60/40)",
          "Name it QA Test Blend",
          "Save",
        ],
        expected:
          "Blend created. Appears in blend list. Percentages sum to 100%.",
      },
    ],
  },
  {
    id: "alerts",
    icon: "bell",
    title: "5. Alerts & Signals",
    tests: [
      {
        id: "ALT-01",
        name: "Alerts page loads",
        steps: ["Navigate to /alerts"],
        expected:
          "Feed renders. May be empty for new user — should show empty state, not broken layout.",
      },
      {
        id: "ALT-05",
        name: "Subscriptions section",
        steps: ["Look for a subscriptions tab or section"],
        expected:
          "Shows current subscriptions (may be empty). Has option to add new.",
      },
      {
        id: "ALT-06",
        name: "Add subscription",
        steps: [
          "Click add subscription",
          "Set type: Category, value: crypto",
          "Save",
        ],
        expected:
          "Subscription created. Appears in list with active toggle.",
      },
      {
        id: "ALT-09",
        name: "Notification bell",
        steps: ["Click the bell icon in the top nav bar"],
        expected:
          "Dropdown opens showing recent notifications. Dismiss/clear options available.",
      },
    ],
  },
  {
    id: "analytics",
    icon: "bar-chart-3",
    title: "6. Analytics",
    tests: [
      {
        id: "ANA-01",
        name: "Analytics page loads",
        steps: ["Navigate to /analytics"],
        expected:
          "Page renders with chart areas and summary stats.",
      },
      {
        id: "ANA-02",
        name: "Engagement chart renders",
        steps: ["Look for the main engagement velocity chart"],
        expected:
          "Chart renders (may show zeros for new user). Axes labeled. No JS errors.",
      },
      {
        id: "ANA-05",
        name: "Summary stats",
        steps: ["Check the 30-day summary numbers"],
        expected:
          "Shows drafts created, posted, feedback given, refinements. Numbers match your activity.",
      },
      {
        id: "ANA-07",
        name: "Empty state handling",
        steps: ["As a new user, check all chart/data areas"],
        expected:
          "Empty states shown gracefully — no broken charts, no NaN, no console errors.",
      },
    ],
  },
  {
    id: "briefing",
    icon: "mail",
    title: "7. Briefing & Telegram",
    tests: [
      {
        id: "BRF-01",
        name: "Briefing settings page",
        steps: ["Navigate to /briefing"],
        expected:
          "Preferences form renders: delivery time, topics, sources, channel.",
      },
      {
        id: "BRF-02",
        name: "Save briefing preferences",
        steps: [
          "Set delivery time to 08:00",
          "Select topics: crypto, defi",
          "Set channel to Portal",
          "Save",
        ],
        expected: "Saved confirmation. Reload shows persisted values.",
      },
      {
        id: "TEL-01",
        name: "Telegram setup page",
        steps: ["Navigate to /telegram"],
        expected:
          "Setup guide renders with clear instructions for connecting Telegram bot.",
      },
    ],
  },
  {
    id: "team",
    icon: "users",
    title: "8. Team Management",
    tests: [
      {
        id: "TM-06",
        name: "Analyst blocked from management",
        steps: [
          "While logged in as ANALYST, navigate to /management",
        ],
        expected:
          "Access denied/redirected — analyst cannot access team management.",
      },
      {
        id: "TM-01",
        name: "Team Library page",
        steps: ["Navigate to /team-library"],
        expected:
          "Page loads. Shows team drafts, shared blends, or empty state.",
      },
    ],
  },
  {
    id: "profile",
    icon: "user",
    title: "9. Profile",
    tests: [
      {
        id: "PRO-01",
        name: "Profile page loads",
        steps: ["Navigate to /profile"],
        expected:
          "Shows current display name, email, bio, avatar fields.",
      },
      {
        id: "PRO-02",
        name: "Update display name",
        steps: ["Change display name to QA Tester", "Save"],
        expected:
          "Name updated. Reflected in nav bar avatar/menu. Persists on reload.",
      },
      {
        id: "PRO-03",
        name: "Update bio",
        steps: ["Add bio: Testing Atlas QA suite", "Save"],
        expected: "Bio saved and persists.",
      },
    ],
  },
  {
    id: "navigation",
    icon: "compass",
    title: "10. Navigation & Search",
    tests: [
      {
        id: "NAV-01",
        name: "Command palette (Cmd+K)",
        steps: ["Press Cmd+K (or Ctrl+K)"],
        expected:
          "Command palette overlay opens. Search input focused.",
      },
      {
        id: "NAV-04",
        name: "All nav links work",
        steps: [
          "Click every item in the navigation bar/sidebar",
          "Check: Dashboard, Crafting, Voice Profiles, Alerts, Analytics, Briefing, Team Library, Management, Profile",
        ],
        expected:
          "Each page loads. Active state highlighted. No 404s.",
      },
      {
        id: "NAV-05",
        name: "Mobile responsive nav",
        steps: [
          "Open DevTools > toggle device toolbar",
          "Set to iPhone 14 (390px wide)",
          "Check navigation",
        ],
        expected:
          "Nav adapts to mobile — hamburger menu or bottom nav. All links accessible.",
      },
    ],
  },
  {
    id: "design",
    icon: "palette",
    title: "11. Design System & Visual",
    tests: [
      {
        id: "DS-01",
        name: "Color palette correct",
        steps: [
          "Browse all pages, check backgrounds and accents",
        ],
        expected:
          "Dark background (#010411). Teal accents (#4ecdc4). Delphi blue palette. No white backgrounds.",
      },
      {
        id: "DS-02",
        name: "Typography",
        steps: ["Check page headings vs body text"],
        expected:
          "Headings: Playfair Display (serif). Body: Inter (sans-serif). Consistent hierarchy.",
      },
      {
        id: "DS-03",
        name: "Glass card effects",
        steps: [
          "Check card components on Dashboard, Voice Profiles",
        ],
        expected:
          "Frosted glass effect visible. Backdrop blur. Rounded corners (16px).",
      },
      {
        id: "DS-05",
        name: "Status pills",
        steps: ["Check draft cards for status badges"],
        expected:
          "Correct colors: DRAFT (neutral), APPROVED (blue/green), POSTED (green), ARCHIVED (gray).",
      },
      {
        id: "DS-10",
        name: "Responsive at key breakpoints",
        steps: [
          "Test at: 320px, 768px, 1024px, 1440px",
        ],
        expected:
          "Layout adapts. No horizontal overflow. No overlapping elements. Touch targets adequate on mobile.",
      },
    ],
  },
  {
    id: "a11y",
    icon: "accessibility",
    title: "12. Accessibility",
    tests: [
      {
        id: "A11Y-01",
        name: "Keyboard navigation",
        steps: [
          "Starting from the login page, use only Tab, Enter, and Escape to navigate",
        ],
        expected:
          "All interactive elements focusable. Visible focus ring. Logical tab order.",
      },
      {
        id: "A11Y-04",
        name: "Color contrast",
        steps: [
          "Run Lighthouse accessibility audit in DevTools",
          "Or use browser extension like axe DevTools",
        ],
        expected:
          "All text meets WCAG AA contrast ratio (4.5:1 normal text, 3:1 large text).",
      },
      {
        id: "A11Y-07",
        name: "Form labels",
        steps: [
          "Inspect login form, crafting input, voice sliders",
          "Check that each input has an associated <label> or aria-label",
        ],
        expected:
          "Every input has a label. Screen readers can identify each field.",
      },
    ],
  },
  {
    id: "errors",
    icon: "alert-triangle",
    title: "13. Error Handling",
    tests: [
      {
        id: "ERR-03",
        name: "404 page",
        steps: [
          "Navigate to delphi-atlas.vercel.app/nonexistent-page",
        ],
        expected:
          "Shows 404 page or redirects to dashboard. No white screen.",
      },
      {
        id: "ERR-08",
        name: "Large input handling",
        steps: [
          "In Crafting, paste 10,000+ characters into the source input",
          "Try to generate",
        ],
        expected:
          "Handled gracefully — truncated, warned, or accepted. No crash.",
      },
      {
        id: "ERR-09",
        name: "XSS prevention",
        steps: [
          'In any text input (profile name, draft, etc.), enter: <script>alert("xss")</script>',
        ],
        expected:
          "HTML is escaped. No alert popup. Script does not execute.",
      },
    ],
  },
  {
    id: "performance",
    icon: "zap",
    title: "14. Performance",
    tests: [
      {
        id: "PERF-01",
        name: "Lighthouse audit",
        steps: [
          "Open DevTools > Lighthouse tab",
          "Run audit on /dashboard (Performance + Accessibility)",
        ],
        expected:
          "Performance > 70. Accessibility > 80. FCP < 3s.",
      },
      {
        id: "PERF-03",
        name: "Draft generation speed",
        steps: [
          "Time from clicking Generate to seeing the draft",
        ],
        expected:
          "< 15 seconds. Loading indicator visible during generation.",
      },
      {
        id: "PERF-07",
        name: "Memory leak check",
        steps: [
          "Open DevTools > Memory tab",
          "Take heap snapshot",
          "Navigate between 5+ pages, generate drafts",
          "Take another snapshot",
        ],
        expected:
          "No significant memory growth. No detached DOM nodes accumulating.",
      },
    ],
  },
  {
    id: "oracle",
    icon: "sparkles",
    title: "15. Oracle Onboarding",
    tests: [
      {
        id: "ORC-01",
        name: "Oracle welcome + track selection",
        category: "functional",
        priority: "critical",
        steps: [
          "Open incognito window → register new account → land on /onboarding",
          "Wait for typing animation to finish",
          "Verify Oracle avatar (hooded robot) appears with welcome message",
          "Verify two buttons appear: 'Connect X' and 'Set up manually'",
        ],
        expected:
          "Oracle mascot avatar visible. 'Welcome. I am The Oracle.' message with typing animation. Two track selection buttons at bottom. No layout shift or flash.",
      },
      {
        id: "ORC-02",
        name: "Track A — handle input + voice scan",
        category: "functional",
        priority: "critical",
        steps: [
          "Click 'Connect X'",
          "Verify your message appears right-aligned ('Connect X')",
          "Verify Oracle asks for X handle with input field",
          "Enter a real handle (e.g. hosseeb or naval)",
          "Click Continue or press Enter",
          "Watch for scanning animation (spinner + 'Scanning tweets...')",
          "Wait for calibration to complete (5-15 seconds)",
        ],
        expected:
          "Handle input renders with @ prefix. Scanning animation shows while API runs. After scan completes, dimension sliders appear with calibrated values (not all 50s). Calibration summary text shown ('Calibrated from X tweets').",
      },
      {
        id: "ORC-03",
        name: "Track A — LLM personalized commentary",
        category: "ux",
        priority: "high",
        steps: [
          "Complete the voice scan in ORC-02",
          "Watch for a second Oracle message that appears AFTER the calibration summary",
          "This message should be personalized — references specific dimensions or patterns",
        ],
        expected:
          "A follow-up Oracle bubble appears with LLM-generated commentary. It should mention specific voice traits (e.g. 'You're more contrarian than most analysts'). If the backend is down, this message simply doesn't appear — the flow continues without it. Not a blocker.",
      },
      {
        id: "ORC-04",
        name: "Track A — dimension review + display name",
        category: "functional",
        priority: "critical",
        steps: [
          "After calibration, verify 12 dimension sliders appear inside a chat message",
          "Adjust 2-3 sliders (e.g. move Humor up, Formality down)",
          "Find the display name input field",
          "Enter a display name (at least 2 characters)",
          "Click Continue",
        ],
        expected:
          "All 12 sliders are interactive and show calibrated values. Display name input is present. Continue button is disabled until display name is ≥2 chars. After continue, voice profile saves to backend (check network tab for PATCH /api/voice/profile).",
      },
      {
        id: "ORC-05",
        name: "Track A — tweet rating",
        category: "ux",
        priority: "medium",
        steps: [
          "After dimensions, verify 4 sample tweets appear",
          "Click thumbs up on 2 tweets, thumbs down on 1",
          "Verify the icons change color (teal for up, red for down)",
          "Click Continue",
        ],
        expected:
          "4 tweet cards with thumbs up/down buttons. Selected state is visually distinct. Clicking the same button again should toggle it off. Continue advances to reference voices.",
      },
      {
        id: "ORC-06",
        name: "Track B — style picker",
        category: "functional",
        priority: "critical",
        steps: [
          "Start fresh (new incognito, new account)",
          "At welcome, click 'Set up manually'",
          "Verify Oracle shows warm welcome message ('No worries, I got you')",
          "Verify 3 style cards appear: Fun, Serious, Custom mix",
          "Click one style card",
        ],
        expected:
          "Oracle welcome is warm and encouraging. Style cards are clickable with selected state (teal border). Selecting a style auto-advances (or shows Continue).",
      },
      {
        id: "ORC-07",
        name: "Track B — content signals step",
        category: "functional",
        priority: "medium",
        steps: [
          "After style picker, verify Oracle asks about tweets/articles",
          "Verify 'Skip for now' button appears",
          "Click 'Skip for now'",
          "Verify flow advances to dimension sliders",
        ],
        expected:
          "Content signals step appears between Style and Dimensions. Skip button works. Flow is not blocked if user has no content to share.",
      },
      {
        id: "ORC-08",
        name: "Track B — dimension sliders + display name",
        category: "functional",
        priority: "high",
        steps: [
          "After content signals, verify 12 dimension sliders appear",
          "Verify default values match selected style (not all 50s for Fun/Serious)",
          "Adjust a few sliders",
          "Enter display name",
          "Click Continue",
        ],
        expected:
          "Dimensions default to style preset (Fun = high humor, Serious = high formality). Display name required. Data persists to backend on Continue.",
      },
      {
        id: "ORC-09",
        name: "Reference voice selector (both tracks)",
        category: "functional",
        priority: "critical",
        steps: [
          "Verify reference account grid appears with 10 accounts",
          "Check that each account shows: avatar/initials, handle, category tag",
          "Try category filter tabs (All, Crypto/VC, Macro, etc.)",
          "Select 2+ accounts (check for teal border on selected)",
          "Click Continue",
        ],
        expected:
          "Grid shows 10 reference accounts with real profile pictures (if seeded). Category filters work. Must select ≥2 to continue. Selections persist to backend.",
      },
      {
        id: "ORC-10",
        name: "Blend ratio + 'Preview a tweet' button",
        category: "ux",
        priority: "high",
        steps: [
          "Verify blend slider appears with self% vs references%",
          "Adjust the slider — watch breakdown update in real time",
          "Click 'Preview a tweet in this voice' button",
          "Wait for LLM to generate a sample tweet (3-8 seconds)",
          "Verify generated tweet appears as an Oracle message",
          "Click Continue",
        ],
        expected:
          "Slider is interactive, breakdown shows per-reference percentages. Preview button triggers backend LLM call — a sample tweet in the blended voice appears. If LLM fails, nothing breaks — user can still Continue.",
      },
      {
        id: "ORC-11",
        name: "Topic picker",
        category: "functional",
        priority: "high",
        steps: [
          "Verify topic chips appear (AI & Crypto, Macro, Stablecoins/RWA, DeFi, NFTs/Gaming, Regulation)",
          "Click to select 1+ topics (verify teal highlight on selected)",
          "Click Continue",
        ],
        expected:
          "6 topic chips, multi-select, selected state is visually clear. Must pick ≥1 to continue. Preferences save to backend.",
      },
      {
        id: "ORC-12",
        name: "Handoff — Telegram + dashboard",
        category: "functional",
        priority: "critical",
        steps: [
          "Verify Oracle farewell message ('You're all set')",
          "Verify Telegram bot link appears (@AtlasDelphiBot)",
          "Click 'Go to Dashboard'",
          "Verify redirect to /dashboard with user data loaded",
        ],
        expected:
          "Farewell message feels conclusive. Telegram link opens in new tab. Dashboard redirect works and shows the user's data (not empty state).",
      },
      {
        id: "ORC-13",
        name: "Back-navigation",
        category: "functional",
        priority: "high",
        steps: [
          "Get to the References step (either track)",
          "Click the '← Back' button",
          "Verify previous step restores (dimensions or rating visible again)",
          "Click '← Back' again",
          "Verify state is correct (slider values preserved, style selection preserved)",
          "Click Continue twice to re-advance",
          "Verify data is intact after re-advancing",
        ],
        expected:
          "Back button restores previous step's UI and data. Messages truncate to that point. Re-advancing works without data loss. Back button is hidden at Welcome step.",
      },
      {
        id: "ORC-14",
        name: "Mobile responsive (375px)",
        category: "visual",
        priority: "medium",
        steps: [
          "Open DevTools → toggle device mode → iPhone SE (375px)",
          "Go through entire Track A flow",
          "Check: Oracle messages don't overflow, buttons are tappable, sliders work",
          "Check: reference grid wraps properly, blend slider is usable",
        ],
        expected:
          "Full flow is usable at 375px width. No horizontal scroll. All interactive elements are ≥44px tap targets. Text is readable.",
      },
      {
        id: "ORC-15",
        name: "Typing animation + message flow",
        category: "ux",
        priority: "medium",
        steps: [
          "Watch the typing indicator (pulsing dots) between Oracle messages",
          "Verify delay scales with message length (short = fast, long = slower)",
          "Verify auto-scroll follows new messages",
          "Verify chat history is scrollable (scroll up to see earlier messages)",
        ],
        expected:
          "Typing dots pulse smoothly. Delay feels natural (300-1200ms). Chat auto-scrolls to latest message. Full history scrollable. No janky jumps.",
      },
    ],
  },
];

/** Total number of individual tests across all sections */
export const TOTAL_TESTS = sections.reduce(
  (sum, s) => sum + s.tests.length,
  0,
);

/** All test IDs in order */
export const ALL_TEST_IDS = sections.flatMap((s) =>
  s.tests.map((t) => t.id),
);
