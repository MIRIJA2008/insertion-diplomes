import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api";
import { useI18n } from "../../i18n";

interface Organisme {
  nom: string;
  type: string;
  ville: string | null;
  description: string | null;
  verifie: boolean;
}

export default function RecruteurOrganisme() {
  const { t } = useI18n();
  const [nom, setNom] = useState("");
  const [type, setType] = useState("ENTREPRISE_PRIVEE");
  const [ville, setVille] = useState("");
  const [description, setDescription] = useState("");
  const [verifie, setVerifie] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api<Organisme | null>("/recruteurs/moi/organisme")
      .then((o) => {
        if (o) {
          setNom(o.nom);
          setType(o.type);
          setVille(o.ville ?? "");
          setDescription(o.description ?? "");
          setVerifie(o.verifie);
        }
      })
      .catch(() => {});
  }, []);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setErreur("");
    try {
      await api("/recruteurs/moi/organisme", {
        method: "PUT",
        body: { nom, type, ville: ville || undefined, description: description || undefined },
      });
      setMessage(t("profil.saved"));
    } catch (e2) {
      setErreur(e2 instanceof Error ? e2.message : "Erreur");
    }
  };

  return (
    <section style={{ maxWidth: 560 }}>
      <h2>{t("recr.orgInfos")}</h2>
      {verifie && <p className="success">{t("recr.verified")} \u2705</p>}
      <form className="card" onSubmit={soumettre} style={{ display: "grid", gap: ".4rem" }}>
        <label>{t("auth.orgName")}</label>
        <input required value={nom} onChange={(e) => setNom(e.target.value)} />
        <label>{t("auth.orgType")}</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="MINISTERE">Ministere</option>
          <option value="ADMINISTRATION">Administration publique</option>
          <option value="ENTREPRISE_PRIVEE">Entreprise privee</option>
          <option value="ONG">ONG / association</option>
          <option value="AUTRE">Autre</option>
        </select>
        <label>{t("auth.orgCity")}</label>
        <input value={ville} onChange={(e) => setVille(e.target.value)} />
        <label>{t("auth.orgDescription")}</label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        {message && <p className="success">{message}</p>}
        {erreur && <p className="error">{erreur}</p>}
        <div><button type="submit">{t("common.save")}</button></div>
      </form>
    </section>
  );
}