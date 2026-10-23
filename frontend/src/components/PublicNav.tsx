import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";

const ROUTE_PAR_ROLE: Record<string, string> = {
  ADMIN: "/tableau-de-bord",
  CONSULTANT: "/tableau-de-bord",
  RECRUTEUR: "/recruteur",
  CANDIDAT: "/candidat",
};

export default function PublicNav() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <nav className="pub-nav">
      <Link to="/" className="pub-nav-brand">
        <span className="pub-nav-brand-mark">ID</span>
        Insertion diplomes
      </Link>
      <div className="pub-nav-links">
        <Link to="/">Accueil</Link>
        <Link to="/offres">{t("nav.offers")}</Link>
        {user ? (
          <>
            <Link to={ROUTE_PAR_ROLE[user.role] ?? "/"}>{t("nav.dashboard")}</Link>
            <button type="button" onClick={() => { logout(); navigate("/"); }}>
              {t("nav.logout")}
            </button>
          </>
        ) : (
          <>
            <Link to="/login">{t("nav.login")}</Link>
          </>
        )}
      </div>
      <div className="pub-nav-actions">
        <LanguageSelector />
        <ThemeToggle />
        {!user && (
          <Link to="/inscription" className="pf-btn pf-btn-primary">
            {t("nav.register")}
          </Link>
        )}
      </div>
    </nav>
  );
}