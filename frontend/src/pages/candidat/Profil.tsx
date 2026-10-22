import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../../api";
import { useI18n } from "../../i18n";

interface Filiere { id: number; code: string; intitule: string }
interface ProfilData {
  profil: {
    niveauEtudes: string | null;
    filiereId: number | null;
    etablissement: string | null;
    diplomes: string[];
    competences: string[];
    experience: string | null;
  } | null;
  cvNom: string | null;
}

export default function CandidatProfil() {
  const { t } = useI18n();
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [donnees, setDonnees] = useState<ProfilData | null>(null);
  const [niveauEtudes, setNiveauEtudes] = useState("");
  const [filiereId, setFiliereId] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [diplomes, setDiplomes] = useState("");
  const [competences, setCompetences] = useState("");
  const [experience, setExperience] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const fichier = useRef<HTMLInputElement>(null);

  const charger = () => {
    api<ProfilData>("/profils/moi")
      .then((d) => {
        setDonnees(d);
        const p = d.profil;
        setNiveauEtudes(p?.niveauEtudes ?? "");
        setFiliereId(p?.filiereId ? String(p.filiereId) : "");
        setEtablissement(p?.etablissement ?? "");
        setDiplomes((p?.diplomes ?? []).join(", "));
        setCompetences((p?.competences ?? []).join(", "));
        setExperience(p?.experience ?? "");
      })
      .catch((e) => setErreur(e.message));
  };

  useEffect(() => {
    charger();
    api<Filiere[]>("/filieres").then(setFilieres).catch(() => {});
  }, []);

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setErreur("");
    try {
      await api("/profils/moi", {
        method: "PUT",
        body: {
          niveauEtudes: niveauEtudes || undefined,
          filiereId: filiereId ? Number(filiereId) : null,
          etablissement: etablissement || undefined,
          diplomes: diplomes.split(",").map((s) => s.trim()).filter(Boolean),
          competences: competences.split(",").map((s) => s.trim()).filter(Boolean),
          experience: experience || undefined,
        },
      });
      setMessage(t("profil.saved"));
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    }
  };

  const envoyerCv = async () => {
    const f = fichier.current?.files?.[0];
    if (!f) return;
    setErreur("");
    const lire = new FileReader();
    lire.onload = async () => {
      try {
        await api("/profils/moi/cv", { method: "POST", body: { nom: f.name, contenu: lire.result as string } });
        setMessage(t("profil.saved"));
        charger();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur");
      }
    };
    lire.readAsDataURL(f);
  };

  return (
    <section>
      <h2>{t("nav.profile")}</h2>
      <form className="card" onSubmit={enregistrer} style={{ display: "grid", gap: ".4rem", maxWidth: 640 }}>
        <label>{t("profil.level")}</label>
        <input value={niveauEtudes} onChange={(e) => setNiveauEtudes(e.target.value)} placeholder="Licence, Master, Doctorat..." />

        <label>{t("profil.field")}</label>
        <select value={filiereId} onChange={(e) => setFiliereId(e.target.value)}>
          <option value="">â€”</option>
          {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} - {f.intitule}</option>)}
        </select>

        <label>{t("profil.institution")}</label>
        <input value={etablissement} onChange={(e) => setEtablissement(e.target.value)} />

        <label>{t("profil.diplomas")}</label>
        <input value={diplomes} onChange={(e) => setDiplomes(e.target.value)} />

        <label>{t("profil.skills")}</label>
        <input value={competences} onChange={(e) => setCompetences(e.target.value)} />

        <label>{t("profil.experience")}</label>
        <textarea rows={3} value={experience} onChange={(e) => setExperience(e.target.value)} />

        {message && <p className="success">{message}</p>}
        {erreur && <p className="error">{erreur}</p>}
        <div><button type="submit">{t("common.save")}</button></div>
      </form>

      <div className="card" style={{ marginTop: "1rem", maxWidth: 640 }}>
        <h3>{t("profil.cv")}</h3>
        <p className="muted small">{donnees?.cvNom ?? "â€”"}</p>
        <div className="actions-bar">
          <input ref={fichier} type="file" accept="application/pdf" style={{ maxWidth: 320 }} />
          <button type="button" className="secondary" onClick={envoyerCv}>{t("profil.uploadCv")}</button>
          {donnees?.cvNom && (
            <a className="link-button" href="/api/profils/moi/cv" target="_blank" rel="noreferrer">{t("profil.viewCv")}</a>
          )}
        </div>
        <p className="muted small" style={{ marginTop: ".5rem" }}>Format PDF uniquement.</p>
      </div>
    </section>
  );
}