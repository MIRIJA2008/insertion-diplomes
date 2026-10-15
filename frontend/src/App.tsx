import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./pages/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Filieres from "./pages/Filieres";
import Campagnes from "./pages/Campagnes";
import Enquete from "./pages/Enquete";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/enquete/:jeton" element={<Enquete />} />
      <Route element={<Layout />}>
        <Route path="/tableau-de-bord" element={<Dashboard />} />
        <Route path="/filieres" element={<Filieres />} />
        <Route path="/campagnes" element={<Campagnes />} />
      </Route>
      <Route path="*" element={<Navigate to="/tableau-de-bord" replace />} />
    </Routes>
  );
}
