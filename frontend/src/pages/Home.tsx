import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Offre } from "../api";
import { useI18n } from "../i18n";
import { useAuth } from "../auth";
import OffreCard from "../components/OffreCard";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";

interface Accueil {
  stats: { diplomes: number; offres: number; organismes: number; filieres: number; candidats: number };
  categories: string[];
  dernieresOffres: Offre[];
}

export default function Home() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donnees, setDonnees] = useState<Accueil | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api<Accueil>("/public/accueil").then(setDonnees).catch(() => {});
  }, []);

  const chercher = (e: FormEvent) => {
    e.preventDefault();
    navigate(q ? `/offres?q=${encodeURIComponent(q)}` : "/offres");
  };

  const stats = donnees
    ? [
        [t("home.statsGraduates"), donnees.stats.diplomes],
        [t("home.statsOffers"), donnees.stats.offres],
        [t("home.statsOrganizations"), donnees.stats.organismes],
        [t("home.statsFields"), donnees.stats.filieres],
        [t("home.statsCandidates"), donnees.stats.candidats],
      ]
    : [];

  return (
    <div>
      <header className="public-header">
        <Link to="/" className="brand">Insertion diplomes</Link>
        <nav>
          <Link to="/">{t("nav.home")}</Link>
          <Link to="/offres">{t("nav.offers")}</Link>
        </nav>
        <LanguageSelector />
        <ThemeToggle />
        {user ? (
          <Link className="link-button" to="/candidat">{t("nav.dashboard")}</Link>
        ) : (
          <>
            <Link className="link-button" to="/login">{t("nav.login")}</Link>
            <Link className="link-button" to="/inscription" style={{ background: "var(--accent)", color: "#fff", border: 0 }}>
              {t("nav.register")}
            </Link>
          </>
        )}
      </header>

      <section className="hero">
        <h1>{t("home.heroTitle")}</h1>
        <p>{t("home.heroSubtitle")}</p>
        <div className="actions">
          <Link className="link-button" to="/offres">{t("home.ctaSearch")}</Link>
          <Link className="link-button" to="/inscription">{t("home.ctaRegister")}</Link>
        </div>
      </section>

      <div className="hero-search">
        <form className="boite" onSubmit={chercher}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("home.searchPlaceholder")} />
          <button type="submit">{t("common.search")}</button>
        </form>
      </div>

      {donnees && (
        <section className="section">
          <div className="stat-grid">
            {stats.map(([titre, valeur]) => (
              <div key={titre} className="stat-card">
                <span className="stat-title">{titre}</span>
                <strong className="stat-value">{valeur}</strong>
              </div>
            ))}
          </div>

          <h2>{t("home.servicesTitle")}</h2>
          <div className="card"><p>{t("home.servicesText")}</p></div>

          <h2>{t("home.categoriesTitle")}</h2>
          <p className="muted">{t("home.categoriesText")}</p>
          <div className="actions-bar" style={{ marginBottom: "1rem" }}>
            {donnees.categories.map((c) => <span key={c} className="chip">{c.replace(/_/g, " ")}</span>)}
          </div>

          <h2>{t("home.latestOffers")}</h2>
          {donnees.dernieresOffres.length === 0 ? (
            <p className="empty">{t("common.none")}</p>
          ) : (
            <div className="grille">
              {donnees.dernieresOffres.map((o) => <OffreCard key={o.id} offre={o} />)}
            </div>
          )}
        </section>
      )}

      <footer className="footer">
        <div className="colonnes">
          <div>
            <h4>Insertion diplomes</h4>
            <p>{t("home.footerAbout")}</p>
          </div>
          <div>
            <h4>{t("nav.offers")}</h4>
            <p><Link to="/offres">{t("home.ctaSearch")}</Link></p>
            <p><Link to="/inscription">{t("home.ctaRegister")}</Link></p>
          </div>
          <div>
            <h4>{t("common.language")}</h4>
            <p>Fran\u00E7ais \u00B7 Malagasy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}