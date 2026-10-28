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

  const charger = () => {
    api<{ notifications: Notif[]; total: number }>("/notifications")
      .then((r) => setData(r.notifications))
      .catch(() => setData([]));
    api<{ nonLues: number }>("/notifications/count").then((r) => setCount(r.nonLues)).catch(() => {});
  };

  useEffect(charger, []);

  const filtered = useMemo(() => {
    if (!data) return null;
    if (tab === "unread") return data.filter((n) => !n.lue);
    return data;
  }, [data, tab]);

  const marquerLue = async (id: number) => {
    await api(`/notifications/${id}/lue`, { method: "PATCH" }).catch(() => {});
    setData((prev) => prev?.map((n) => (n.id === id ? { ...n, lue: true } : n)) ?? null);
    setCount((c) => Math.max(0, c - 1));
  };

  const toutLire = async () => {
    await api("/notifications/tout-lire", { method: "PATCH" }).catch(() => {});
    setData((prev) => prev?.map((n) => ({ ...n, lue: true })) ?? null);
    setCount(0);
  };

  const supprimer = async (id: number) => {
    await api(`/notifications/${id}`, { method: "DELETE" }).catch(() => {});
    setData((prev) => prev?.filter((n) => n.id !== id) ?? null);
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

      <div className="notif-page-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`notif-page-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}{t.key === "unread" && count > 0 ? ` (${count})` : ""}
          </button>
        ))}
      </div>

      {data === null && <p className="muted">Chargement...</p>}

      {filtered !== null && filtered.length === 0 && (
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