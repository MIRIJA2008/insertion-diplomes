import { useEffect, useState } from "react";
import { api } from "../api";
import BackButton from "../components/BackButton";

interface Alerte {
  id: number; diplomeId: number; type: string; priorite: string; statut: string;
  commentaire: string | null; creeLe: string;
}

export default function AdminAlertes() {
  const [list, setList] = useState<Alerte[] | null>(null);
  const [loading, setLoading] = useState(false);

  const charger = () => {
    api<Alerte[]>("/admin/alertes").then(setList).catch(() => setList([]));
  };
  useEffect(charger, []);

  const generer = async () => {
    setLoading(true);
    try {
      await api("/admin/alertes/generer", { method: "POST" });
      charger();
      alert("Nouvelles alertes générées !");
    } finally { setLoading(false); }
  };

  const changerStatut = async (id: number, statut: string) => {
    await api(`/admin/alertes/${id}`, { method: "PATCH", body: { statut } }).catch(() => {});
    charger();
  };

  const badgePriorite: any = { HAUTE: "cand-badge-refusee", MOYENNE: "cand-badge-envoyee", BASSE: "cand-badge-vue" };

  return (
    <div>
      <BackButton />
      <div className="pf-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div className="pf-header-copy">
          <h1>Alertes & Accompagnement</h1>
          <p>Suivez les diplômés qui nécessitent une attention particulière.</p>
        </div>
        <button className="pf-btn pf-btn-primary" onClick={generer} disabled={loading}>
          {loading ? "Analyse..." : "⚡ Générer les alertes"}
        </button>
      </div>
      {list === null && <p className="muted">Chargement...</p>}
      {list !== null && list.length === 0 && <p className="empty">Aucune alerte pour le moment.</p>}
      {list !== null && list.length > 0 && (
        <div className="cand-list">
          {list.map((a) => (
            <div key={a.id} className="cand-item" style={{ flexDirection: "column", alignItems: "stretch", opacity: a.statut === "RESOLUE" ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".75rem" }}>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <span className={`cand-badge ${badgePriorite[a.priorite] || ""}`}>{a.priorite}</span>
                  <span className="pf-chip pf-chip-violet">{a.type.replace("_", " ")}</span>
                </div>
                <span style={{ fontSize: ".8rem", color: "var(--texte-muet)" }}>Diplômé ID: {a.diplomeId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <select value={a.statut} onChange={(e) => changerStatut(a.id, e.target.value)} style={{ padding: ".4rem", borderRadius: "8px", border: "1px solid var(--bord)", background: "var(--surface-2)" }}>
                  <option value="NOUVELLE">Nouvelle</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="RESOLUE">Résolue</option>
                </select>
                <span style={{ fontSize: ".8rem", color: "var(--texte-muet)" }}>Le {new Date(a.creeLe).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
