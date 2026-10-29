import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

export default function BackButton() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();

  const handleBack = () => {
    // Si on a un historique (on n'est pas arrivé par un lien direct)
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Fallback selon le rôle
      if (user?.role === "RECRUTEUR") navigate("/recruteur");
      else if (user?.role === "ADMIN" || user?.role === "CONSULTANT") navigate("/tableau-de-bord");
      else if (user?.role === "CANDIDAT") navigate("/candidat");
      else navigate("/");
    }
  };

  // Ne pas afficher le bouton sur la page d'accueil
  if (location.pathname === "/" || location.pathname === "/login") return null;

  return (
    <button onClick={handleBack} className="pf-btn pf-btn-ghost" style={{ marginBottom: "1rem", padding: ".4rem .8rem", fontSize: ".85rem" }}>
      <span style={{ fontSize: "1.1rem", marginRight: ".35rem" }}>&larr;</span> Retour
    </button>
  );
}
