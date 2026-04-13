"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, OnboardingTrack, User, VoiceProfile, setAccessToken } from "./api";

// Session flag cookie — tells the middleware the user has logged in.
// The real auth token is cross-origin (HttpOnly on the backend domain),
// so this lightweight flag on the frontend domain enables server-side redirects.
function setSessionCookie(active: boolean) {
  if (typeof document === "undefined") return;
  if (active) {
    document.cookie = "atlas_session=1; path=/; max-age=604800; SameSite=Lax; Secure";
  } else {
    document.cookie = "atlas_session=; path=/; max-age=0";
  }
}

interface AuthState {
  user: (User & { voiceProfile?: VoiceProfile }) | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (handle: string, email: string, password: string, onboardingTrack?: OnboardingTrack) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount via cookie (HttpOnly — no localStorage needed)
  useEffect(() => {
    api.auth.me()
      .then((res) => { setUser(res.user); setSessionCookie(true); })
      .catch(async () => {
        // Token may be expired — try refresh
        try {
          const refreshRes = await api.auth.refresh();
          if (refreshRes.token) {
            setAccessToken(refreshRes.token);
          }
          const me = await api.auth.me();
          setUser(me.user);
          setSessionCookie(true);
          return;
        } catch {
          // Refresh also failed — not authenticated
        }
        setUser(null);
        setSessionCookie(false);
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle bfcache restores — browser back button can restore a stale logged-in page
  // after logout. Re-check the session cookie; if it's gone, clear state.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const hasSession = document.cookie.split(";").some((c) => c.trim().startsWith("atlas_session=1"));
      if (!hasSession) {
        setUser(null);
        setAccessToken(null);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    if (res.token) {
      setAccessToken(res.token);
    }
    const me = await api.auth.me();
    setUser(me.user);
    setSessionCookie(true);
  }, []);

  const register = useCallback(async (handle: string, email: string, password: string, onboardingTrack?: OnboardingTrack) => {
    const res = await api.auth.register(handle, email, password, onboardingTrack);
    if (res.token) {
      setAccessToken(res.token);
      const me = await api.auth.me();
      setUser(me.user);
      setSessionCookie(true);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Best-effort — clear local state regardless
    }
    setAccessToken(null);
    setUser(null);
    setSessionCookie(false);
    // Hard redirect — prevents bfcache restoring stale protected pages after logout
    window.location.replace("/");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
