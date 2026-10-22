import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fr } from "./fr";
import { mg } from "./mg";

export type Langue = "fr" | "mg";

const DICTIONNAIRES: Record<Langue, Record<string, string>> = { fr, mg };

interface I18nValue {
  langue: Langue;
  definirLangue: (l: Langue) => void;
  t: (cle: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>(() =>
    (localStorage.getItem("langue") as Langue) === "mg" ? "mg" : "fr"
  );

  useEffect(() => {
    localStorage.setItem("langue", langue);
    document.documentElement.lang = langue;
  }, [langue]);

  const definirLangue = (l: Langue) => setLangue(l);
  const t = (cle: string) => DICTIONNAIRES[langue][cle] ?? DICTIONNAIRES.fr[cle] ?? cle;

  return <I18nContext.Provider value={{ langue, definirLangue, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit etre utilise dans I18nProvider");
  return ctx;
}