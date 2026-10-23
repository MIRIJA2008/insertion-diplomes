import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import AppLayout from "./pages/layout/AppLayout";
import RequireRole from "./components/RequireRole";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Offres from "./pages/Offres";
import OffreDetail from "./pages/OffreDetail";
import Enquete from "./pages/Enquete";
import Dashboard from "./pages/Dashboard";
import Filieres from "./pages/Filieres";
import Campagnes from "./pages/Campagnes";
import CandidatAccueil from "./pages/candidat/Accueil";
import CandidatProfil from "./pages/candidat/Profil";
import CandidatSuivi from "./pages/candidat/Suivi";
import CandidatFavoris from "./pages/candidat/Favoris";
import CandidatParametres from "./pages/candidat/Parametres";
import RecruteurAccueil from "./pages/recruteur/Accueil";
import RecruteurMesOffres from "./pages/recruteur/MesOffres";
import RecruteurRecu from "./pages/recruteur/Recu";
import RecruteurOrganisme from "./pages/recruteur/Organisme";
import RecruteurCandidatDetail from "./pages/recruteur/CandidatDetail";
import Communautes from "./pages/Communautes";
import Messagerie from "./pages/Messagerie";

function AccueilSelonRole() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case "ADMIN":
    case "CONSULTANT":
      return <Navigate to="/tableau-de-bord" replace />;
    case "RECRUTEUR":
      return <Navigate to="/recruteur" replace />;
    default:
      return <Navigate to="/candidat" replace />;
  }
}

export default function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<Home />} />
      <Route path="/offres" element={<Offres />} />
      <Route path="/offres/:id" element={<OffreDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/inscription" element={<Register />} />
      <Route path="/enquete/:jeton" element={<Enquete />} />

      {/* Routes privees (layout + guards par role) */}
      <Route element={<AppLayout />}>
        <Route element={<RequireRole roles={["ADMIN", "CONSULTANT"]} />}>
          <Route path="/tableau-de-bord" element={<Dashboard />} />
          <Route path="/filieres" element={<Filieres />} />
          <Route path="/campagnes" element={<Campagnes />} />
        </Route>

        <Route element={<RequireRole roles={["CANDIDAT"]} />}>
          <Route path="/candidat" element={<CandidatAccueil />} />
          <Route path="/candidat/profil" element={<CandidatProfil />} />
          <Route path="/candidat/candidatures" element={<CandidatSuivi />} />
          <Route path="/candidat/favoris" element={<CandidatFavoris />} />
          <Route path="/candidat/parametres" element={<CandidatParametres />} />
        </Route>

        <Route element={<RequireRole roles={["RECRUTEUR"]} />}>
          <Route path="/recruteur" element={<RecruteurAccueil />} />
          <Route path="/recruteur/offres" element={<RecruteurMesOffres />} />
          <Route path="/recruteur/candidatures" element={<RecruteurRecu />} />
          <Route path="/recruteur/organisme" element={<RecruteurOrganisme />} />
          <Route path="/recruteur/candidat/:id" element={<RecruteurCandidatDetail />} />
        </Route>

        <Route path="/communautes" element={<Communautes />} />
        <Route path="/messages" element={<Messagerie />} />
      </Route>

      <Route path="*" element={<AccueilSelonRole />} />
    </Routes>
  );
}