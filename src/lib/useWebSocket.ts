"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type WSStatus = "connecting" | "connected" | "disconnected";

interface UseWebSocketOptions {
  url?: string;
  token: string | null;
  onMessage?: (event: WSEvent) => void;
  reconnect?: boolean;
  maxRetries?: number;
}

export interface WSEvent {
  type: string;
  data: unknown;
  timestamp: string;
}

/**
 * WebSocket hook for real-time alerts and notifications.
 * Auto-reconnects with exponential backoff. Gracefully degrades
 * when the backend doesn't support WS yet.
 */
export function useWebSocket({
  url,
  token,
  onMessage,
  reconnect = true,
  maxRetries = 5,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WSStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const getWsUrl = useCallback(() => {
    if (url) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    if (!apiUrl) return null;
    return apiUrl.replace(/^http/, "ws") + "/ws/alerts";
  }, [url]);

  const connect = useCallback(() => {
    if (!token) return;
    const wsUrl = getWsUrl();
    if (!wsUrl) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");

    try {
      const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        retriesRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WSEvent = JSON.parse(event.data);
          onMessageRef.current?.(parsed);
        } catch {
          // Non-JSON message — ignore
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        wsRef.current = null;
        if (reconnect && retriesRef.current < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 30000);
          retriesRef.current++;
          timeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setStatus("disconnected");
    }
  }, [token, getWsUrl, reconnect, maxRetries]);

  const disconnect = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    retriesRef.current = maxRetries;
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("disconnected");
  }, [maxRetries]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      retriesRef.current = maxRetries;
      wsRef.current?.close();
    };
  }, [connect, maxRetries]);

  return { status, connect, disconnect, send };
}
