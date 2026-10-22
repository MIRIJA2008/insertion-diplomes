import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Candidature, type Offre } from "../../api";
import { useI18n } from "../../i18n";

interface Organisme { id: number; nom: string; verifie: boolean; _count: { offres: number } }

export default function RecruteurAccueil() {
  const { t } = useI18n();
  const [organisme, setOrganisme] = useState<Organisme | null>(null);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);

  useEffect(() => {
    api<Organisme | null>("/recruteurs/moi/organisme").then(setOrganisme).catch(() => {});
    api<Offre[]>("/offres/recruteur/mes-offres").then(setOffres).catch(() => {});
    api<Candidature[]>("/recruteur/candidatures").then(setCandidatures).catch(() => {});
  }, []);

  const ouvertes = offres.filter((o) => o.statut !== "CLOTUREE").length;

  return (
    <section>
      <h2>{t("nav.recruiter")}</h2>
      {!organisme && <p className="warning">{t("recr.completeOrg")} <Link to="/recruteur/organisme">{t("nav.organization")}</Link></p>}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-title">{t("nav.organization")}</span>
          <strong className="stat-value">{organisme ? organisme.nom : "â€”"}</strong>
          {organisme?.verifie && <span className="stat-detail">{t("recr.verified")} \u2705</span>}
        </div>
        <div className="stat-card">
          <span className="stat-title">{t("nav.myOffers")}</span>
          <strong className="stat-value">{offres.length}</strong>
          <span className="stat-detail">{ouvertes} {t("statut.OUVERTE").toLowerCase()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">{t("nav.received")}</span>
          <strong className="stat-value">{candidatures.length}</strong>
        </div>
      </div>

      <div className="actions-bar">
        <Link className="link-button" to="/recruteur/offres">{t("recr.newOffer")}</Link>
        <Link className="link-button" to="/recruteur/candidatures">{t("nav.received")}</Link>
      </div>
    </section>
  );
}