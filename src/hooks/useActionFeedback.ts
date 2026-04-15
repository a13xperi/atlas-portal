"use client";

import { useCallback, useRef, useState } from "react";
import { useToast } from "@/hooks/useToast";

interface ActionFeedbackOptions<T> {
  successMessage?: string;
  getSuccessMessage?: (result: T) => string;
  errorMessage?: string;
  onResult?: (message: string, type: "success" | "error") => void;
}

export function getActionErrorMessage(
  error: unknown,
  fallback = "Action failed"
) {
  return error instanceof Error ? error.message : fallback;
}

export function useActionFeedback() {
  const { push } = useToast();
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>(
    {}
  );
  const loadingActionsRef = useRef<Record<string, boolean>>({});

  const setActionLoading = useCallback((key: string, isLoading: boolean) => {
    if (isLoading) {
      loadingActionsRef.current[key] = true;
      setLoadingActions((prev) => ({ ...prev, [key]: true }));
      return;
    }

    delete loadingActionsRef.current[key];
    setLoadingActions((prev) => {
      if (!prev[key]) {
        return prev;
      }

      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const runAction = useCallback(
    async <T,>(
      key: string,
      action: () => Promise<T>,
      options: ActionFeedbackOptions<T> = {}
    ) => {
      if (loadingActionsRef.current[key]) {
        return undefined;
      }

      setActionLoading(key, true);

      try {
        const result = await action();
        const message =
          options.getSuccessMessage?.(result) ??
          options.successMessage ??
          "Action completed";

        push({ title: message, kind: "success" });
        options.onResult?.(message, "success");
        return result;
      } catch (error) {
        const errMsg = getActionErrorMessage(error, options.errorMessage ?? "Action failed");
        push({ title: errMsg, kind: "error" });
        options.onResult?.(errMsg, "error");
        return undefined;
      } finally {
        setActionLoading(key, false);
      }
    },
    [push, setActionLoading]
  );

  const isLoading = useCallback(
    (key: string) => Boolean(loadingActions[key]),
    [loadingActions]
  );

  return {
    isLoading,
    loadingActions,
    runAction,
  };
}
