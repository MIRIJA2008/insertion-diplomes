import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Candidature } from "../../api";
import { useI18n } from "../../i18n";

export default function CandidatSuivi() {
  const { t } = useI18n();
  const [liste, setListe] = useState<Candidature[] | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api<Candidature[]>("/mes-candidatures").then(setListe).catch((e) => setErreur(e.message));
  }, []);

  return (
    <section>
      <h2>{t("cand.myApplications")}</h2>
      {erreur && <p className="error">{erreur}</p>}
      {liste === null && <p className="muted">{t("common.loading")}</p>}
      {liste !== null && liste.length === 0 && (
        <p className="empty">{t("common.none")} â€” <Link to="/offres">{t("nav.offers")}</Link></p>
      )}
      {liste !== null && liste.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Offre</th>
                <th>{t("offer.organization")}</th>
                <th>{t("cand.applicationDate")}</th>
                <th>{t("common.status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {liste.map((c) => (
                <tr key={c.id}>
                  <td>{c.offre.titre}</td>
                  <td>{c.offre.organisme?.nom}</td>
                  <td>{new Date(c.dateEnvoi).toLocaleDateString("fr-FR")}</td>
                  <td><span className={`statut statut-${c.statut === "REFUSEE" ? "CLOTUREE" : "OUVERTE"}`}>{t(`cand.status.${c.statut}`)}</span></td>
                  <td className="actions"><Link className="link-button" to={`/offres/${c.offre.id}`}>{t("common.view")}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}