import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./pages/Layout";
import Login from "./pages/Login";
import Filieres from "./pages/Filieres";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/filieres" element={<Filieres />} />
      </Route>
      <Route path="*" element={<Navigate to="/filieres" replace />} />
    </Routes>
  );
}
