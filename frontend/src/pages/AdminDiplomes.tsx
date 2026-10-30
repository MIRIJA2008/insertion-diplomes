import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import BackButton from "../components/BackButton";

interface Diplome {
  id: number; nom: string; email: string; creeLe: string;
  profilCandidat: { niveauEtudes: string | null; filiere: { code: string; intitule: string } | null } | null;
  _count: { candidatures: number };
}

export default function AdminDiplomes() {
  const [list, setList] = useState<Diplome[] | null>(null);
  const [q, setQ] = useState("");

  const charger = () => {
    setList(null);
    const url = q ? `/admin/diplomes?q=${encodeURIComponent(q)}` : "/admin/diplomes";
    api<Diplome[]>(url).then(setList).catch(() => setList([]));
  };

  useEffect(() => { charger(); }, []);

  const rechercher = (e: React.FormEvent) => {
    e.preventDefault();
    charger();
  };

  return (
    <div>
      <BackButton />
      <div className="pf-header">
        <div className="pf-header-copy"><h1>Suivi des diplômés</h1><p>Recherchez et consultez le parcours de chaque diplômé.</p></div>
      </div>

      <form onSubmit={rechercher} className="pf-filters" style={{ marginBottom: "2rem", gridTemplateColumns: "1fr auto" }}>
        <div className="pf-filter">
          <label>Recherche</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou email..." />
        </div>
        <div className="pf-filter pf-filter-btn">
          <button type="submit" className="pf-btn pf-btn-primary">Rechercher</button>
        </div>
      </form>

      {list === null && <p className="muted">Chargement...</p>}
      {list !== null && list.length === 0 && <p className="empty">Aucun diplômé trouvé.</p>}
      {list !== null && list.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "var(--surface-2)", textAlign: "left" }}>
              <th style={{ padding: "1rem" }}>Nom</th>
              <th style={{ padding: "1rem" }}>Filière</th>
              <th style={{ padding: "1rem" }}>Niveau</th>
              <th style={{ padding: "1rem" }}>Candidatures</th>
              <th style={{ padding: "1rem" }}>Inscrit le</th>
              <th style={{ padding: "1rem" }}></th>
            </tr></thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} style={{ borderTop: "1px solid var(--bord)" }}>
                  <td style={{ padding: "1rem" }}>
                    <strong>{d.nom}</strong><br />
                    <span style={{ fontSize: ".8rem", color: "var(--texte-muet)" }}>{d.email}</span>
                  </td>
                  <td style={{ padding: "1rem" }}>{d.profilCandidat?.filiere?.code || "-"}</td>
                  <td style={{ padding: "1rem" }}>{d.profilCandidat?.niveauEtudes || "-"}</td>
                  <td style={{ padding: "1rem" }}><span className="pf-chip pf-chip-cyan">{d._count.candidatures}</span></td>
                  <td style={{ padding: "1rem", fontSize: ".85rem" }}>{new Date(d.creeLe).toLocaleDateString("fr-FR")}</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <Link to={`/admin/diplomes/${d.id}`} className="pf-btn" style={{ padding: ".4rem .8rem", fontSize: ".8rem" }}>Fiche</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
