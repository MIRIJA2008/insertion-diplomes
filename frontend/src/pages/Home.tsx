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
    api<Accueil>("/public/accueil").then(setDonnees).catch(() => setDonnees(null));
  }, []);

  const chercher = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/offres?q=${encodeURIComponent(q.trim())}` : "/offres");
  };

  const stats: [string, number][] = donnees
    ? [
        [t("home.statsGraduates"), donnees.stats.diplomes],
        [t("home.statsOffers"), donnees.stats.offres],
        [t("home.statsOrganizations"), donnees.stats.organismes],
        [t("home.statsFields"), donnees.stats.filieres],
        [t("home.statsCandidates"), donnees.stats.candidats],
      ]
    : [];

  return (
    <main className="home-page">
      <header className="public-header home-header">
        <Link to="/" className="home-brand" aria-label="Accueil Insertion diplômés">
          <span className="home-brand-mark">ID</span>
          <span>Insertion <span className="home-brand-accent">diplômés</span></span>
        </Link>
        <nav className="home-nav" aria-label="Navigation principale">
          <Link to="/">{t("nav.home")}</Link>
          <Link to="/offres">{t("nav.offers")}</Link>
        </nav>
        <div className="home-header-actions">
          <LanguageSelector />
          <ThemeToggle />
          {user ? (
            <Link className="link-button home-register" to="/candidat">{t("nav.dashboard")}</Link>
          ) : (
            <>
              <Link className="home-login" to="/login">{t("nav.login")}</Link>
              <Link className="link-button home-register" to="/inscription">{t("nav.register")}</Link>
            </>
          )}
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <div className="home-eyebrow"><span className="home-pulse" />Suivi de l'insertion des diplomes</div>
            <h1>{t("home.heroTitle")}<span className="home-gradient-text">Votre parcours academique merite un avenir a sa hauteur.</span></h1>
            <p className="home-hero-description">{t("home.heroSubtitle")}</p>
            <div className="home-hero-actions">
              <Link className="home-primary-cta" to="/offres">{t("home.ctaSearch")} <span aria-hidden="true">↗</span></Link>
              {!user && <Link className="home-secondary-cta" to="/inscription">{t("home.ctaRegister")} <span aria-hidden="true">→</span></Link>}
            </div>
            <form className="home-search" onSubmit={chercher}>
              <span className="home-search-icon" aria-hidden="true">⌕</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("home.searchPlaceholder")} aria-label={t("home.searchPlaceholder")} />
              <button className="home-primary-cta" type="submit">{t("common.search")}</button>
            </form>
            <div className="home-trust-note"><span className="home-trust-dot" />Des opportunités adaptées à votre parcours de formation</div>
          </div>

          <div className="home-visual" aria-label="Illustration du parcours professionnel">
            <div className="home-visual-glow" />
            <div className="home-orbit home-orbit-one" />
            <div className="home-orbit home-orbit-two" />
            <div className="home-orbit home-orbit-three" />
            <div className="home-core">
              <span className="home-core-icon" aria-hidden="true">✦</span>
              <strong>Votre avenir</strong><small>Prêt à évoluer</small>
            </div>
            <div className="home-float-card home-float-card-one">
              <span className="home-float-icon violet" aria-hidden="true">⌘</span>
              <span><strong>Votre formation</strong><small>Compétences valorisées</small></span>
              <span className="home-float-check" aria-hidden="true">✓</span>
            </div>
            <div className="home-float-card home-float-card-two">
              <span className="home-float-icon pink" aria-hidden="true">↗</span>
              <span><strong>Une opportunité</strong><small>Stage · Emploi · Alternance</small></span>
            </div>
            <div className="home-float-card home-float-card-three">
              <span className="home-float-icon cyan" aria-hidden="true">◎</span>
              <span><strong>Votre parcours</strong><small>Vers le monde professionnel</small></span>
            </div>
            <div className="home-visual-caption"><span className="home-caption-line" />Formation <span>→</span> Opportunité <span>→</span> Insertion</div>
          </div>
        </div>
        <div className="home-hero-bottom"><span>FORMATION</span><span>✦</span><span>COMPÉTENCES</span><span>✦</span><span>INSERTION PROFESSIONNELLE</span><Link to="/offres" aria-label={t("home.ctaSearch")}>↗</Link></div>
      </section>

      <section className="home-stats-section">
        <div className="home-section-heading home-stats-heading">
          <div><span className="home-section-kicker">La plateforme en chiffres</span><h2>Une vision concrète de l’insertion</h2><p>Les indicateurs ci-dessous proviennent des données disponibles sur la plateforme.</p></div>
          <span className="home-live-badge"><span className="home-live-dot" />Données de la plateforme</span>
        </div>
        {donnees ? (
          <div className="home-stats-grid">
            {stats.map(([titre, valeur], index) => (
              <article className="home-stat-card" key={titre}>
                <span className={`home-stat-icon home-stat-icon-${index % 4}`} aria-hidden="true">{["◎", "↗", "⌂", "⌘"][index % 4]}</span>
                <span className="home-stat-label">{titre}</span><strong className="home-stat-value">{valeur.toLocaleString()}</strong><span className="home-stat-foot">Donnée actuelle</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="home-data-notice"><span className="home-data-notice-icon" aria-hidden="true">ⓘ</span><p>Les indicateurs seront affichés lorsque les données du service seront disponibles.</p></div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section-heading"><span className="home-section-kicker">Explorez les possibilités</span><h2>{t("home.servicesTitle")}</h2><p>{t("home.servicesText")}</p></div>
        <div className="home-feature-grid">
          <article className="home-feature-card"><div className="home-feature-art home-art-violet"><span className="home-art-symbol" aria-hidden="true">⌘</span><span className="home-art-mini">01 / PROFIL</span></div><div className="home-feature-body"><span className="home-card-index">01 — CANDIDAT</span><h3>Valorisez votre parcours</h3><p>Présentez votre formation, vos diplômes et vos compétences pour faciliter la recherche d’opportunités.</p></div></article>
          <article className="home-feature-card"><div className="home-feature-art home-art-pink"><span className="home-art-symbol" aria-hidden="true">↗</span><span className="home-art-mini">02 / OPPORTUNITÉS</span></div><div className="home-feature-body"><span className="home-card-index">02 — RECHERCHE</span><h3>Trouvez une opportunité</h3><p>Explorez les offres de stage, d’alternance et d’emploi publiées sur la plateforme.</p></div></article>
          <article className="home-feature-card"><div className="home-feature-art home-art-cyan"><span className="home-art-symbol" aria-hidden="true">◎</span><span className="home-art-mini">03 / INSERTION</span></div><div className="home-feature-body"><span className="home-card-index">03 — INSERTION</span><h3>Suivez votre évolution</h3><p>Retrouvez vos démarches et contribuez au suivi du parcours professionnel après la formation.</p></div></article>
        </div>
      </section>

      <section className="home-journey-section">
        <div className="home-section-heading"><span className="home-section-kicker">Simple et progressif</span><h2>Du diplôme à l’insertion professionnelle</h2><p>Un parcours conçu pour rapprocher la formation des opportunités professionnelles.</p></div>
        <div className="home-journey-grid">
          <article className="home-journey-card"><span className="home-journey-number">ÉTAPE 01</span><span className="home-journey-icon violet">01</span><h3>Créez votre profil</h3><p>Renseignez votre parcours d’études, vos diplômes et vos compétences.</p></article>
          <article className="home-journey-card"><span className="home-journey-number">ÉTAPE 02</span><span className="home-journey-icon pink">02</span><h3>Recherchez</h3><p>Consultez les opportunités correspondant à votre projet professionnel.</p></article>
          <article className="home-journey-card"><span className="home-journey-number">ÉTAPE 03</span><span className="home-journey-icon cyan">03</span><h3>Postulez</h3><p>Candidatez aux offres ouvertes qui correspondent à votre profil.</p></article>
          <article className="home-journey-card"><span className="home-journey-number">ÉTAPE 04</span><span className="home-journey-icon green">04</span><h3>Avancez</h3><p>Faites évoluer votre parcours vers l’emploi et l’insertion professionnelle.</p></article>
        </div>
      </section>

      <section className="home-section home-offers-section">
        <div className="home-section-heading home-offers-heading"><div><span className="home-section-kicker">À découvrir</span><h2>{t("home.latestOffers")}</h2><p>Consultez les dernières opportunités publiées sur la plateforme.</p></div><Link className="home-text-link" to="/offres">{t("home.ctaSearch")} <span>→</span></Link></div>
        {donnees && donnees.dernieresOffres.length > 0 ? (
          <div className="home-real-offers grille">{donnees.dernieresOffres.map((offre) => <OffreCard key={offre.id} offre={offre} />)}</div>
        ) : (
          <div className="home-empty-state"><span aria-hidden="true">⌕</span><h3>{t("common.none")}</h3><p>Les offres seront visibles ici lorsqu’elles seront disponibles.</p><Link to="/offres">{t("home.ctaSearch")} →</Link></div>
        )}
      </section>

      {donnees && donnees.categories.length > 0 && (
        <section className="home-section home-categories-section">
          <div className="home-section-heading"><span className="home-section-kicker">Explorer par domaine</span><h2>{t("home.categoriesTitle")}</h2><p>{t("home.categoriesText")}</p></div>
          <div className="home-category-list">{donnees.categories.map((categorie) => <Link key={categorie} className="home-category-chip" to={`/offres?q=${encodeURIComponent(categorie.replace(/_/g, " "))}`}>{categorie.replace(/_/g, " ")} <span>↗</span></Link>)}</div>
        </section>
      )}

      <section className="home-benefits-section">
        <div className="home-section-heading"><span className="home-section-kicker">Un espace pensé pour votre avenir</span><h2>Une plateforme au service de votre parcours</h2></div>
        <div className="home-benefits-grid">
          <article className="home-benefit"><span className="home-benefit-icon violet">⌘</span><h3>Un parcours valorisé</h3><p>Vos formations et compétences sont au centre de votre profil professionnel.</p></article>
          <article className="home-benefit"><span className="home-benefit-icon pink">⌕</span><h3>Des offres accessibles</h3><p>Recherchez les opportunités et consultez leurs informations avant de postuler.</p></article>
          <article className="home-benefit"><span className="home-benefit-icon cyan">◎</span><h3>Un meilleur suivi</h3><p>La plateforme contribue au suivi de l’insertion professionnelle des diplômés.</p></article>
        </div>
      </section>

      <section className="home-final-cta">
        <div className="home-cta-glow" /><span className="home-section-kicker">La prochaine étape vous appartient</span>
        <h2>Prêt à donner une nouvelle dimension à votre parcours ?</h2>
        <p>Explorez les offres ou créez votre profil pour commencer votre parcours vers le monde professionnel.</p>
        <div className="home-hero-actions"><Link className="home-primary-cta" to="/offres">{t("home.ctaSearch")} ↗</Link>{!user && <Link className="home-secondary-cta" to="/inscription">{t("home.ctaRegister")} →</Link>}</div>
      </section>

      <footer className="footer home-footer">
        <div className="home-footer-main">
          <div><Link to="/" className="home-brand"><span className="home-brand-mark">ID</span><span>Insertion <span className="home-brand-accent">diplômés</span></span></Link><p>{t("home.footerAbout")}</p></div>
          <div className="home-footer-links"><h4>{t("nav.offers")}</h4><Link to="/offres">{t("home.ctaSearch")}</Link><Link to="/inscription">{t("home.ctaRegister")}</Link></div>
          <div className="home-footer-links"><h4>Mon espace</h4><Link to={user ? "/candidat" : "/login"}>{user ? t("nav.dashboard") : t("nav.login")}</Link><span>{t("common.language")}: Français · Malagasy</span></div>
        </div>
        <div className="home-footer-bottom"><span>© {new Date().getFullYear()} Insertion diplômés</span><span>Formation · Compétences · Insertion</span></div>
      </footer>
    </main>
  );
}
