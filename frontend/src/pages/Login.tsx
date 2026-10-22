import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";

export default function Login() {
  const { user, login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await login(email, motDePasse);
      navigate("/", { replace: true });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" className="muted small">&larr; {t("nav.home")}</Link>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
        <h1>{t("auth.loginTitle")}</h1>
        <p className="muted">{t("auth.loginSubtitle")}</p>

        <form onSubmit={soumettre} style={{ display: "flex", flexDirection: "column", gap: ".25rem" }}>
          <label htmlFor="email">{t("auth.email")}</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor="mdp">{t("auth.password")}</label>
          <input id="mdp" type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />

          {erreur && <p className="error" role="alert">{erreur}</p>}
          <button type="submit" disabled={chargement}>{chargement ? "..." : t("auth.loginButton")}</button>
        </form>

        <p className="muted small">
          {t("auth.noAccount")} <Link to="/inscription">{t("nav.register")}</Link>
        </p>
      </div>
    </div>
  );
}