import { useEffect, useState } from "react";
import { api, type Candidature } from "../../api";
import { useI18n } from "../../i18n";

export default function RecruteurRecu() {
  const { t } = useI18n();
  const [liste, setListe] = useState<Candidature[] | null>(null);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    api<Candidature[]>("/recruteur/candidatures").then(setListe).catch((e) => setErreur(e.message));
  };
  useEffect(charger, []);

  const changerStatut = async (id: number, statut: string) => {
    await api(`/candidatures/${id}/statut`, { method: "PATCH", body: { statut } }).catch(() => {});
    charger();
  };

  return (
    <section>
      <h2>{t("recr.receivedApplications")}</h2>
      {erreur && <p className="error">{erreur}</p>}
      {liste === null && <p className="muted">{t("common.loading")}</p>}
      {liste !== null && liste.length === 0 && <p className="empty">{t("common.none")}</p>}
      {liste !== null && liste.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("recr.applicant")}</th>
                <th>Offre</th>
                <th>{t("profil.field")}</th>
                <th>{t("common.status")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.candidat?.nom}<br />
                    <span className="muted small">{c.candidat?.email}</span>
                  </td>
                  <td>{c.offre.titre}</td>
                  <td>{c.candidat?.profilCandidat?.filiere?.code ?? "â€”"}</td>
                  <td><span className={`statut statut-${c.statut === "REFUSEE" ? "CLOTUREE" : "OUVERTE"}`}>{t(`cand.status.${c.statut}`)}</span></td>
                  <td className="actions">
                    {c.statut === "ENVOYEE" && <button className="tab" type="button" onClick={() => changerStatut(c.id, "VUE")}>{t("recr.markVUE")}</button>}
                    {c.statut !== "ACCEPTEE" && <button className="tab" type="button" onClick={() => changerStatut(c.id, "ACCEPTEE")}>{t("recr.markACCEPTEE")}</button>}
                    {c.statut !== "REFUSEE" && <button className="danger" type="button" onClick={() => changerStatut(c.id, "REFUSEE")}>{t("recr.markREFUSEE")}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}