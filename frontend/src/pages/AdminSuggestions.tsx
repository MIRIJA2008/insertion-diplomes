import { useEffect, useState } from "react";
import { api } from "../api";
import BackButton from "../components/BackButton";

interface Suggestion { id: number; categorie: string; contenu: string; statut: string; reponse: string | null; creeLe: string; }

export default function AdminSuggestions() {
  const [list, setList] = useState<Suggestion[] | null>(null);

  const charger = () => {
    api<Suggestion[]>("/suggestions").then(setList).catch(() => setList([]));
  };
  useEffect(charger, []);

  const changerStatut = async (id: number, statut: string) => {
    await api(`/suggestions/${id}`, { method: "PATCH", body: { statut } }).catch(() => {});
    charger();
  };

  const badgeColor: any = {
    NOUVELLE: "cand-badge-envoyee",
    EN_COURS: "cand-badge-vue",
    RETENUE: "cand-badge-acceptee",
    MISE_EN_OEUVRE: "cand-badge-acceptee",
    REFUSEE: "cand-badge-refusee"
  };

  return (
    <div>
      <BackButton />
      <div className="pf-header"><div className="pf-header-copy"><h1>Suggestions des utilisateurs</h1><p>Gérez les idées et retours de la communauté.</p></div></div>
      {list === null && <p className="muted">Chargement...</p>}
      {list !== null && list.length === 0 && <p className="empty">Aucune suggestion pour le moment.</p>}
      {list !== null && list.length > 0 && (
        <div className="cand-list">
          {list.map((s) => (
            <div key={s.id} className="cand-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span className="pf-chip pf-chip-cyan">{s.categorie}</span>
                <span className={`cand-badge ${badgeColor[s.statut] || ""}`}>{s.statut}</span>
              </div>
              <p style={{ margin: "0 0 1rem" }}>{s.contenu}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".85rem", color: "var(--texte-muet)" }}>
                <span>Le {new Date(s.creeLe).toLocaleDateString("fr-FR")}</span>
                <select value={s.statut} onChange={(e) => changerStatut(s.id, e.target.value)} style={{ padding: ".4rem", borderRadius: "8px", border: "1px solid var(--bord)", background: "var(--surface-2)" }}>
                  <option value="NOUVELLE">Nouvelle</option>
                  <option value="EN_COURS">En cours d examen</option>
                  <option value="RETENUE">Retenue</option>
                  <option value="MISE_EN_OEUVRE">Mise en oeuvre</option>
                  <option value="REFUSEE">Refusee</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
