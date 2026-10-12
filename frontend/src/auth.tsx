import { createContext, useContext, useState, type ReactNode } from "react";
import { api, getSession, setSession, type User } from "./api";

interface AuthValue {
  user: User | null;
  login: (email: string, motDePasse: string) => Promise<void>;
  logout: () => void;
}

interface LoginResponse {
  token: string;
  utilisateur: User;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getSession()?.user ?? null);

  const login = async (email: string, motDePasse: string) => {
    const res = await api<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, motDePasse },
    });
    setSession({ token: res.token, user: res.utilisateur });
    setUser(res.utilisateur);
  };

  const logout = () => {
    setSession(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise dans AuthProvider");
  return ctx;
}
