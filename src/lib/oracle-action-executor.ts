"use client";

import { api } from "@/lib/api";
import type {
  OracleAgentAction,
  OracleActionResult,
  OracleActionType,
} from "@/lib/oracle-agent-types";
import { emitPopulateDraft, emitSetDraft } from "@/lib/oracle-crafting-bridge";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface ExecutorContext {
  router: AppRouterInstance;
}

/**
 * Execute an Oracle agent action and return the result.
 * Navigation happens via router. API reads/writes via api client.
 * Server-resolved actions (with _serverResult) return their cached data.
 */
export async function executeAction(
  action: OracleAgentAction,
  ctx: ExecutorContext,
): Promise<OracleActionResult> {
  const { type, input, id } = action;
  const ok = (data?: unknown): OracleActionResult => ({
    actionId: id,
    type: type as OracleActionType,
    success: true,
    data,
  });
  const fail = (error: string): OracleActionResult => ({
    actionId: id,
    type: type as OracleActionType,
    success: false,
    error,
  });

  try {
    // If the backend already resolved this (read-only), return cached result
    if (input._serverResult !== undefined) {
      return ok(input._serverResult);
    }

    switch (type) {
      case "navigate": {
        const page = input.page as string;
        const params = input.params as Record<string, string> | undefined;
        const url = params
          ? `${page}?${new URLSearchParams(params).toString()}`
          : page;
        ctx.router.push(url);
        return ok({ navigatedTo: url });
      }

      case "generate_draft": {
        const result = await api.drafts.generate(
          input.sourceContent as string,
          (input.sourceType as string) ?? "MANUAL",
          input.blendId as string | undefined,
        );
        // Bridge: push the generated draft into the Crafting Station UI
        if (result.draft) {
          emitSetDraft({ draft: result.draft as { id: string; content: string } });
        }
        return ok(result.draft);
      }

      case "list_drafts": {
        const drafts = await api.drafts.list(input.status as string | undefined);
        return ok(drafts);
      }

      case "get_voice_profile": {
        const profile = await api.voice.getProfile();
        return ok(profile);
      }

      case "get_analytics_summary": {
        const summary = await api.analytics.summary();
        return ok(summary);
      }

      case "get_trending": {
        try {
          const topics = await api.trending.topics();
          return ok(topics);
        } catch {
          return ok({ message: "Trending data unavailable right now." });
        }
      }

      case "get_signals": {
        const alerts = await api.alerts.feed(input.category as "SIGNAL" | "NOTIFICATION" | undefined);
        return ok(alerts);
      }

      case "conduct_research": {
        try {
          const result = await api.research.conduct(input.query as string);
          return ok(result);
        } catch {
          return fail("Research service unavailable.");
        }
      }

      case "refine_draft": {
        const result = await api.drafts.refine(
          input.draftId as string,
          input.instruction as string,
        );
        // Bridge: push the refined draft into the Crafting Station UI
        if (result.draft) {
          emitSetDraft({ draft: result.draft as { id: string; content: string } });
        }
        return ok(result.draft);
      }

      case "post_draft": {
        const result = await api.drafts.postToX(input.draftId as string);
        return ok(result);
      }

      case "schedule_draft": {
        const result = await api.drafts.schedule(
          input.draftId as string,
          input.scheduledAt as string,
        );
        return ok(result.draft);
      }

      case "calibrate_voice": {
        const result = await api.voice.calibrate(input.handle as string);
        return ok(result);
      }

      case "update_voice_dimension": {
        const dims = input.dimensions as Record<string, number>;
        const result = await api.voice.updateProfile(dims);
        return ok(result);
      }

      case "subscribe_signal": {
        const result = await api.alerts.subscribe(
          input.type as string,
          input.value as string,
        );
        return ok(result);
      }

      default:
        return fail(`Unknown action: ${type}`);
    }
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
}

/** Format action result data into a readable summary for the chat. */
export function summarizeResult(action: OracleAgentAction, result: OracleActionResult): string {
  if (!result.success) return `Failed: ${result.error}`;

  const data = result.data as Record<string, unknown> | undefined;
  if (!data) return action.label;

  switch (action.type) {
    case "navigate":
      return `Navigated to ${data.navigatedTo}`;
    case "generate_draft": {
      const content = (data as Record<string, unknown>).content as string | undefined;
      return content ? `Draft: "${content.slice(0, 120)}..."` : "Draft generated.";
    }
    case "list_drafts": {
      const drafts = (data as Record<string, unknown>).drafts as unknown[];
      return drafts ? `Found ${drafts.length} draft${drafts.length === 1 ? "" : "s"}.` : "No drafts found.";
    }
    case "get_analytics_summary": {
      const s = data as Record<string, unknown>;
      return `30-day stats: ${s.draftsCreated ?? "?"} drafts, ${s.postsPublished ?? "?"} posted.`;
    }
    case "get_voice_profile":
      return "Voice profile loaded.";
    case "get_trending":
      return "Trending topics loaded.";
    case "get_signals": {
      const signals = (data as Record<string, unknown>).signals as unknown[] | undefined;
      return signals ? `${signals.length} signal${signals.length === 1 ? "" : "s"} in your feed.` : "No signals right now.";
    }
    case "refine_draft": {
      const refined = (data as Record<string, unknown>).content as string | undefined;
      return refined ? `Refined: “${refined.slice(0, 100)}…”` : "Draft refined.";
    }
    case "post_draft":
      return "Posted to X.";
    case "schedule_draft":
      return `Scheduled for ${((data as Record<string, unknown>).scheduledAt as string || "later").slice(0, 16)}.`;
    case "calibrate_voice":
      return "Voice calibrated from X account.";
    case "update_voice_dimension":
      return "Voice dimensions updated.";
    case "subscribe_signal":
      return "Subscribed to signals.";
    case "conduct_research":
      return "Research complete.";
    default:
      return action.label;
  }
}
