/**
 * Oracle Agent types — shared between frontend context and backend endpoint.
 */

export type OracleActionType =
  | "navigate"
  | "generate_draft"
  | "list_drafts"
  | "get_voice_profile"
  | "get_analytics_summary"
  | "get_trending"
  | "get_signals"
  | "conduct_research"
  // Phase 2+
  | "refine_draft"
  | "schedule_draft"
  | "post_draft"
  | "calibrate_voice"
  | "update_voice_dimension"
  | "subscribe_signal"
  | "generate_briefing";

/** An action the Oracle wants to execute. */
export interface OracleAgentAction {
  id: string;
  type: OracleActionType;
  input: Record<string, unknown>;
  requiresConfirmation: boolean;
  label: string;
}

/** Result of executing an action (sent back for chaining). */
export interface OracleActionResult {
  actionId: string;
  type: OracleActionType;
  success: boolean;
  data?: unknown;
  error?: string;
}

/** Full response from POST /api/oracle/agent. */
export interface OracleAgentResponse {
  text: string;
  actions: OracleAgentAction[];
  serverResults?: Array<{ toolCallId: string; result: unknown }>;
}

/** Chat message with optional agent actions/results. */
export interface AgentChatMessage {
  id: string;
  role: "oracle" | "user";
  text: string;
  actions?: OracleAgentAction[];
  actionResults?: OracleActionResult[];
  timestamp: number;
}
