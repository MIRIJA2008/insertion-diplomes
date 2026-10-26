import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Candidature, type Offre } from "../../api";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";

interface ProfilMoi {
  utilisateur: { id: number; nom: string; email: string };
  profil: {
    niveauEtudes: string | null;
    filiere: any;
    etablissement: string | null;
    diplomes: string[];
    competences: string[];
    experience: string | null;
    aCv: boolean;
    aPhoto: boolean;
  } | null;
}

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

const STATUT_LABEL: Record<string, string> = {
  ENVOYEE: "Envoyee", VUE: "Vue", ACCEPTEE: "Acceptee", REFUSEE: "Refusee",
};

function badgeClass(statut: string) {
  const s = statut.toLowerCase();
  if (s === "acceptee") return "cand-badge cand-badge-acceptee";
  if (s === "refusee") return "cand-badge cand-badge-refusee";
  if (s === "vue") return "cand-badge cand-badge-vue";
  return "cand-badge cand-badge-envoyee";
}

function calculerCompletion(p: ProfilMoi["profil"]) {
  if (!p) return 0;
  const checks = [
    !!p.niveauEtudes,
    !!p.filiere,
    !!p.etablissement,
    p.diplomes.length > 0,
    p.competences.length >= 3,
    !!p.experience,
    p.aCv,
    p.aPhoto,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function CandidatAccueil() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [profil, setProfil] = useState<ProfilMoi | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[] | null>(null);
  const [favoris, setFavoris] = useState<any[] | null>(null);
  const [recommandees, setRecommandees] = useState<Offre[] | null>(null);

  useEffect(() => {
    api<ProfilMoi>("/profils/moi").then(setProfil).catch(() => setProfil(null));
    api<Candidature[]>("/mes-candidatures").then(setCandidatures).catch(() => setCandidatures([]));
    api<any[]>("/mes-favoris").then(setFavoris).catch(() => setFavoris([]));
    api<Offre[]>("/offres/recommandees").then(setRecommandees).catch(() => setRecommandees([]));
  }, []);

  const p = profil?.profil ?? null;
  const completion = calculerCompletion(p);
  const nbCand = candidatures?.length ?? 0;
  const nbReponses = candidatures?.filter((c) => c.statut !== "ENVOYEE").length ?? 0;
  const nbAcceptees = candidatures?.filter((c) => c.statut === "ACCEPTEE").length ?? 0;
  const nbFavoris = favoris?.length ?? 0;
  const dernieres = (candidatures ?? []).slice(0, 4);
  const topRecommandees = (recommandees ?? []).slice(0, 3);

  const checklist = [
    { label: "Niveau d etudes", ok: !!p?.niveauEtudes },
    { label: "Filiere", ok: !!p?.filiere },
    { label: "Etablissement", ok: !!p?.etablissement },
    { label: "Au moins 1 diplome", ok: (p?.diplomes?.length ?? 0) > 0 },
    { label: "3 competences minimum", ok: (p?.competences?.length ?? 0) >= 3 },
    { label: "Experience", ok: !!p?.experience },
    { label: "CV uploade", ok: !!p?.aCv },
    { label: "Photo de profil", ok: !!p?.aPhoto },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="cand-hero">
        <h1>Bonjour {user?.nom?.split(" ")[0] ?? ""}, votre parcours continue ici</h1>
        <p>Completez votre profil, suivez vos candidatures et decouvrez les opportunites adaptees a votre formation.</p>
        <div className="cand-hero-actions">
          <Link to="/offres" className="pf-btn pf-btn-primary">Explorer les offres</Link>
          <Link to="/candidat/profil" className="pf-btn">Mon profil</Link>
          <Link to="/candidat/candidatures" className="pf-btn pf-btn-ghost">Mes candidatures</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="cand-stats">
        <div className="cand-stat">
          <div className="cand-stat-label">Candidatures</div>
          <div className="cand-stat-value">{nbCand}</div>
          <div className="cand-stat-hint">{nbReponses} reponse{nbReponses > 1 ? "s" : ""}</div>
        </div>
        <div className="cand-stat">
          <div className="cand-stat-label">Acceptees</div>
          <div className="cand-stat-value">{nbAcceptees}</div>
          <div className="cand-stat-hint">Felicitations !</div>
        </div>
        <div className="cand-stat">
          <div className="cand-stat-label">Favoris</div>
          <div className="cand-stat-value">{nbFavoris}</div>
          <div className="cand-stat-hint">offres sauvegardees</div>
        </div>
        <div className="cand-stat">
          <div className="cand-stat-label">Profil</div>
          <div className="cand-stat-value">{completion}%</div>
          <div className="cand-stat-hint">complete</div>
        </div>
      </div>

      {/* Completion profil */}
      {completion < 100 && (
        <div className="cand-progress-card">
          <div className="cand-progress-header">
            <h3>Completez votre profil</h3>
            <div className="cand-progress-value">{completion}%</div>
          </div>
          <div className="cand-progress-bar">
            <div className="cand-progress-fill" style={{ width: `${completion}%` }} />
          </div>
          <div className="cand-progress-checklist">
            {checklist.map((c, i) => (
              <div key={i} className={`cand-progress-item ${c.ok ? "done" : ""}`}>{c.label}</div>
            ))}
          </div>
          <Link to="/candidat/profil" className="pf-btn pf-btn-primary" style={{ marginTop: ".5rem" }}>Completer mon profil</Link>
        </div>
      )}

      {/* Offres recommandees */}
      <div className="cand-section-title">
        <h2>Offres recommandees pour vous</h2>
        <Link to="/offres">Tout voir &rarr;</Link>
      </div>
      {recommandees === null && <p className="muted">{t("common.loading")}</p>}
      {recommandees !== null && topRecommandees.length === 0 && (
        <div className="pf-empty">
          <div className="pf-empty-icon">✨</div>
          <h3>Pas encore de recommandations</h3>
          <p>Completez votre profil pour recevoir des offres adaptees.</p>
          <Link to="/candidat/profil" className="pf-btn pf-btn-primary">Completer mon profil</Link>
        </div>
      )}
      {topRecommandees.length > 0 && (
        <div className="pf-offres-grid">
          {topRecommandees.map((o) => (
            <Link key={o.id} to={`/offres/${o.id}`} className="pf-offre-card">
              <div className="pf-offre-meta">
                {o.typeContrat && <span className="pf-chip pf-chip-violet">{o.typeContrat}</span>}
                {o.filiere && <span className="pf-chip pf-chip-cyan">{o.filiere.code}</span>}
              </div>
              <h3>{o.titre}</h3>
              <p className="pf-org">{o.organisme.nom}</p>
              <p className="pf-desc">{o.description}</p>
              <div className="pf-offre-footer">
                <span>{o.lieu}</span>
                <span className="pf-arrow">Voir &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Dernieres candidatures */}
      <div className="cand-section-title">
        <h2>Mes dernieres candidatures</h2>
        <Link to="/candidat/candidatures">Tout voir &rarr;</Link>
      </div>
      {candidatures === null && <p className="muted">{t("common.loading")}</p>}
      {candidatures !== null && candidatures.length === 0 && (
        <div className="pf-empty">
          <div className="pf-empty-icon">📝</div>
          <h3>Aucune candidature pour le moment</h3>
          <p>Explorez les offres et postulez a celles qui vous correspondent.</p>
          <Link to="/offres" className="pf-btn pf-btn-primary">Explorer les offres</Link>
        </div>
      )}
      {dernieres.length > 0 && (
        <div className="cand-list">
          {dernieres.map((c: any) => (
            <div key={c.id} className="cand-item">
              <div className="rec-avatar" style={{ background: "linear-gradient(135deg, var(--fusion-cyan), var(--fusion-violet))" }}>
                {(c.offre?.titre ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="cand-item-body">
                <div className="cand-item-title">{c.offre?.titre ?? "Offre"}</div>
                <div className="cand-item-meta">
                  {c.offre?.organisme?.nom ?? "-"} - {ilYA(c.dateEnvoi)}
                </div>
              </div>
              <span className={badgeClass(c.statut)}>{STATUT_LABEL[c.statut] ?? c.statut}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}