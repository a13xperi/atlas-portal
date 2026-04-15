"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useAlertSocket, type Alert } from "@/lib/alertSocket";

export default function AlertToastBridge() {
  const { onNewAlert } = useAlertSocket();
  const { push } = useToast();

  useEffect(() => {
    return onNewAlert((alert: Alert) => {
      push({
        kind: "info",
        title: alert.title,
        description: alert.context ?? undefined,
        href: "/alerts",
      });
    });
  }, [onNewAlert, push]);

  return null;
}
