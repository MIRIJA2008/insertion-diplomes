import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

export default function Layout() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div>
      <header className="topbar">
        <strong>Insertion des diplômés</strong>
        <nav>
          <NavLink to="/tableau-de-bord">Tableau de bord</NavLink>
          <NavLink to="/filieres">Filières</NavLink>
          {user.role === "ADMIN" && <NavLink to="/campagnes">Campagnes</NavLink>}
        </nav>
        <div className="user">
          <span>{user.nom} ({user.role === "ADMIN" ? "administrateur" : "consultant"})</span>
          <button className="secondary" onClick={logout}>Déconnexion</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
