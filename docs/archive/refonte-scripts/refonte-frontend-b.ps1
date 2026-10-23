# =============================================================
# REFONTE - PARTIE FRONTEND B : candidat, recruteur, communautes,
# messagerie + verification build
# =============================================================
$racine = "F:\insertion-diplomes"
$utf8 = [System.Text.UTF8Encoding]::new($false)

function Ecrire([string]$rel, [string]$contenu) {
  $chemin = Join-Path $racine $rel
  $dossier = Split-Path $chemin -Parent
  if (-not (Test-Path $dossier)) { New-Item -ItemType Directory -Force -Path $dossier | Out-Null }
  [System.IO.File]::WriteAllText($chemin, $contenu, $utf8)
  Write-Host "OK  $rel"
}

# -------------------------------------------------------------
# 11. ESPACE CANDIDAT
# -------------------------------------------------------------
Ecrire "frontend\src\pages\candidat\Accueil.tsx" @'
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
        <p className="empty">{t("common.none")} — <Link to="/offres">{t("nav.offers")}</Link></p>
      ) : (
        <div className="grille">
          {recommandees.slice(0, 6).map((o) => <OffreCard key={o.id} offre={o} />)}
        </div>
      )}
    </section>
  );
}
'@

Ecrire "frontend\src\pages\candidat\Profil.tsx" @'
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
          <option value="">—</option>
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
        <p className="muted small">{donnees?.cvNom ?? "—"}</p>
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
'@

Ecrire "frontend\src\pages\candidat\Suivi.tsx" @'
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
        <p className="empty">{t("common.none")} — <Link to="/offres">{t("nav.offers")}</Link></p>
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
'@

Ecrire "frontend\src\pages\candidat\Favoris.tsx" @'
import { useEffect, useState } from "react";
import { api, type Offre } from "../../api";
import { useI18n } from "../../i18n";
import OffreCard from "../../components/OffreCard";

interface Favori { id: number; offre: Offre }

export default function CandidatFavoris() {
  const { t } = useI18n();
  const [liste, setListe] = useState<Favori[] | null>(null);

  useEffect(() => {
    api<Favori[]>("/mes-favoris").then(setListe).catch(() => setListe([]));
  }, []);

  return (
    <section>
      <h2>{t("cand.myFavorites")}</h2>
      {liste === null && <p className="muted">{t("common.loading")}</p>}
      {liste !== null && liste.length === 0 && <p className="empty">{t("common.none")}</p>}
      {liste !== null && liste.length > 0 && (
        <div className="grille">
          {liste.map((f) => <OffreCard key={f.id} offre={f.offre} />)}
        </div>
      )}
    </section>
  );
}
'@

Ecrire "frontend\src\pages\candidat\Parametres.tsx" @'
import { useI18n } from "../../i18n";
import { useTheme, ACCENTS } from "../../theme";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageSelector from "../../components/LanguageSelector";

export default function CandidatParametres() {
  const { t } = useI18n();
  const { accent, definirAccent } = useTheme();

  return (
    <section style={{ maxWidth: 560 }}>
      <h2>{t("nav.settings")}</h2>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>{t("set.appearance")}</h3>
        <p className="muted small">{t("common.theme")}</p>
        <ThemeToggle />
        <p className="muted small" style={{ marginTop: "1rem" }}>{t("common.language")}</p>
        <LanguageSelector />
      </div>

      <div className="card">
        <h3>{t("set.accent")}</h3>
        <div className="accents">
          {Object.entries(ACCENTS).map(([nom, code]) => (
            <button
              key={nom}
              type="button"
              className={`accent-dot ${accent === nom ? "actif" : ""}`}
              style={{ background: code }}
              title={nom}
              onClick={() => definirAccent(nom)}
            />
          ))}
        </div>
        <p className="muted small" style={{ marginTop: ".75rem" }}>{accent}</p>
      </div>
    </section>
  );
}
'@

# -------------------------------------------------------------
# 12. ESPACE RECRUTEUR
# -------------------------------------------------------------
Ecrire "frontend\src\pages\recruteur\Accueil.tsx" @'
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
          <strong className="stat-value">{organisme ? organisme.nom : "—"}</strong>
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
'@

