"use client";

import { useEffect } from "react";
import { useOracleAgent } from "@/lib/oracle-agent";
import { oracleEvents } from "@/lib/oracle-events";

export interface OraclePageContext {
  page: string;
  summary: string;
  data?: Record<string, unknown>;
}

/**
 * Hook for pages to register what the user is currently looking at.
 * Context is injected into Oracle agent messages automatically.
 *
 * Usage:
 *   useOraclePageContext({
 *     page: "crafting",
 *     summary: "User is editing a draft about ETH staking",
 *     data: { activeDraftId: "abc", draftCount: 5 }
 *   });
 */
export function useOraclePageContext(context: OraclePageContext): void {
  const { setPageContext } = useOracleAgent();

  useEffect(() => {
    setPageContext(context);

    // Emit event so other listeners know context changed
    oracleEvents.emit("page:context_updated", {
      page: context.page,
      summary: context.summary,
      data: context.data,
    });

    // Cleanup: clear context on unmount
    return () => {
      setPageContext(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.page, context.summary, JSON.stringify(context.data)]);
}
