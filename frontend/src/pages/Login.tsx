import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  if (user) return <Navigate to="/filieres" replace />;

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await login(email, motDePasse);
      navigate("/filieres", { replace: true });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={soumettre}>
        <h1>Suivi de l'insertion des diplomes</h1>
        <p className="muted">Connexion a l'espace d'administration</p>

        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="mdp">Mot de passe</label>
        <input id="mdp" type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />

        {erreur && <p className="error" role="alert">{erreur}</p>}
        <button type="submit" disabled={chargement}>{chargement ? "Connexion..." : "Se connecter"}</button>
      </form>
    </div>
  );
}
