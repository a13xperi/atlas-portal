# Atlas Improvement Loop V2: The Autonomous E2E Cycle

This document outlines the architecture for the continuous improvement and autonomous end-to-end (E2E) testing loop for Atlas, powered by a 9-agent fleet.

## 1. Fleet Architecture & Responsibility Matrix

| Agent | Role / Title | Ownership / Responsibilities |
| :--- | :--- | :--- |
| **Claude Code (CC)** | CTO & Orchestrator | Dispatching, scheduling, final code audit, merging to main, reading the Wire every 120s. *Never writes code files directly.* |
| **MiniMax M2.7** | Workhorse | 70% of lifting. Generates specs, boilerplate, component pipelines, and **owns E2E test script generation and execution.** |
| **Kimi Code K2.5** | Senior Developer | 15% of lifting. Whole-repo refactors, complex bug fixes, visual-to-code, **owns E2E validation and fixing.** |
| **Codex GPT-5.4** | Backend Specialist | 10% of lifting. Isolated PRs, worktree-based tasks, backend/tests. |
| **Gemini** | Researcher | Deep analysis, tool integration research, synthesizes lessons into Obsidian. |
| **Grok** | X/Twitter Intel | Real-time trend analysis and X/Twitter intelligence gathering. |
| **Hermes** | Content Intel | Processes research for the Atlas team, tracks content performance. |
| **Claw (OpenClaw)** | Chief of Staff | Bridges Alex's Telegram commands to the fleet's dispatch system. |
| **Forge** | Infrastructure | The overall execution environment and build system. |

## 2. Autonomous Improvement Loop Diagram

```ascii
                      [TELEGRAM]                    [X/TWITTER]
                          |                              |
                          v                              v
                     (1) CLAW                      (2) HERMES
                 (Intent Parsing)                (Signal Parsing)
                          |                              |
                          +------------+-----------------+
                                       |
                                       v
                             [THE WIRE (Supabase)]
                                       |
                                       v
                               (3) CLAUDE CODE (CC)
                            (Orchestration & Design)
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
             (4) MINIMAX <-------------------------> (5) CODEX
          (Spec & Boilerplate)                   (Backend/Logic)
                   |
                   v
             (6) MINIMAX
        (Generate & Run E2E)
                   |
             [Test Fails]
                   |
                   v
             (7) KIMI CODE
        (Debug & Fix Failure)
                   |
             [Test Passes]
                   |
                   v
             (8) CLAUDE CODE
         (Audit, Merge, Reflect)
                   |
                   v
               (9) GEMINI
          (Obsidian Synthesis)
```

## 3. The Autonomous E2E Validation Chain

Keeping E2E testing out of Claude Code's context window requires a dedicated sub-loop handled by MiniMax and Kimi.

1. **MiniMax E2E Generation:** MiniMax generates self-contained Playwright TypeScript files (e.g., `e2e/autonomous/{task_id}.spec.ts`) based on the specs it just implemented.
2. **MiniMax E2E Execution:** MiniMax runs the tests against the staging environment (`npx playwright test e2e/autonomous/{task_id}.spec.ts`).
3. **Handoff to Kimi:** If the test fails, MiniMax broadcasts a `task_result` to the Wire containing the Playwright trace, error logs, and screenshots (if applicable).
4. **Kimi Validation:** Kimi Code picks up the `task_result`, analyzes the DOM/React component failure, and modifies the underlying application code to fix the issue. Kimi then triggers MiniMax to re-run the test.
5. **Opus Quality Gate:** Once MiniMax reports a passing test via the Wire, CC (Opus) performs a final, high-level code review of the diff (without needing the raw test logs) and commits the change.

## 4. Concrete Wire Message Schema (ACP v1.0)

For the E2E validation chain, the Supabase `session_messages` table will utilize the following typed payload:

```json
{
  "type": "task_result",
  "sender": "minimax-m2.7",
  "target": "kimi-code-k2.5",
  "timestamp": "2026-04-14T10:00:00Z",
  "payload": {
    "task_id": "feat-voice-calibration",
    "status": "failed",
    "stage": "e2e_execution",
    "artifacts": {
      "test_script": "e2e/autonomous/feat-voice-calibration.spec.ts",
      "error_log": "Error: locator('.bg-glass').first() not found",
      "trace_url": "playwright-report/trace/..."
    },
    "instruction": "Test failed during voice profile render. Please validate the DOM structure in src/app/voice-profiles/page.tsx."
  }
}
```

## 5. External Integrations (Hermes & Claw)

*   **Claw (Telegram Bridge):** Claw listens to a secure Telegram bot. When Alex sends a command (e.g., "Build a new analytics view for profile momentum"), Claw parses the intent, assigns a priority, and emits a `task_handoff` event directly to the Wire. CC picks this up on its 120s polling cycle and initiates the Opus Sandwich.
*   **Hermes (Content Signal):** Hermes monitors the performance of tweets generated by Atlas on X. It correlates engagement metrics (likes, retweets) back to the specific Voice Blend and prompts used. It broadcasts an `improvement_signal` to the Wire. Kimi or Codex can pick this up to adjust the underlying prompt weights or suggest UI changes.

## 6. Top 5 High-Leverage Improvement Signals

To drive the self-improvement loop, these 5 signals must be prioritized:
1.  **Voice Calibration Accuracy:** (User Feedback) How often do analysts manually edit a drafted tweet? A high edit rate signals a need to tune the LLM prompting parameters.
2.  **X/Twitter Engagement Delta:** (Hermes) The performance difference between an Atlas-crafted tweet and an analyst's historical average.
3.  **E2E Flakiness Rate:** (MiniMax) The percentage of autonomous Playwright tests that fail due to timing/DOM issues rather than actual bugs. High flakiness requires Forge to improve the testing environment.
4.  **X Auth Conversion Rate:** (Analytics) The drop-off rate during the onboarding flow when connecting an X account.
5.  **Time-to-Draft:** (Analytics) The session time from entering the `/crafting` station to finalizing a draft.

## 7. The 8-Step Self-Improvement Loop

1.  **Sense (Claw/Hermes/Analytics):** A new requirement or optimization signal is detected and broadcasted to the Wire.
2.  **Design (CC/Opus):** CC wakes up, reads the Wire, formulates a high-level architectural plan, and locks the necessary files in `.coordination/STATUS.json`.
3.  **Construct (MiniMax/Codex):** CC hands off the spec to MiniMax (for frontend/boilerplate) or Codex (for backend logic). They implement the feature.
4.  **Assure (MiniMax):** MiniMax generates a targeted Playwright script and executes it against the staging build.
5.  **Debug (Kimi):** If Assure fails, Kimi intercepts the failure logs via the Wire, corrects the implementation, and loops back to Assure.
6.  **Audit (CC/Opus):** Once tests pass, CC reviews the git diff to ensure adherence to Atlas design standards (e.g., human-first UI, correct tokens).
7.  **Deploy (CC/Forge):** CC commits the code, updates the coordination files, and pushes to `staging`.
8.  **Synthesize (Gemini):** Gemini reads the completed task logs and updates `~/obsidian/sage-vault/forge/IMPROVEMENT-LOOP-V2.md` with structural lessons learned for future agents.
