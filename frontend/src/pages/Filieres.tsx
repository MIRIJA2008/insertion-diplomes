import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { useAuth } from "../auth";

interface Filiere {
  id: number;
  code: string;
  intitule: string;
  niveau: string;
  _count: { promotions: number };
}

export default function Filieres() {
  const { user } = useAuth();
  const estAdmin = user?.role === "ADMIN";
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [code, setCode] = useState("");
  const [intitule, setIntitule] = useState("");
  const [niveau, setNiveau] = useState("");

  const charger = async () => {
    try {
      setFilieres(await api<Filiere[]>("/filieres"));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    void charger();
  }, []);

  const ajouter = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    try {
      await api("/filieres", { method: "POST", body: { code, intitule, niveau } });
      setCode("");
      setIntitule("");
      setNiveau("");
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Ajout impossible");
    }
  };

  const supprimer = async (f: Filiere) => {
    if (!window.confirm(`Supprimer la filiere ${f.code} ?`)) return;
    setErreur("");
    try {
      await api(`/filieres/${f.id}`, { method: "DELETE" });
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Suppression impossible");
    }
  };

  return (
    <section>
      <h2>Filieres</h2>
      {erreur && <p className="error" role="alert">{erreur}</p>}

      {estAdmin && (
        <form className="card inline-form" onSubmit={ajouter}>
          <input placeholder="Code (ex. DEV)" required value={code} onChange={(e) => setCode(e.target.value)} />
          <input placeholder="Intitule" required value={intitule} onChange={(e) => setIntitule(e.target.value)} />
          <input placeholder="Niveau (ex. BTS)" required value={niveau} onChange={(e) => setNiveau(e.target.value)} />
          <button type="submit">Ajouter</button>
        </form>
      )}

      {chargement ? (
        <p className="muted">Chargement...</p>
      ) : filieres.length === 0 ? (
        <p className="muted">Aucune filiere pour le moment.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Intitule</th>
                <th>Niveau</th>
                <th>Promotions</th>
                {estAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filieres.map((f) => (
                <tr key={f.id}>
                  <td>{f.code}</td>
                  <td>{f.intitule}</td>
                  <td>{f.niveau}</td>
                  <td>{f._count.promotions}</td>
                  {estAdmin && (
                    <td>
                      <button className="danger" onClick={() => void supprimer(f)}>Supprimer</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
