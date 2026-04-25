import React, { createContext, useContext, useEffect, useState } from "react";
import { me } from "../api/auth.api";
import type { MeResponse } from "../types/api";

type AuthCtx = {
  user: MeResponse | null;
  loading: boolean;
  setToken: (token: string | null) => void;
  refreshMe: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = (token: string | null) => {
    if (token) localStorage.setItem("access_token", token);
    else localStorage.removeItem("access_token");
  };

  const refreshMe = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await me();
      setUser(res.data);
    } catch {
      setToken(null);
      setUser(null);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    (async () => {
      await refreshMe();
      setLoading(false);
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setToken, refreshMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};