Ecrire "frontend\src\pages\recruteur\MesOffres.tsx" @'
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
            <option value="">—</option>
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
'@

Ecrire "frontend\src\pages\recruteur\Recu.tsx" @'
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
                  <td>{c.candidat?.profilCandidat?.filiere?.code ?? "—"}</td>
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
'@

Ecrire "frontend\src\pages\recruteur\Organisme.tsx" @'
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
'@

# -------------------------------------------------------------
# 13. COMMUNAUTES
# -------------------------------------------------------------
Ecrire "frontend\src\pages\Communautes.tsx" @'
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";

interface Membre { utilisateur: { id: number; nom: string } }
interface MessageCommu { id: number; contenu: string; envoyeLe: string; auteur: { nom: string } }
interface Communaute {
  id: number;
  nom: string;
  description: string | null;
  domaine: string | null;
  filiere?: { code: string } | null;
  membres: Membre[];
  messages: MessageCommu[];
  _count: { membres: number };
}

export default function Communautes() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [liste, setListe] = useState<Communaute[]>([]);
  const [selection, setSelection] = useState<Communaute | null>(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [domaine, setDomaine] = useState("");
  const [message, setMessage] = useState("");

  const charger = () => {
    api<Communaute[]>("/communautes").then((l) => {
      setListe(l);
      if (selection) {
        const maj = l.find((c) => c.id === selection.id);
        if (maj) {
          api<Communaute>(`/communautes/${maj.id}`).then(setSelection).catch(() => setSelection(maj));
        }
      }
    }).catch(() => {});
  };
  useEffect(charger, []);

  const creer = async (e: FormEvent) => {
    e.preventDefault();
    await api("/communautes", { method: "POST", body: { nom, description: description || undefined, domaine: domaine || undefined } }).catch(() => {});
    setNom(""); setDescription(""); setDomaine("");
    charger();
  };

  const rejoindre = async (id: number) => {
    await api(`/communautes/${id}/rejoindre`, { method: "POST" }).catch(() => {});
    charger();
  };

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    if (!selection || !message.trim()) return;
    await api(`/communautes/${selection.id}/messages`, { method: "POST", body: { contenu: message } }).catch(() => {});
    setMessage("");
    charger();
  };

  return (
    <section>
      <h2>{t("comm.title")}</h2>
      <div className="conv-layout">
        <div>
          <form className="card" onSubmit={creer} style={{ display: "grid", gap: ".3rem", marginBottom: "1rem" }}>
            <strong>{t("comm.new")}</strong>
            <input required placeholder={t("comm.name")} value={nom} onChange={(e) => setNom(e.target.value)} />
            <input placeholder={t("comm.domain")} value={domaine} onChange={(e) => setDomaine(e.target.value)} />
            <input placeholder={t("comm.description")} value={description} onChange={(e) => setDescription(e.target.value)} />
            <div><button type="submit">{t("comm.join")}</button></div>
          </form>
          <div className="conv-liste">
            {liste.map((c) => (
              <div key={c.id} className={`conv-item ${selection?.id === c.id ? "actif" : ""}`} onClick={() => setSelection(c)}>
                <strong>{c.nom}</strong>
                <div className="muted small">{c._count.membres} {t("comm.members")} {c.filiere ? `\u00B7 ${c.filiere.code}` : ""}</div>
              </div>
            ))}
            {liste.length === 0 && <p className="muted small">{t("common.none")}</p>}
          </div>
        </div>

        <div className="card msg-zone">
          {!selection && <p className="empty">{t("common.none")}</p>}
          {selection && (
            <>
              <div className="actions-bar" style={{ justifyContent: "space-between" }}>
                <div>
                  <strong>{selection.nom}</strong>
                  {selection.description && <p className="muted small" style={{ margin: 0 }}>{selection.description}</p>}
                </div>
                <button className="secondary" onClick={() => rejoindre(selection.id)}>{t("comm.join")}</button>
              </div>
              <div className="msg-liste">
                {selection.messages.map((m) => (
                  <div key={m.id} className="msg-bulle">
                    <span className="qui">{m.auteur.nom} \u00B7 {new Date(m.envoyeLe).toLocaleString("fr-FR")}</span>
                    {m.contenu}
                  </div>
                ))}
                {selection.messages.length === 0 && <p className="muted small">{t("common.none")}</p>}
              </div>
              {user && (
                <form className="msg-form" onSubmit={envoyer}>
                  <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("comm.write")} />
                  <button type="submit">{t("common.send")}</button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
'@

# -------------------------------------------------------------
# 14. MESSAGERIE
# -------------------------------------------------------------
Ecrire "frontend\src\pages\Messagerie.tsx" @'
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";

interface Conversation {
  id: number;
  membres: { utilisateur: { id: number; nom: string } }[];
  messages: { contenu: string; envoyeLe: string }[];
}
interface Message { id: number; contenu: string; envoyeLe: string; auteur: { id: number; nom: string } }

export default function Messagerie() {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selection, setSelection] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [brouillon, setBrouillon] = useState("");
  const [destinataire, setDestinataire] = useState("");

  const charger = () => {
    api<Conversation[]>("/messagerie/conversations").then(setConversations).catch(() => {});
  };
  useEffect(charger, []);

  const ouvrir = async (c: Conversation) => {
    setSelection(c);
    api<Message[]>(`/messagerie/conversations/${c.id}/messages`).then(setMessages).catch(() => setMessages([]));
  };

  const nouvelle = async (e: FormEvent) => {
    e.preventDefault();
    const id = Number(destinataire);
    if (!id) return;
    const c = await api<Conversation>("/messagerie/conversations", { method: "POST", body: { utilisateurId: id } }).catch(() => null);
    setDestinataire("");
    charger();
    if (c) ouvrir(c);
  };

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    if (!selection || !brouillon.trim()) return;
    const m = await api<Message>(`/messagerie/conversations/${selection.id}/messages`, { method: "POST", body: { contenu: brouillon } }).catch(() => null);
    setBrouillon("");
    if (m) setMessages((ms) => [...ms, m]);
    charger();
  };

  return (
    <section>
      <h2>{t("msg.title")}</h2>
      <div className="conv-layout">
        <div>
          <form className="card" onSubmit={nouvelle} style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
            <input type="number" min={1} placeholder={t("msg.with")} value={destinataire} onChange={(e) => setDestinataire(e.target.value)} />
            <button type="submit">{t("msg.new")}</button>
          </form>
          <div className="conv-liste">
            {conversations.map((c) => {
              const autre = c.membres.map((m) => m.utilisateur.nom).join(", ");
              return (
                <div key={c.id} className={`conv-item ${selection?.id === c.id ? "actif" : ""}`} onClick={() => ouvrir(c)}>
                  <strong>{autre}</strong>
                  {c.messages[0] && <div className="muted small">{c.messages[0].contenu.slice(0, 40)}...</div>}
                </div>
              );
            })}
            {conversations.length === 0 && <p className="muted small">{t("common.none")}</p>}
          </div>
        </div>

        <div className="card msg-zone">
          {!selection && <p className="empty">{t("msg.empty")}</p>}
          {selection && (
            <>
              <div className="msg-liste">
                {messages.map((m) => (
                  <div key={m.id} className="msg-bulle">
                    <span className="qui">{m.auteur.nom} \u00B7 {new Date(m.envoyeLe).toLocaleString("fr-FR")}</span>
                    {m.contenu}
                  </div>
                ))}
                {messages.length === 0 && <p className="muted small">{t("common.none")}</p>}
              </div>
              <form className="msg-form" onSubmit={envoyer}>
                <input value={brouillon} onChange={(e) => setBrouillon(e.target.value)} placeholder={t("msg.write")} />
                <button type="submit">{t("common.send")}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
'@

# -------------------------------------------------------------
# 15. Verification finale
# -------------------------------------------------------------
Write-Host "`n== Verification build frontend ==" -ForegroundColor Cyan
Set-Location "$racine\frontend"
npm run build

Write-Host "`nREFONTE FRONTEND TERMINEE." -ForegroundColor Green
Write-Host "Base : docker compose up -d  |  Backend : npm run dev  |  Frontend : npm run dev"
