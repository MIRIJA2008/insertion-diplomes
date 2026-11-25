import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

interface Notif {
  id: number;
  titre: string;
  contenu: string;
  lue: boolean;
  creeLe: string;
}

const TABS = [
  { key: "all", label: "Toutes" },
  { key: "unread", label: "Non lues" },
];

function ilYA(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffJ = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "a l instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH} h`;
  if (diffJ < 7) return `il y a ${diffJ} j`;
  return d.toLocaleDateString("fr-FR");
}

function iconFor(titre: string) {
  const t = titre.toLowerCase();
  if (t.includes("candidature")) return "📋";
  if (t.includes("message")) return "💬";
  if (t.includes("offre")) return "💼";
  if (t.includes("profil")) return "👤";
  return "🔔";
}

export default function NotificationsPage() {
  const [data, setData] = useState<Notif[] | null>(null);
  const [tab, setTab] = useState("all");
  const [count, setCount] = useState(0);
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    setErreur("");

    try {
      const r = await api<{ notifications: Notif[]; total: number }>("/notifications");
      setData(r.notifications);
    } catch (e) {
      setData(null);
      setErreur(e instanceof Error ? e.message : "Impossible de charger les notifications.");
    }

    try {
      const r = await api<{ nonLues: number }>("/notifications/count");
      setCount(r.nonLues);
    } catch {
      setCount(0);
    }
  };

  useEffect(() => {
    void charger();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return null;
    if (tab === "unread") return data.filter((n) => !n.lue);
    return data;
  }, [data, tab]);

  const marquerLue = async (id: number) => {
    setErreur("");
    try {
      await api(`/notifications/${id}/lue`, { method: "PATCH" });
      setData((prev) => prev?.map((n) => (n.id === id ? { ...n, lue: true } : n)) ?? null);
      setCount((c) => Math.max(0, c - 1));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Impossible de marquer cette notification comme lue.");
    }
  };

  const toutLire = async () => {
    setErreur("");
    try {
      await api("/notifications/tout-lire", { method: "PATCH" });
      setData((prev) => prev?.map((n) => ({ ...n, lue: true })) ?? null);
      setCount(0);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Impossible de marquer toutes les notifications comme lues.");
    }
  };

  const supprimer = async (id: number) => {
    setErreur("");
    try {
      await api(`/notifications/${id}`, { method: "DELETE" });
      setData((prev) => prev?.filter((n) => n.id !== id) ?? null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Impossible de supprimer cette notification.");
    }
  };

  return (
    <div>
      <div className="pf-header">
        <div className="pf-header-copy">
          <h1>Notifications {count > 0 && <span className="notif-badge-header">{count}</span>}</h1>
          <p>Suivez toutes les activites qui vous concernent.</p>
        </div>
        {count > 0 && (
          <div className="pf-header-actions">
            <button className="pf-btn pf-btn-ghost" onClick={toutLire}>Tout marquer comme lu</button>
          </div>
        )}
      </div>

      {erreur && <p role="alert" style={{ color: "var(--danger, #b42318)" }}>{erreur}</p>}

      <div className="notif-page-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`notif-page-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}{t.key === "unread" && count > 0 ? ` (${count})` : ""}
          </button>
        ))}
      </div>

      {data === null && !erreur && <p className="muted">Chargement...</p>}

      {!erreur && filtered !== null && filtered.length === 0 && (
        <div className="notif-page-empty">
          <div className="notif-page-empty-icon">🔔</div>
          <h3>{tab === "unread" ? "Aucune notification non lue" : "Aucune notification"}</h3>
          <p>{tab === "unread" ? "Vous etes a jour !" : "Les notifications apparaitront ici."}</p>
        </div>
      )}

      {filtered !== null && filtered.length > 0 && (
        <div className="notif-page-list">
          {filtered.map((n) => (
            <div key={n.id} className={`notif-page-item ${n.lue ? "" : "non-lue"}`}>
              <div className="notif-page-icon">{iconFor(n.titre)}</div>
              <div className="notif-page-content">
                <div className="notif-page-title">{n.titre}</div>
                <div className="notif-page-msg">{n.contenu}</div>
                <div className="notif-page-date">{ilYA(n.creeLe)}</div>
              </div>
              {!n.lue && <div className="notif-page-dot" />}
              {!n.lue && (
                <button className="pf-btn" style={{ padding: ".3rem .6rem", fontSize: ".75rem" }} onClick={() => marquerLue(n.id)}>
                  Marquer lu
                </button>
              )}
              <button className="notif-page-delete" onClick={() => supprimer(n.id)} title="Supprimer">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}