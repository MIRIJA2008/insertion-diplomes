import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Offre } from "../api";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";
import StatutBadge from "../components/StatutBadge";

export default function OffreDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const [offre, setOffre] = useState<Offre | null>(null);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [lettre, setLettre] = useState("");
  const [favori, setFavori] = useState(false);

  const charger = () => {
    api<Offre>(`/offres/${id}`).then(setOffre).catch((e) => setErreur(e.message));
  };
  useEffect(charger, [id]);

  if (erreur) return <p className="error">{erreur}</p>;
  if (!offre) return <p className="muted">{t("common.loading")}</p>;

  const postuler = async () => {
    setErreur("");
    setMessage("");
    try {
      await api(`/offres/${offre.id}/postuler`, { method: "POST", body: { lettre: lettre || undefined } });
      setMessage(t("cand.applySuccess"));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    }
  };

  const basculerFavori = async () => {
    const r = await api<{ favori: boolean }>(`/offres/${offre.id}/favori`, { method: "PUT" });
    setFavori(r.favori);
  };

  return (
    <section>
      <Link to="/offres" className="muted small">&larr; {t("common.back")}</Link>
      <div className="card" style={{ marginTop: ".75rem" }}>
        <div className="offre-meta">
          <StatutBadge statut={offre.statut} />
          <span className="chip">{offre.typeContrat ?? "-"}</span>
          <span>{offre.lieu}</span>
        </div>
        <h2>{offre.titre}</h2>
        <p className="muted">
          {offre.organisme.nom} {offre.organisme.verifie ? "(verifie)" : ""} \u00B7 {offre.organisme.ville ?? ""}
        </p>
        <p className="muted">{t("offer.deadline")} : <strong>{new Date(offre.dateLimite).toLocaleDateString("fr-FR")}</strong> \u00B7 {offre.nbCandidatures} {t("offer.applications")}</p>
        <hr style={{ border: 0, borderTop: "1px solid var(--bord)" }} />
        <p style={{ whiteSpace: "pre-line" }}>{offre.description}</p>
        {offre.niveauRequis && <p><strong>{t("offer.level")} :</strong> {offre.niveauRequis}</p>}
        {offre.filiere && <p><strong>{t("offer.filterField")} :</strong> {offre.filiere.code} - {offre.filiere.intitule}</p>}
        {offre.competencesRecherchees?.length > 0 && (
          <p><strong>{t("offer.skills")} :</strong> {offre.competencesRecherchees.join(", ")}</p>
        )}
        {offre.profilRecherche && <p><strong>{t("offer.profile")} :</strong> {offre.profilRecherche}</p>}

        {user && (
          <div className="actions-bar" style={{ marginTop: "1rem" }}>
            {(user.role === "CANDIDAT" || user.role === "ADMIN") &&
              (offre.statut === "CLOTUREE" ? (
                <p className="warning">{t("offer.closedWarning")}</p>
              ) : (
                <>
                  <textarea rows={3} style={{ maxWidth: 420 }} placeholder={t("cand.coverLetter")} value={lettre} onChange={(e) => setLettre(e.target.value)} />
                  <button onClick={postuler}>{t("offer.apply")}</button>
                </>
              ))}
            <button className="secondary" onClick={basculerFavori}>
              {favori ? "[x]" : "[ ]"} {t("offer.favorite")}
            </button>
          </div>
        )}
        {message && <p className="success" style={{ marginTop: ".75rem" }}>{message}</p>}
        {erreur && <p className="error" style={{ marginTop: ".75rem" }}>{erreur}</p>}
      </div>
    </section>
  );
}