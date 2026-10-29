import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Offre } from "../api";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";
import PublicNav from "../components/PublicNav";
import PageHeader from "../components/PageHeader";

export default function OffreDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const [offre, setOffre] = useState<Offre | null>(null);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [lettre, setLettre] = useState("");
  const [favori, setFavori] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    api<Offre>(`/offres/${id}`).then(setOffre).catch((e) => setErreur(e.message));
  }, [id]);

  if (erreur) {
    return (
      <div className="pf-page">
        <PublicNav />
        <div className="pf-container">
          <div className="pf-alert pf-alert-error">{erreur}</div>
          <Link to="/offres" className="pf-btn" style={{ marginTop: "1rem" }}>Retour aux offres</Link>
        </div>
      </div>
    );
  }
  if (!offre) {
    return (
      <div className="pf-page">
        <PublicNav />
        <div className="pf-container"><div className="pf-skeleton" style={{ height: 400 }} /></div>
      </div>
    );
  }

  const postuler = async () => {
    setErreur(""); setMessage(""); setEnvoi(true);
    try {
      await api(`/offres/${offre.id}/postuler`, { method: "POST", body: { lettre: lettre || undefined } });
      setMessage(t("cand.applySuccess"));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnvoi(false);
    }
  };

  const basculerFavori = async () => {
    try {
      const r = await api<{ favori: boolean }>(`/offres/${offre.id}/favori`, { method: "PUT" });
      setFavori(r.favori);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    }
  };

  const cloturee = offre.statut === "CLOTUREE";

  return (
    <div className="pf-page">
      <PublicNav />
      <div className="pf-container">
        <PageHeader
          title="Detail de l'offre"
          subtitle={`Publiee par ${offre.organisme.nom}`}
          backTo="/offres"
          backLabel="Toutes les offres"
        />

        <div className="pf-detail">
          <div className="pf-detail-head">
            <div className="pf-offre-meta">
              {offre.typeContrat && <span className="pf-chip pf-chip-violet">{offre.typeContrat}</span>}
              {offre.filiere && <span className="pf-chip pf-chip-cyan">{offre.filiere.code}</span>}
              <span className="pf-chip">{cloturee ? "Cloturee" : "Ouverte"}</span>
            </div>
            <h1>{offre.titre}</h1>
            <div className="pf-detail-org">
              <div className="pf-detail-org-mark">{offre.organisme.nom.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="pf-detail-org-name">{offre.organisme.nom}{offre.organisme.verifie ? " ✓" : ""}</div>
                <div className="pf-detail-org-city">{offre.organisme.ville ?? "Localisation non precisee"}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", color: "var(--texte-muet)", fontSize: ".9rem" }}>
              <span><strong style={{ color: "var(--texte)" }}>Lieu :</strong> {offre.lieu}</span>
              <span><strong style={{ color: "var(--texte)" }}>{t("offer.deadline")} :</strong> {new Date(offre.dateLimite).toLocaleDateString("fr-FR")}</span>
              <span><strong style={{ color: "var(--texte)" }}>{t("offer.applications")} :</strong> {offre.nbCandidatures}</span>
            </div>
          </div>

          <div className="pf-detail-body">
            <h2>Description</h2>
            <p style={{ whiteSpace: "pre-line" }}>{offre.description}</p>

            {offre.niveauRequis && (<><h2>{t("offer.level")}</h2><p>{offre.niveauRequis}</p></>)}
            {offre.profilRecherche && (<><h2>{t("offer.profile")}</h2><p>{offre.profilRecherche}</p></>)}
            {offre.competencesRecherchees?.length > 0 && (
              <>
                <h2>{t("offer.skills")}</h2>
                <div className="pf-skill-list">
                  {offre.competencesRecherchees.map((c) => <span key={c} className="pf-chip pf-chip-cyan">{c}</span>)}
                </div>
              </>
            )}

            {!user && (
              <div className="pf-alert pf-alert-warn" style={{ marginTop: "1.75rem" }}>
                Connectez-vous pour postuler ou enregistrer cette offre en favori.
              </div>
            )}

            {user && (
              <div className="pf-actions-bar">
                {(user.role === "CANDIDAT" || user.role === "ADMIN") && !cloturee && (
                  <>
                    <textarea
                      className="pf-textarea"
                      placeholder={t("cand.coverLetter")}
                      value={lettre}
                      onChange={(e) => setLettre(e.target.value)}
                    />
                    <button className="pf-btn pf-btn-primary" onClick={postuler} disabled={envoi}>
                      {envoi ? "Envoi..." : t("offer.apply")}
                    </button>
                  </>
                )}
                {cloturee && <div className="pf-alert pf-alert-warn" style={{ width: "100%" }}>{t("offer.closedWarning")}</div>}
                <button className="pf-btn pf-btn-ghost" onClick={basculerFavori}>
                  {favori ? "★ Retirer des favoris" : "☆ Ajouter aux favoris"}
                </button>
              </div>
            )}

            {message && <div className="pf-alert pf-alert-success">{message}</div>}
            {erreur && <div className="pf-alert pf-alert-error">{erreur}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}