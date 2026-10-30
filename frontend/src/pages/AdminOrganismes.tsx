import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import BackButton from "../components/BackButton";

interface Organisme {
  id: number; nom: string; ville: string | null; verifie: boolean;
  utilisateur: { email: string };
  _count: { offres: number };
}

export default function AdminOrganismes() {
  const [list, setList] = useState<Organisme[] | null>(null);
  const [q, setQ] = useState("");

  const charger = () => {
    setList(null);
    const url = q ? `/admin/organismes?q=${encodeURIComponent(q)}` : "/admin/organismes";
    api<Organisme[]>(url).then(setList).catch(() => setList([]));
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
        <div className="pf-header-copy"><h1>Recruteurs et organismes</h1><p>Vérifiez les organismes et suivez leur activité.</p></div>
      </div>

      <form onSubmit={rechercher} className="pf-filters" style={{ marginBottom: "2rem", gridTemplateColumns: "1fr auto" }}>
        <div className="pf-filter">
          <label>Recherche</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom de l organisme..." />
        </div>
        <div className="pf-filter pf-filter-btn">
          <button type="submit" className="pf-btn pf-btn-primary">Rechercher</button>
        </div>
      </form>

      {list === null && <p className="muted">Chargement...</p>}
      {list !== null && list.length === 0 && <p className="empty">Aucun organisme trouvé.</p>}
      {list !== null && list.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "var(--surface-2)", textAlign: "left" }}>
              <th style={{ padding: "1rem" }}>Nom</th>
              <th style={{ padding: "1rem" }}>Ville</th>
              <th style={{ padding: "1rem" }}>Statut</th>
              <th style={{ padding: "1rem" }}>Offres</th>
              <th style={{ padding: "1rem" }}></th>
            </tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} style={{ borderTop: "1px solid var(--bord)" }}>
                  <td style={{ padding: "1rem" }}>
                    <strong>{o.nom}</strong><br />
                    <span style={{ fontSize: ".8rem", color: "var(--texte-muet)" }}>{o.utilisateur.email}</span>
                  </td>
                  <td style={{ padding: "1rem" }}>{o.ville || "-"}</td>
                  <td style={{ padding: "1rem" }}>
                    {o.verifie ? (
                      <span className="cand-badge cand-badge-acceptee">Vérifié</span>
                    ) : (
                      <span className="cand-badge cand-badge-envoyee">Non vérifié</span>
                    )}
                  </td>
                  <td style={{ padding: "1rem" }}><span className="pf-chip pf-chip-cyan">{o._count.offres}</span></td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <Link to={`/admin/organismes/${o.id}`} className="pf-btn" style={{ padding: ".4rem .8rem", fontSize: ".8rem" }}>Fiche</Link>
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
