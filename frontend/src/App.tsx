import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./pages/Layout";
import Login from "./pages/Login";
import Filieres from "./pages/Filieres";
import Enquete from "./pages/Enquete";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/enquete/:jeton" element={<Enquete />} />
      <Route element={<Layout />}>
        <Route path="/filieres" element={<Filieres />} />
      </Route>
      <Route path="*" element={<Navigate to="/filieres" replace />} />
    </Routes>
  );
}
