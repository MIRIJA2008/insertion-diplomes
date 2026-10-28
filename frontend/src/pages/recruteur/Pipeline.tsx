import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

interface CardCandidature {
  id: number;
  statut: string;
  dateEnvoi: string;
  candidat: { id: number; nom: string; email: string; profilCandidat: { niveauEtudes: string | null } | null };
  offre: { id: number; titre: string; lieu: string; typeContrat: string | null };
}

interface PipelineData {
  ENVOYEE: CardCandidature[];
  VUE: CardCandidature[];
  ACCEPTEE: CardCandidature[];
  REFUSEE: CardCandidature[];
  stats: { total: number; parStatut: Record<string, number> };
}

interface OffreOption { id: number; titre: string }

const COLONNES = [
  { key: "ENVOYEE", title: "Envoyees", cls: "pipe-col-envoyee" },
  { key: "VUE", title: "Vues", cls: "pipe-col-vue" },
  { key: "ACCEPTEE", title: "Acceptees", cls: "pipe-col-acceptee" },
  { key: "REFUSEE", title: "Refusees", cls: "pipe-col-refusee" },
];

function initiales(nom: string) {
  return nom.trim().split(/\s+/).map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("") || "?";
}

function ilYA(date: string) {
  const d = new Date(date);
  const jours = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (jours === 0) return "aujourd hui";
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} jours`;
  return d.toLocaleDateString("fr-FR");
}

export default function RecruteurPipeline() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [offres, setOffres] = useState<OffreOption[]>([]);
  const [filtreOffre, setFiltreOffre] = useState("");
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const charger = () => {
    const url = filtreOffre ? `/recruteur/pipeline?offreId=${filtreOffre}` : "/recruteur/pipeline";
    setData(null);
    api<PipelineData>(url).then(setData).catch(() => setData({
      ENVOYEE: [], VUE: [], ACCEPTEE: [], REFUSEE: [],
      stats: { total: 0, parStatut: {} },
    }));
  };

  useEffect(() => {
    api<OffreOption[]>("/offres/recruteur/mes-offres").then((offres: any) => {
      setOffres(offres.map((o: any) => ({ id: o.id, titre: o.titre })));
    }).catch(() => {});
  }, []);

  useEffect(charger, [filtreOffre]);

  const changerStatut = async (id: number, statut: string) => {
    setSaving(id);
    setMessage("");
    try {
      await api(`/candidatures/${id}/statut`, { method: "PATCH", body: { statut } });
      setMessage(`Statut mis a jour : ${statut}`);
      charger();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <div className="pf-header">
        <div className="pf-header-copy">
          <h1>Pipeline de recrutement</h1>
          <p>Suivez toutes les candidatures et prenez vos decisions en un coup d oeil.</p>
        </div>
      </div>

      <div className="pipe-filters">
        <select value={filtreOffre} onChange={(e) => setFiltreOffre(e.target.value)}>
          <option value="">Toutes les offres</option>
          {offres.map((o) => <option key={o.id} value={o.id}>{o.titre}</option>)}
        </select>
        {message && <span className={`pf-chip ${message.includes("Erreur") ? "cand-badge-refusee" : "cand-badge-acceptee"}`} style={{ padding: ".45rem .85rem" }}>{message}</span>}
      </div>

      {data && data.stats.total > 0 && (
        <div className="pipe-stats">
          <div className="pipe-stat"><div className="pipe-stat-label">Total</div><div className="pipe-stat-value">{data.stats.total}</div></div>
          <div className="pipe-stat"><div className="pipe-stat-label">Envoyees</div><div className="pipe-stat-value" style={{ color: "#60a5fa" }}>{data.stats.parStatut.ENVOYEE ?? 0}</div></div>
          <div className="pipe-stat"><div className="pipe-stat-label">Vues</div><div className="pipe-stat-value" style={{ color: "#a78bfa" }}>{data.stats.parStatut.VUE ?? 0}</div></div>
          <div className="pipe-stat"><div className="pipe-stat-label">Acceptees</div><div className="pipe-stat-value" style={{ color: "#34d399" }}>{data.stats.parStatut.ACCEPTEE ?? 0}</div></div>
        </div>
      )}

      {data === null && <p className="muted">Chargement...</p>}

      {data !== null && (
        <div className="pipe-kanban">
          {COLONNES.map((col) => {
            const items = (data as any)[col.key] as CardCandidature[];
            return (
              <div key={col.key} className={`pipe-col ${col.cls}`}>
                <div className="pipe-col-header">
                  <div className="pipe-col-title">{col.title}</div>
                  <div className="pipe-col-count">{items.length}</div>
                </div>

                {items.length === 0 && (
                  <div className="pipe-empty">Aucune candidature</div>
                )}

                {items.map((c) => (
                  <div key={c.id} className="pipe-card">
                    <div className="pipe-card-top">
                      <div className="rec-avatar" style={{ width: 38, height: 38, fontSize: ".78rem" }}>
                        {initiales(c.candidat?.nom ?? "?")}
                      </div>
                      <div className="pipe-card-body">
                        <div className="pipe-card-name">{c.candidat?.nom ?? "Candidat"}</div>
                        <div className="pipe-card-offre">{c.offre?.titre ?? "Offre"}</div>
                      </div>
                    </div>
                    <div className="pipe-card-date">
                      {c.candidat?.profilCandidat?.niveauEtudes ?? ""}
                      {c.candidat?.profilCandidat?.niveauEtudes ? " · " : ""}
                      {ilYA(c.dateEnvoi)}
                    </div>
                    <div className="pipe-card-actions">
                      <Link to={`/recruteur/candidature/${c.id}`} className="pf-btn pf-btn-view">
                        Detail
                      </Link>
                      {col.key === "ENVOYEE" && (
                        <button className="pf-btn pf-btn-view" disabled={saving === c.id} onClick={() => changerStatut(c.id, "VUE")}>
                          Marquer vue
                        </button>
                      )}
                      {(col.key === "ENVOYEE" || col.key === "VUE") && (
                        <>
                          <button className="pf-btn pf-btn-success" disabled={saving === c.id} onClick={() => changerStatut(c.id, "ACCEPTEE")}>
                            Accepter
                          </button>
                          <button className="pf-btn pf-btn-danger" disabled={saving === c.id} onClick={() => changerStatut(c.id, "REFUSEE")}>
                            Refuser
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {data !== null && data.stats.total === 0 && (
        <div className="pf-empty">
          <div className="pf-empty-icon">📭</div>
          <h3>Aucune candidature</h3>
          <p>Publiez des offres pour recevoir des candidatures.</p>
          <Link to="/recruteur/offres" className="pf-btn pf-btn-primary">Gerer mes offres</Link>
        </div>
      )}
    </div>
  );
}