export type Role = "ADMIN" | "CONSULTANT" | "CANDIDAT" | "RECRUTEUR";

export interface User {
  id: number;
  nom: string;
  email: string;
  role: Role;
  langue?: string;
  couleurAccent?: string;
}

export interface Session {
  token: string;
  user: User;
}

const KEY = "session";

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session | null) {
  if (session) sessionStorage.setItem(KEY, JSON.stringify(session));
  else sessionStorage.removeItem(KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface Options {
  method?: string;
  body?: unknown;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const session = getSession();
  const hasBody = options.body !== undefined;
  const res = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && session) {
      setSession(null);
      window.location.assign("/login");
    }
    const details = Array.isArray(data?.details)
      ? data.details.map((d: { champ: string; message: string }) => `${d.champ} : ${d.message}`).join(" ; ")
      : "";
    throw new ApiError(res.status, [data?.error ?? "Une erreur est survenue", details].filter(Boolean).join(" - "));
  }
  return data as T;
}

export interface Offre {
  id: number;
  titre: string;
  description: string;
  niveauRequis: string | null;
  filiereId: number | null;
  filiere?: { id: number; code: string; intitule: string } | null;
  competencesRecherchees: string[];
  profilRecherche: string | null;
  lieu: string;
  typeContrat: string | null;
  dateLimite: string;
  creeLe: string;
  statut: "OUVERTE" | "EXPIRE_BIENTOT" | "CLOTUREE";
  nbCandidatures: number;
  score?: number;
  organisme: { id: number; nom: string; type: string; ville: string | null; verifie: boolean };
}

export interface Candidature {
  id: number;
  statut: "ENVOYEE" | "VUE" | "ACCEPTEE" | "REFUSEE";
  dateEnvoi: string;
  offre: { id: number; titre: string; dateLimite: string; organisme?: { nom: string } };
  candidat?: { id: number; nom: string; email: string; profilCandidat?: { filiere?: { code: string }; competences: string[]; experience: string | null } | null };
}

export interface Notification {
  id: number;
  titre: string;
  contenu: string;
  lue: boolean;
  creeLe: string;
}