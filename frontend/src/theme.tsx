import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

export const ACCENTS: Record<string, string> = {
  bleu: "#1f6f8b",
  vert: "#15803d",
  rouge: "#b91c1c",
  violet: "#7c3aed",
  orange: "#c2410c",
  rose: "#be185d",
};

interface ThemeValue {
  sombre: boolean;
  basculerTheme: () => void;
  accent: string;
  definirAccent: (a: string) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [sombre, setSombre] = useState(() => localStorage.getItem("theme") === "sombre");
  const [accent, setAccent] = useState(() => localStorage.getItem("accent") ?? "bleu");

  useEffect(() => {
    document.documentElement.dataset.theme = sombre ? "sombre" : "clair";
    document.documentElement.style.setProperty("--accent", ACCENTS[accent] ?? ACCENTS.bleu);
    localStorage.setItem("theme", sombre ? "sombre" : "clair");
    localStorage.setItem("accent", accent);
  }, [sombre, accent]);

  const definirAccent = (a: string) => {
    setAccent(a);
    api("/profils/moi/preferences", { method: "PUT", body: { couleurAccent: a } }).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ sombre, basculerTheme: () => setSombre((s) => !s), accent, definirAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit etre utilise dans ThemeProvider");
  return ctx;
}