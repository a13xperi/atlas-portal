"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, User, VoiceProfile } from "./api";

interface AuthState {
  user: (User & { voiceProfile?: VoiceProfile }) | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (handle: string, email: string, password: string, onboardingTrack?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const saveTokens = (accessToken: string, refreshToken?: string) => {
    localStorage.setItem("atlas_token", accessToken);
    if (refreshToken) localStorage.setItem("atlas_refresh_token", refreshToken);
    setToken(accessToken);
  };

  const clearTokens = () => {
    localStorage.removeItem("atlas_token");
    localStorage.removeItem("atlas_refresh_token");
    setToken(null);
    setUser(null);
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("atlas_token");
    if (saved) {
      setToken(saved);
      api.auth.me(saved)
        .then((res) => setUser(res.user))
        .catch(async () => {
          // Token expired — try refresh
          const refreshToken = localStorage.getItem("atlas_refresh_token");
          if (refreshToken) {
            try {
              const refreshed = await api.auth.refresh(refreshToken);
              saveTokens(refreshed.token, refreshed.refresh_token);
              const me = await api.auth.me(refreshed.token);
              setUser(me.user);
              return;
            } catch {
              // Refresh also failed
            }
          }
          clearTokens();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    saveTokens(res.token, res.refresh_token);
    const me = await api.auth.me(res.token);
    setUser(me.user);
  }, []);

  const register = useCallback(async (handle: string, email: string, password: string, onboardingTrack?: string) => {
    const res = await api.auth.register(handle, email, password, onboardingTrack);
    if (res.token) {
      saveTokens(res.token, res.refresh_token);
      const me = await api.auth.me(res.token);
      setUser(me.user);
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
