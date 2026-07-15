"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/api-client";
import type { UserResponse } from "@/lib/types";

interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "mini-trello-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const storedUser = window.localStorage.getItem(USER_KEY);
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  async function login(username: string, password: string) {
    const res = await authApi.login(username, password);
    setToken(res.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    router.push("/boards");
  }

  async function register(username: string, email: string, password: string) {
    await authApi.register(username, email, password);
    await login(username, password);
  }

  function logout() {
    clearToken();
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
