import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";
import { api, type Notification } from "../../api";
import ThemeToggle from "../../components/ThemeToggle";
import BackButton from "../../components/BackButton";
import LanguageSelector from "../../components/LanguageSelector";

function Contenu() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    api<{ notifications: Notification[]; total: number }>("/notifications").then((r) => setNotifs(r.notifications)).catch(() => setNotifs([]));
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const nonLues = notifs.filter((n) => !n.lue).length;
  const admin = user.role === "ADMIN" || user.role === "CONSULTANT";

  const toutLire = () => {
    api("/notifications/tout-lire", { method: "PATCH" }).then(() =>
      setNotifs((ns) => ns.map((n) => ({ ...n, lue: true })))
    );
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">Insertion diplomes</div>

        {admin && (
          <>
            <NavLink to="/tableau-de-bord">Tableau de bord</NavLink>
            <NavLink to="/filieres">Filieres</NavLink>
            {user.role === "ADMIN" && <NavLink to="/campagnes">Campagnes</NavLink>}
            <NavLink to="/offres">Offres d'emploi</NavLink>
            <NavLink to="/communautes">Communautes</NavLink>
            <NavLink to="/messages">Messages</NavLink>
          </>
        )}

        {user.role === "CANDIDAT" && (
          <>
            <NavLink to="/candidat">{t("nav.candidateSpace")}</NavLink>
            <NavLink to="/offres">{t("nav.offers")}</NavLink>
            <NavLink to="/candidat/profil">{t("nav.profile")}</NavLink>
            <NavLink to="/candidat/candidatures">{t("nav.applications")}</NavLink>
            <NavLink to="/candidat/favoris">{t("nav.favorites")}</NavLink>
            <NavLink to="/candidat/alertes">Alertes</NavLink>
            <NavLink to="/communautes">{t("nav.communities")}</NavLink>
            <NavLink to="/messages">{t("nav.messages")}</NavLink>
            <NavLink to="/notifications">Notifications</NavLink>
            <NavLink to="/candidat/parametres">{t("nav.settings")}</NavLink>
          </>
        )}

        {user.role === "RECRUTEUR" && (
          <>
            <NavLink to="/recruteur">{t("nav.recruiter")}</NavLink>
            <NavLink to="/recruteur/organisme">{t("nav.organization")}</NavLink>
            <NavLink to="/recruteur/offres">{t("nav.myOffers")}</NavLink>
            <NavLink to="/recruteur/candidatures">{t("nav.received")}</NavLink>
            <NavLink to="/recruteur/pipeline">Pipeline</NavLink>
            <NavLink to="/communautes">{t("nav.communities")}</NavLink>
            <NavLink to="/messages">{t("nav.messages")}</NavLink>
            <NavLink to="/notifications">Notifications</NavLink>
          </>
        )}

        <div className="spacer" />
        <Link to="/" className="sidebar-public-link"><span aria-hidden="true">&larr;</span> Site public</Link>
        <button className="secondary" onClick={logout}>{t("nav.logout")}</button>
      </aside>

      <div className="main-col">
        <div className="toprow">
          <h1>{t(`role.${user.role}`)} \u00B7 {user.nom}</h1>
          <div className="popover-wrap">
            <button type="button" className="notif-btn" onClick={() => setOuvert((o) => !o)}>
              Notifications
              {nonLues > 0 && <span className="pastille">{nonLues}</span>}
            </button>
            {ouvert && (
              <div className="notif-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".5rem .8rem" }}>
                  <strong>{t("notif.title")}</strong>
                  <button className="secondary" style={{ padding: ".2rem .5rem", fontSize: ".78rem" }} onClick={toutLire}>
                    {t("notif.readAll")}
                  </button>
                </div>
                {notifs.length === 0 && <p className="muted small" style={{ padding: ".5rem .8rem" }}>{t("common.none")}</p>}
                {notifs.map((n) => (
                  <div key={n.id} className={`notif ${n.lue ? "" : "non-lue"}`}>
                    <strong>{n.titre}</strong>
                    {n.contenu}
                  </div>
                ))}
              </div>
            )}
          </div>
          <LanguageSelector />
          <ThemeToggle />
        </div>
        <main className="page">
        <BackButton />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return <Contenu />;
}