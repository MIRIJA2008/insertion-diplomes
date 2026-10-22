import { useEffect, useState, type FormEvent } from "react";
import { api, type Offre } from "../../api";
import { useI18n } from "../../i18n";
import StatutBadge from "../../components/StatutBadge";

interface Filiere { id: number; code: string; intitule: string }

const VIDE = {
  titre: "", description: "", niveauRequis: "", filiereId: "", competences: "",
  profilRecherche: "", lieu: "", typeContrat: "CDI", dateLimite: "",
};

export default function RecruteurMesOffres() {
  const { t } = useI18n();
  const [offres, setOffres] = useState<Offre[] | null>(null);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [form, setForm] = useState(VIDE);
  const [edition, setEdition] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const charger = () => {
    api<Offre[]>("/offres/recruteur/mes-offres").then(setOffres).catch(() => setOffres([]));
  };
  useEffect(() => {
    charger();
    api<Filiere[]>("/filieres").then(setFilieres).catch(() => {});
  }, []);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const ouvrirEdition = (o: Offre) => {
    setEdition(o.id);
    setForm({
      titre: o.titre, description: o.description, niveauRequis: o.niveauRequis ?? "",
      filiereId: o.filiereId ? String(o.filiereId) : "", competences: (o.competencesRecherchees ?? []).join(", "),
      profilRecherche: o.profilRecherche ?? "", lieu: o.lieu, typeContrat: o.typeContrat ?? "CDI",
      dateLimite: o.dateLimite.slice(0, 10),
    });
    setVisible(true);
  };

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setErreur("");
    const corps = {
      titre: form.titre, description: form.description,
      niveauRequis: form.niveauRequis || undefined,
      filiereId: form.filiereId ? Number(form.filiereId) : undefined,
      competencesRecherchees: form.competences.split(",").map((s) => s.trim()).filter(Boolean),
      profilRecherche: form.profilRecherche || undefined,
      lieu: form.lieu, typeContrat: form.typeContrat as any,
      dateLimite: new Date(form.dateLimite).toISOString(),
    };
    try {
      if (edition) await api(`/offres/${edition}`, { method: "PUT", body: corps });
      else await api("/offres", { method: "POST", body: corps });
      setMessage("OK");
      setVisible(false);
      setEdition(null);
      setForm(VIDE);
      charger();
    } catch (e2) {
      setErreur(e2 instanceof Error ? e2.message : "Erreur");
    }
  };

  const supprimer = async (id: number) => {
    if (!confirm("Supprimer cette offre ?")) return;
    await api(`/offres/${id}`, { method: "DELETE" }).catch(() => {});
    charger();
  };

  return (
    <section>
      <div className="actions-bar" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>{t("recr.myOffers")}</h2>
        <button onClick={() => { setVisible(!visible); setEdition(null); setForm(VIDE); }}>
          {visible ? t("common.cancel") : t("recr.newOffer")}
        </button>
      </div>

      {visible && (
        <form className="card" onSubmit={soumettre} style={{ display: "grid", gap: ".4rem", margin: "1rem 0" }}>
          <h3>{edition ? t("recr.editOffer") : t("recr.newOffer")}</h3>
          <label>{t("recr.offerTitle")}</label>
          <input required value={form.titre} onChange={set("titre")} />
          <label>{t("recr.description")}</label>
          <textarea rows={4} required value={form.description} onChange={set("description")} />
          <label>{t("recr.requiredLevel")}</label>
          <input value={form.niveauRequis} onChange={set("niveauRequis")} />
          <label>{t("offer.filterField")}</label>
          <select value={form.filiereId} onChange={set("filiereId")}>
            <option value="">â€”</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} - {f.intitule}</option>)}
          </select>
          <label>{t("recr.searchedSkills")}</label>
          <input value={form.competences} onChange={set("competences")} />
          <label>{t("offer.profile")}</label>
          <input value={form.profilRecherche} onChange={set("profilRecherche")} />
          <label>{t("recr.workLocation")}</label>
          <input required value={form.lieu} onChange={set("lieu")} />
          <label>{t("offer.contract")}</label>
          <select value={form.typeContrat} onChange={set("typeContrat")}>
            {["CDI", "CDD", "STAGE", "INDEPENDANT", "OCCASIONNEL"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label>{t("recr.deadlineLabel")}</label>
          <input type="date" required value={form.dateLimite} onChange={set("dateLimite")} />
          {erreur && <p className="error">{erreur}</p>}
          {message && <p className="success">{message}</p>}
          <div><button type="submit">{t("recr.publish")}</button></div>
        </form>
      )}

      {offres === null && <p className="muted">{t("common.loading")}</p>}
      {offres !== null && offres.length === 0 && <p className="empty">{t("common.none")}</p>}
      {offres !== null && offres.length > 0 && (
        <div className="table-wrap" style={{ marginTop: "1rem" }}>
          <table>
            <thead>
              <tr>
                <th>{t("recr.offerTitle")}</th>
                <th>{t("offer.deadline")}</th>
                <th>{t("common.status")}</th>
                <th>{t("nav.received")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {offres.map((o) => (
                <tr key={o.id}>
                  <td>{o.titre}</td>
                  <td>{new Date(o.dateLimite).toLocaleDateString("fr-FR")}</td>
                  <td><StatutBadge statut={o.statut} /></td>
                  <td>{o.nbCandidatures}</td>
                  <td className="actions">
                    <button className="tab" type="button" onClick={() => ouvrirEdition(o)}>{t("common.edit")}</button>
                    <button className="danger" type="button" onClick={() => supprimer(o.id)}>{t("common.delete")}</button>
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