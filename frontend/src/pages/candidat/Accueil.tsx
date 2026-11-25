import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../auth";

interface Actualite { id: number; titre: string; contenu: string; type: string; creeLe: string; }
interface Offre { id: number; titre: string; lieu: string; typeContrat: string | null; organisme: { nom: string }; }
interface Candidature { id: number; statut: string; dateEnvoi: string; offre: { titre: string; organisme: { nom: string } }; }
interface DashboardData {
  profil: any;
  promotion: { anneeSortie: number; filiere?: any } | null;
  offresRecommandees: Offre[];
  candidatures: Candidature[];
  actualites: Actualite[];
}

export default function CandidatAccueil() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setErreur("");
    api<DashboardData>("/candidat/dashboard")
      .then(setData)
      .catch((e) => setErreur(e instanceof Error ? e.message : "Impossible de charger votre espace."));
  };

  useEffect(() => {
    charger();
  }, []);

  if (!data && erreur) return (
    <div className="pf-empty">
      <h3>Impossible de charger votre espace</h3>
      <p>{erreur}</p>
      <button className="pf-btn pf-btn-primary" onClick={charger}>Réessayer</button>
    </div>
  );

  if (!data) return <p className="muted">Chargement de votre espace...</p>;

  const p = data.profil;
  const completion = p ? (
    [p.niveauEtudes, p.etablissement, p.filiereId, p.competences?.length > 0, p.experience, p.aCv].filter(Boolean).length / 6 * 100
  ) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>
      {/* COLONNE PRINCIPALE */}
      <div>
        {/* HERO */}
        <div className="cand-hero" style={{ marginBottom: "2rem" }}>
          <h1>Bonjour {user?.nom?.split(" ")[0]} 👋</h1>
          <p>Bienvenue dans votre espace diplômé. Suivez vos candidatures et découvrez les opportunités.</p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Link to="/candidat/profil" className="pf-btn pf-btn-primary">Compléter mon profil ({Math.round(completion)}%)</Link>
            <Link to="/offres" className="pf-btn pf-btn-ghost">Explorer les offres</Link>
          </div>
        </div>

        {/* MA PROMOTION */}
        {data.promotion && (
          <div className="cand-profil-card" style={{ marginBottom: "2rem", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))", borderColor: "rgba(139, 92, 246, 0.3)" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>🎓 Ma promotion</h3>
            <p style={{ fontSize: "1.2rem", fontWeight: "bold", margin: ".5rem 0" }}>Promotion {data.promotion.anneeSortie}</p>
            <p style={{ color: "var(--texte-muet)" }}>{p?.filiere?.intitule} - {p?.etablissement}</p>
          </div>
        )}

        {/* OFFRES RECOMMANDEES */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>Offres pour vous</h2>
          <Link to="/offres" style={{ color: "var(--fusion-cyan)", fontSize: ".9rem" }}>Tout voir →</Link>
        </div>
        {data.offresRecommandees.length === 0 ? (
          <p className="muted">Aucune offre recommandée pour le moment.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
            {data.offresRecommandees.map((o) => (
              <Link key={o.id} to={`/offres/${o.id}`} className="pf-offre-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 .5rem" }}>{o.titre}</h3>
                    <p className="pf-org" style={{ margin: 0 }}>{o.organisme.nom} • {o.lieu}</p>
                  </div>
                  {o.typeContrat && <span className="pf-chip pf-chip-violet">{o.typeContrat}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* BARRE LATERALE (DROITE) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* ACTUALITES PROMOTION */}
        <div className="cand-profil-card">
          <h3 style={{ marginBottom: "1rem" }}>📢 Actualités</h3>
          {data.actualites.length === 0 ? (
            <p className="muted" style={{ fontSize: ".9rem" }}>Aucune actualité pour le moment.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {data.actualites.map((a) => (
                <div key={a.id}>
                  <div style={{ fontWeight: "bold", fontSize: ".95rem" }}>{a.titre}</div>
                  <div style={{ fontSize: ".85rem", color: "var(--texte-muet)", marginTop: ".25rem" }}>{a.contenu}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--texte-muet)", marginTop: ".35rem" }}>{new Date(a.creeLe).toLocaleDateString("fr-FR")}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MES CANDIDATURES */}
        <div className="cand-profil-card">
          <h3 style={{ marginBottom: "1rem" }}>📋 Mes candidatures</h3>
          {data.candidatures.length === 0 ? (
            <p className="muted" style={{ fontSize: ".9rem" }}>Vous n avez pas encore postulé.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {data.candidatures.map((c) => (
                <div key={c.id}>
                  <div style={{ fontWeight: "bold", fontSize: ".95rem" }}>{c.offre.titre}</div>
                  <div style={{ fontSize: ".85rem", color: "var(--texte-muet)" }}>{c.offre.organisme.nom}</div>
                  <div style={{ marginTop: ".35rem" }}>
                    <span className={`cand-badge ${c.statut === "ACCEPTEE" ? "cand-badge-acceptee" : c.statut === "REFUSEE" ? "cand-badge-refusee" : "cand-badge-envoyee"}`}>{c.statut}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/candidat/candidatures" className="pf-btn pf-btn-ghost" style={{ width: "100%", marginTop: "1rem", fontSize: ".85rem" }}>Tout voir</Link>
        </div>
      </div>
    </div>
  );
}
