import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useI18n } from "../i18n";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";

export default function Register() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [role, setRole] = useState<"CANDIDAT" | "RECRUTEUR">("CANDIDAT");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [orgNom, setOrgNom] = useState("");
  const [orgType, setOrgType] = useState("ENTREPRISE_PRIVEE");
  const [orgVille, setOrgVille] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await api("/inscription", {
        method: "POST",
        body: {
          nom, email, motDePasse, role,
          ...(role === "RECRUTEUR"
            ? { organisme: { nom: orgNom, type: orgType, ville: orgVille || undefined, description: orgDescription || undefined } }
            : {}),
        },
      });
      navigate("/login");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Inscription impossible");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card login-card" style={{ maxWidth: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" className="muted small">&larr; {t("nav.home")}</Link>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
        <h1>{t("auth.registerTitle")}</h1>
        <p className="muted">{t("auth.registerSubtitle")}</p>

        <form onSubmit={soumettre} style={{ display: "flex", flexDirection: "column", gap: ".25rem" }}>
          <label>{t("auth.accountType")}</label>
          <div className="choice">
            <input type="radio" id="r-cand" checked={role === "CANDIDAT"} onChange={() => setRole("CANDIDAT")} />
            <label htmlFor="r-cand" style={{ margin: 0, fontWeight: 400 }}>{t("auth.candidate")}</label>
          </div>
          <div className="choice">
            <input type="radio" id="r-recr" checked={role === "RECRUTEUR"} onChange={() => setRole("RECRUTEUR")} />
            <label htmlFor="r-recr" style={{ margin: 0, fontWeight: 400 }}>{t("auth.recruiter")}</label>
          </div>

          <label htmlFor="nom">{t("auth.name")}</label>
          <input id="nom" required value={nom} onChange={(e) => setNom(e.target.value)} />

          <label htmlFor="email">{t("auth.email")}</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor="mdp">{t("auth.password")} (min. 8)</label>
          <input id="mdp" type="password" minLength={8} required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />

          {role === "RECRUTEUR" && (
            <>
              <label htmlFor="org-nom">{t("auth.orgName")}</label>
              <input id="org-nom" required value={orgNom} onChange={(e) => setOrgNom(e.target.value)} />
              <label htmlFor="org-type">{t("auth.orgType")}</label>
              <select id="org-type" value={orgType} onChange={(e) => setOrgType(e.target.value)}>
                <option value="MINISTERE">Ministere</option>
                <option value="ADMINISTRATION">Administration publique</option>
                <option value="ENTREPRISE_PRIVEE">Entreprise privee</option>
                <option value="ONG">ONG / association</option>
                <option value="AUTRE">Autre</option>
              </select>
              <label htmlFor="org-ville">{t("auth.orgCity")}</label>
              <input id="org-ville" value={orgVille} onChange={(e) => setOrgVille(e.target.value)} />
              <label htmlFor="org-desc">{t("auth.orgDescription")}</label>
              <textarea id="org-desc" rows={2} value={orgDescription} onChange={(e) => setOrgDescription(e.target.value)} />
            </>
          )}

          {erreur && <p className="error" role="alert">{erreur}</p>}
          <button type="submit" disabled={chargement}>{chargement ? "..." : t("auth.registerButton")}</button>
        </form>

        <p className="muted small">
          {t("auth.hasAccount")} <Link to="/login">{t("auth.loginTitle")}</Link>
        </p>
      </div>
    </div>
  );
}