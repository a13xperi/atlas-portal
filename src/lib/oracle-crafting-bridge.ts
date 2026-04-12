/**
 * Oracle-Crafting Bridge — a minimal event system that lets the Oracle
 * agent push content into the Crafting Station UI.
 *
 * The Oracle side dispatches custom DOM events with payload data.
 * The Crafting page subscribes to these events and updates its state.
 *
 * Events:
 * - oracle:populate-draft — sets the content input text
 * - oracle:apply-feedback — sets the feedback input text
 * - oracle:set-draft — directly sets the active draft (after generation)
 */

export interface OraclePopulateDraftEvent {
  content: string;
  /** Optional source type for the content input */
  sourceType?: "REPORT" | "ARTICLE" | "MANUAL";
}

export interface OracleApplyFeedbackEvent {
  feedback: string;
}

export interface OracleSetDraftEvent {
  draft: {
    id: string;
    content: string;
    [key: string]: unknown;
  };
}

// Type-safe event dispatch helpers

export function emitPopulateDraft(payload: OraclePopulateDraftEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("oracle:populate-draft", { detail: payload }),
  );
}

export function emitApplyFeedback(payload: OracleApplyFeedbackEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("oracle:apply-feedback", { detail: payload }),
  );
}

export function emitSetDraft(payload: OracleSetDraftEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("oracle:set-draft", { detail: payload }),
  );
}

// Listener helpers for the Crafting page

export function onPopulateDraft(
  handler: (payload: OraclePopulateDraftEvent) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  window.addEventListener("oracle:populate-draft", listener);
  return () => window.removeEventListener("oracle:populate-draft", listener);
}

export function onApplyFeedback(
  handler: (payload: OracleApplyFeedbackEvent) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  window.addEventListener("oracle:apply-feedback", listener);
  return () => window.removeEventListener("oracle:apply-feedback", listener);
}

export function onSetDraft(
  handler: (payload: OracleSetDraftEvent) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  window.addEventListener("oracle:set-draft", listener);
  return () => window.removeEventListener("oracle:set-draft", listener);
}
