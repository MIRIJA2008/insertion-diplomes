import { Link } from "react-router-dom";
import type { Offre } from "../api";
import { useI18n } from "../i18n";
import StatutBadge from "./StatutBadge";

export default function OffreCard({ offre }: { offre: Offre }) {
  const { t } = useI18n();
  return (
    <div className="card hoverable offre-card">
      <div className="offre-meta">
        <StatutBadge statut={offre.statut} />
        <span className="chip">{offre.typeContrat ?? "-"}</span>
        <span>{offre.lieu}</span>
      </div>
      <h3>{offre.titre}</h3>
      <p className="muted small">
        {offre.organisme?.nom} {offre.organisme?.verifie ? "(verifie)" : ""}
      </p>
      {offre.filiere && <p className="small muted">{offre.filiere.code} - {offre.filiere.intitule}</p>}
      <p className="small muted">
        {t("offer.deadline")} : {new Date(offre.dateLimite).toLocaleDateString("fr-FR")} \u00B7 {offre.nbCandidatures} {t("offer.applications")}
      </p>
      <Link className="link-button" to={`/offres/${offre.id}`}>{t("common.details")}</Link>
    </div>
  );
}