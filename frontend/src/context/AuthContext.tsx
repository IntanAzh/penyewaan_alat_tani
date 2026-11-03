"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "penyewa";
}

interface AuthContextType {
  user: UserSession | null;
  isAuthLoading: boolean;
  login: (user: UserSession) => void;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authMode: "login" | "register";
  setAuthMode: (mode: "login" | "register") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isAuthLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Sesi tidak dapat diperiksa");
        return res.json();
      })
      .then((data) => { if (active) setUser(data.user ?? null); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  const login = useCallback((userData: UserSession) => {
    setUser(userData);
    setAuthModalOpen(false);
  }, []);

  const logout = useCallback(async () => {
    const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    if (!response.ok) throw new Error("Logout gagal. Coba lagi.");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthLoading, login, logout, isAuthModalOpen, setAuthModalOpen, authMode, setAuthMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
