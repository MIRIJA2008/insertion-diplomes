import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import BackButton from "../components/BackButton";

interface AdminStats {
  totalDiplomes: number; totalRecruteurs: number; totalOffres: number; totalCandidatures: number;
  offresOuvertes: number; candidaturesEnAttente: number; suggestionsEnAttente: number;
  evolutionInscriptions: { mois: string; count: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<AdminStats>("/admin/dashboard").then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="pf-alert pf-alert-error">{error}</div>;
  if (!stats) return <p className="muted">Chargement du tableau de bord...</p>;

  const maxInscriptions = Math.max(...stats.evolutionInscriptions.map(e => e.count), 1);

  return (
    <div>
      <BackButton />
      <div className="pf-header"><div className="pf-header-copy"><h1>Tableau de bord</h1><p>Vue d ensemble de la plateforme.</p></div></div>

      {/* CARTES STATISTIQUES */}
      <div className="cand-stats" style={{ marginBottom: "2rem" }}>
        <Link to="/admin/diplomes" className="cand-stat" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="cand-stat-label">Diplômes inscrits</div>
          <div className="cand-stat-value">{stats.totalDiplomes}</div>
        </Link>
        <Link to="/admin/organismes" className="cand-stat" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="cand-stat-label">Recruteurs</div>
          <div className="cand-stat-value">{stats.totalRecruteurs}</div>
        </Link>
        <Link to="/admin/offres" className="cand-stat" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="cand-stat-label">Offres actives</div>
          <div className="cand-stat-value">{stats.offresOuvertes} / {stats.totalOffres}</div>
        </Link>
        <Link to="/admin/candidatures" className="cand-stat" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="cand-stat-label">Candidatures</div>
          <div className="cand-stat-value">{stats.totalCandidatures}</div>
          {stats.candidaturesEnAttente > 0 && <div className="cand-stat-hint" style={{ color: "var(--fusion-amber)" }}>{stats.candidaturesEnAttente} en attente</div>}
        </Link>
      </div>

      {/* GRAPHIQUE EVOLUTION */}
      <div className="cand-profil-card" style={{ marginBottom: "2rem" }}>
        <h3>Évolution des inscriptions (6 derniers mois)</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", height: "200px", marginTop: "2rem" }}>
          {stats.evolutionInscriptions.map((e, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem", height: "100%", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", height: `${(e.count / maxInscriptions) * 100}%`, background: "linear-gradient(180deg, var(--fusion-cyan), var(--fusion-violet))", borderRadius: "8px 8px 0 0", minHeight: e.count > 0 ? "10px" : "0" }} />
              <span style={{ fontSize: ".75rem", color: "var(--texte-muet)" }}>{e.mois.split("-")[1]}/{e.mois.slice(2, 4)}</span>
              <strong style={{ fontSize: ".85rem" }}>{e.count}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIONS RAPIDES */}
      <h3 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Actions rapides</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <Link to="/admin/diplomes" className="pf-btn pf-btn-primary" style={{ padding: "1rem", textAlign: "center" }}>Suivi des diplômés</Link>
        <Link to="/tableau-de-bord/audit" className="pf-btn" style={{ padding: "1rem", textAlign: "center" }}>Journal d audit</Link>
        <Link to="/tableau-de-bord/suggestions" className="pf-btn" style={{ padding: "1rem", textAlign: "center", position: "relative" }}>
          Suggestions {stats.suggestionsEnAttente > 0 && <span style={{ background: "var(--fusion-rose)", color: "white", borderRadius: "50%", padding: "0 .4rem", marginLeft: ".5rem", fontSize: ".8rem" }}>{stats.suggestionsEnAttente}</span>}
        </Link>
        <Link to="/filieres" className="pf-btn pf-btn-ghost" style={{ padding: "1rem", textAlign: "center" }}>Gérer les filières</Link>
      </div>
    </div>
  );
}
