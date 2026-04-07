"use client";

/**
 * Oracle Event Bus — lightweight typed pub/sub singleton.
 * Works outside React (plain module-level singleton).
 *
 * Oracle → Pages:
 *   oracle:draft_created, oracle:navigated, oracle:action_completed, oracle:thinking
 * Pages → Oracle:
 *   page:context_updated, page:draft_selected, page:data_loaded
 */

export interface OracleEventMap {
  "oracle:draft_created": { draftId?: string; content?: string };
  "oracle:navigated": { url: string };
  "oracle:action_completed": { actionType: string; success: boolean; data?: unknown };
  "oracle:thinking": { isThinking: boolean };
  "page:context_updated": { page: string; summary: string; data?: Record<string, unknown> };
  "page:draft_selected": { draftId: string };
  "page:data_loaded": { page: string; dataType: string; count?: number };
}

export type OracleEventName = keyof OracleEventMap;

type Callback<T> = (data: T) => void;

class OracleEventBus {
  private listeners = new Map<string, Set<Callback<unknown>>>();

  on<K extends OracleEventName>(event: K, cb: Callback<OracleEventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(cb as Callback<unknown>);

    // Return unsubscribe function
    return () => {
      set.delete(cb as Callback<unknown>);
      if (set.size === 0) this.listeners.delete(event);
    };
  }

  emit<K extends OracleEventName>(event: K, data: OracleEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[OracleEventBus] Error in "${event}" listener:`, err);
      }
    });
  }

  off<K extends OracleEventName>(event: K, cb: Callback<OracleEventMap[K]>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(cb as Callback<unknown>);
    if (set.size === 0) this.listeners.delete(event);
  }

  /** Remove all listeners (useful for testing). */
  clear(): void {
    this.listeners.clear();
  }
}

/** Singleton event bus — importable from anywhere. */
export const oracleEvents = new OracleEventBus();
