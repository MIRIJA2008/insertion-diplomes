export type Role = "ADMIN" | "CONSULTANT";

export interface User {
  id: number;
  nom: string;
  email: string;
  role: Role;
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
