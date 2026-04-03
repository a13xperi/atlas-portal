"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth";

interface Alert {
  id: string;
  type: string;
  title: string;
  context?: string | null;
  createdAt: string;
}

interface AlertSocketState {
  connected: boolean;
  unreadNotifications: number;
  latestAlert: Alert | null;
  clearUnread: () => void;
  onNewAlert: (cb: (alert: Alert) => void) => () => void;
}

const AlertSocketContext = createContext<AlertSocketState>({
  connected: false,
  unreadNotifications: 0,
  latestAlert: null,
  clearUnread: () => {},
  onNewAlert: () => () => {},
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function AlertSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Set<(alert: Alert) => void>>(new Set());
  const [connected, setConnected] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(`${API_URL}/alerts`, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("new-alert", (alert: Alert) => {
      setLatestAlert(alert);
      setUnreadNotifications((count) => count + 1);
      listenersRef.current.forEach((cb) => cb(alert));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  const clearUnread = useCallback(() => setUnreadNotifications(0), []);

  const onNewAlert = useCallback((cb: (alert: Alert) => void) => {
    listenersRef.current.add(cb);
    return () => { listenersRef.current.delete(cb); };
  }, []);

  return (
    <AlertSocketContext.Provider value={{ connected, unreadNotifications, latestAlert, clearUnread, onNewAlert }}>
      {children}
    </AlertSocketContext.Provider>
  );
}

export function useAlertSocket() {
  return useContext(AlertSocketContext);
}
