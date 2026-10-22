import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Offre } from "../../api";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";
import OffreCard from "../../components/OffreCard";

interface ProfilComplet {
  utilisateur: { nom: string };
  profil: {
    niveauEtudes: string | null;
    etablissement: string | null;
    experience: string | null;
    competences: string[];
    diplomes: string[];
    filiereId: number | null;
  } | null;
}

export default function CandidatAccueil() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [profil, setProfil] = useState<ProfilComplet | null>(null);
  const [recommandees, setRecommandees] = useState<Offre[]>([]);

  useEffect(() => {
    api<ProfilComplet>("/profils/moi").then(setProfil).catch(() => {});
    api<Offre[]>("/offres/recommandees").then(setRecommandees).catch(() => {});
  }, []);

  const p = profil?.profil;
  const champs = p ? [p.niveauEtudes, p.etablissement, p.experience, p.filiereId, p.competences.length > 0, p.diplomes.length > 0] : [];
  const complet = Math.round((champs.filter(Boolean).length / champs.length) * 100);

  return (
    <section>
      <h2>{t("cand.welcome")}, {user?.nom}</h2>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-title">{t("cand.completion")}</span>
          <strong className="stat-value">{complet} %</strong>
          <span className="stat-detail">
            <span className="bar-track" style={{ display: "block", marginTop: ".3rem" }}>
              <span className="bar-fill" style={{ display: "block", width: `${complet}%` }} />
            </span>
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-title">{t("offer.recommendations")}</span>
          <strong className="stat-value">{recommandees.length}</strong>
        </div>
      </div>

      {complet < 100 && (
        <p className="warning">
          <Link to="/candidat/profil">{t("nav.profile")}</Link>
        </p>
      )}

      <h3>{t("offer.recommendations")}</h3>
      {recommandees.length === 0 ? (
        <p className="empty">{t("common.none")} â€” <Link to="/offres">{t("nav.offers")}</Link></p>
      ) : (
        <div className="grille">
          {recommandees.slice(0, 6).map((o) => <OffreCard key={o.id} offre={o} />)}
        </div>
      )}
    </section>
  );
}