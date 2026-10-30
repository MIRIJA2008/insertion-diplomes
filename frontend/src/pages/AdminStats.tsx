import { useEffect, useState } from "react";
import { api } from "../api";
import BackButton from "../components/BackButton";

interface StatsData {
  situations: { statut: string; count: number }[];
  filieres: { nom: string; code: string; count: number }[];
  verification: { total: number; verifies: number };
}

const LABELS_SITUATION: any = {
  INCONNU: "Inconnu / À confirmer",
  EN_RECHERCHE: "En recherche demploi",
  EN_STAGE: "En stage",
  EN_ALTERNANCE: "En alternance",
  EN_CDD: "En CDD",
  EN_CDI: "En CDI",
  INDEPENDANT: "Indépendant",
  EN_FORMATION: "En formation",
};

export default function AdminStats() {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    api<StatsData>("/admin/stats-insertion").then(setData).catch(() => {});
  }, []);

  if (!data) return <p className="muted">Chargement des statistiques...</p>;

  const maxSituation = Math.max(...data.situations.map(s => s.count), 1);
  const maxFiliere = Math.max(...data.filieres.map(f => f.count), 1);
  const tauxVerif = data.verification.total > 0 ? Math.round((data.verification.verifies / data.verification.total) * 100) : 0;

  return (
    <div>
      <BackButton />
      <div className="pf-header"><div className="pf-header-copy"><h1>Rapports & Statistiques</h1><p>Indicateurs dinsertion professionnelle en temps réel.</p></div></div>

      {/* TAUX DE VERIFICATION */}
      <div className="cand-stats" style={{ marginBottom: "2rem" }}>
        <div className="cand-stat">
          <div className="cand-stat-label">Taux de vérification des profils</div>
          <div className="cand-stat-value">{tauxVerif}%</div>
          <div className="cand-stat-hint">{data.verification.verifies} profils vérifiés sur {data.verification.total}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        {/* SITUATIONS PRO */}
        <div className="cand-profil-card">
          <h3>Répartition par situation professionnelle</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
            {data.situations.map((s, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".35rem", fontSize: ".85rem" }}>
                  <span>{LABELS_SITUATION[s.statut] || s.statut}</span>
                  <strong>{s.count}</strong>
                </div>
                <div style={{ height: "8px", background: "var(--surface-2)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.count / maxSituation) * 100}%`, background: "linear-gradient(90deg, var(--fusion-cyan), var(--fusion-violet))", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FILIERES */}
        <div className="cand-profil-card">
          <h3>Répartition par filière</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
            {data.filieres.map((f, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".35rem", fontSize: ".85rem" }}>
                  <span>{f.code} - {f.nom}</span>
                  <strong>{f.count} diplômés</strong>
                </div>
                <div style={{ height: "8px", background: "var(--surface-2)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(f.count / maxFiliere) * 100}%`, background: "linear-gradient(90deg, var(--fusion-rose), var(--fusion-amber))", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
