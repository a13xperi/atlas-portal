"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, User, VoiceProfile } from "./api";

interface AuthState {
  user: (User & { voiceProfile?: VoiceProfile }) | null;
  token: string | null;
  loading: boolean;
  login: (handle: string) => Promise<void>;
  register: (handle: string, onboardingTrack?: string) => Promise<void>;
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

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("atlas_token");
    if (saved) {
      setToken(saved);
      api.auth.me(saved)
        .then((res) => setUser(res.user))
        .catch(() => {
          localStorage.removeItem("atlas_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (handle: string) => {
    const res = await api.auth.login(handle);
    localStorage.setItem("atlas_token", res.token);
    setToken(res.token);
    const me = await api.auth.me(res.token);
    setUser(me.user);
  }, []);

  const register = useCallback(async (handle: string, onboardingTrack?: string) => {
    const res = await api.auth.register(handle, onboardingTrack);
    localStorage.setItem("atlas_token", res.token);
    setToken(res.token);
    const me = await api.auth.me(res.token);
    setUser(me.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("atlas_token");
    setToken(null);
    setUser(null);
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
