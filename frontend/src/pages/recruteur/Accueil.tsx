import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Candidature, type Offre } from "../../api";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";

interface MesOffres extends Array<Offre> {}

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

export default function RecruteurAccueil() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [offres, setOffres] = useState<MesOffres | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[] | null>(null);

  useEffect(() => {
    api<MesOffres>("/offres/recruteur/mes-offres").then(setOffres).catch(() => setOffres([]));
    api<Candidature[]>("/recruteur/candidatures").then(setCandidatures).catch(() => setCandidatures([]));
  }, []);

  const nbOffresActives = offres?.filter((o) => o.statut !== "CLOTUREE").length ?? 0;
  const nbCandidatures = candidatures?.length ?? 0;
  const nbEnAttente = candidatures?.filter((c) => c.statut === "ENVOYEE" || c.statut === "VUE").length ?? 0;
  const nbAcceptees = candidatures?.filter((c) => c.statut === "ACCEPTEE").length ?? 0;

  const dernieres = (candidatures ?? []).slice(0, 5);

  return (
    <div>
      <div className="rec-hero">
        <h1>Bonjour {user?.nom?.split(" ")[0] ?? ""}, bienvenue dans votre espace recruteur</h1>
        <p>Gerez vos offres, suivez les candidatures recues et developpez votre reseau de talents.</p>
        <div className="rec-hero-actions">
          <Link to="/recruteur/offres" className="pf-btn pf-btn-primary">Mes offres</Link>
          <Link to="/recruteur/candidatures" className="pf-btn">Candidatures recues</Link>
          <Link to="/recruteur/organisme" className="pf-btn pf-btn-ghost">Mon organisme</Link>
        </div>
      </div>

      <div className="rec-stats">
        <div className="rec-stat">
          <div className="rec-stat-label">Offres actives</div>
          <div className="rec-stat-value">{nbOffresActives}</div>
          <div className="rec-stat-hint">sur {offres?.length ?? 0} publiees</div>
        </div>
        <div className="rec-stat">
          <div className="rec-stat-label">Candidatures recues</div>
          <div className="rec-stat-value">{nbCandidatures}</div>
          <div className="rec-stat-hint">toutes offres confondues</div>
        </div>
        <div className="rec-stat">
          <div className="rec-stat-label">En attente</div>
          <div className="rec-stat-value">{nbEnAttente}</div>
          <div className="rec-stat-hint">a traiter</div>
        </div>
        <div className="rec-stat">
          <div className="rec-stat-label">Acceptees</div>
          <div className="rec-stat-value">{nbAcceptees}</div>
          <div className="rec-stat-hint">recrutements finalises</div>
        </div>
      </div>

      <div className="rec-section-title">
        <h2>Dernieres candidatures</h2>
        <Link to="/recruteur/candidatures">Tout voir &rarr;</Link>
      </div>

      {candidatures === null && <p className="muted">{t("common.loading")}</p>}
      {candidatures !== null && candidatures.length === 0 && (
        <div className="pf-empty">
          <div className="pf-empty-icon">📭</div>
          <h3>Aucune candidature pour le moment</h3>
          <p>Publiez une offre pour commencer a recevoir des candidatures.</p>
          <Link to="/recruteur/offres" className="pf-btn pf-btn-primary">Creer une offre</Link>
        </div>
      )}
      {dernieres.length > 0 && (
        <div className="rec-list">
          {dernieres.map((c) => (
            <Link key={c.id} to={`/recruteur/candidat/${c.candidat.id}`} className="rec-item">
              <div className="rec-avatar">{initiales(c.candidat.nom)}</div>
              <div className="rec-item-body">
                <div className="rec-item-title">{c.candidat.nom}</div>
                <div className="rec-item-meta">
                  {c.offre.titre} - statut {c.statut}
                </div>
              </div>
              <div className="rec-item-time">{ilYA(c.dateEnvoi)}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="rec-section-title">
        <h2>Mes offres recentes</h2>
        <Link to="/recruteur/offres">Gerer &rarr;</Link>
      </div>

      {offres === null && <p className="muted">{t("common.loading")}</p>}
      {offres !== null && offres.length === 0 && (
        <p className="empty">Aucune offre publiee pour le moment.</p>
      )}
      {offres !== null && offres.length > 0 && (
        <div className="rec-list">
          {offres.slice(0, 5).map((o) => (
            <div key={o.id} className="rec-item">
              <div className="rec-avatar">{o.titre.slice(0, 2).toUpperCase()}</div>
              <div className="rec-item-body">
                <div className="rec-item-title">{o.titre}</div>
                <div className="rec-item-meta">
                  {o.typeContrat ?? "-"} - {o.lieu} - {o.nbCandidatures} candidature{o.nbCandidatures > 1 ? "s" : ""}
                </div>
              </div>
              <div className="rec-item-time">
                {o.statut === "CLOTUREE" ? "Cloturee" : "Ouverte"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}