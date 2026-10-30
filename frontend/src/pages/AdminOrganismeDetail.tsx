import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import BackButton from "../components/BackButton";

interface Offre { id: number; titre: string; statut: string; _count: { candidatures: number }; }
interface Organisme {
  id: number; nom: string; ville: string | null; verifie: boolean; description: string | null;
  utilisateur: { email: string };
  offres: Offre[];
}

export default function AdminOrganismeDetail() {
  const { id } = useParams();
  const [data, setData] = useState<Organisme | null>(null);
  const [saving, setSaving] = useState(false);

  const charger = () => {
    api<Organisme>(`/admin/organismes/${id}`).then(setData).catch(() => {});
  };

  useEffect(() => { charger(); }, [id]);

  const toggleVerif = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await api(`/admin/organismes/${id}/verifier`, {
        method: "PATCH",
        body: { verifie: !data.verifie },
      });
      charger();
    } finally { setSaving(false); }
  };

  if (!data) return <p className="muted">Chargement...</p>;

  return (
    <div>
      <BackButton />
      <Link to="/admin/organismes" className="pf-back" style={{ marginBottom: "1rem" }}>&larr; Retour à la liste</Link>

      <div className="cand-detail-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <div className="rec-avatar rec-avatar-lg" style={{ background: "linear-gradient(135deg, var(--fusion-cyan), var(--fusion-violet))" }}>
            {data.nom.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{data.nom}</h1>
            <p style={{ margin: ".25rem 0", color: "var(--texte-muet)" }}>{data.utilisateur.email} - {data.ville || "Ville non renseignée"}</p>
          </div>
        </div>
        <button
          className={`pf-btn ${data.verifie ? "pf-btn-ghost" : "pf-btn-primary"}`}
          onClick={toggleVerif}
          disabled={saving}
        >
          {saving ? "..." : data.verifie ? "Retirer la vérification" : "Vérifier cet organisme"}
        </button>
      </div>

      <div className="cand-detail-grid">
        <div className="cand-detail-main">
          <div className="cand-detail-card">
            <h3>Informations</h3>
            <p>{data.description || "Aucune description."}</p>
            <div style={{ marginTop: "1rem" }}>
              <strong>Statut actuel : </strong>
              {data.verifie ? <span style={{ color: "var(--fusion-emerald)" }}>Vérifié</span> : <span style={{ color: "var(--fusion-amber)" }}>En attente de vérification</span>}
            </div>
          </div>

          <div className="cand-detail-card">
            <h3>Offres publiées ({data.offres.length})</h3>
            {data.offres.length === 0 ? <p className="muted">Aucune offre publiée.</p> : (
              <div className="rec-list">
                {data.offres.map((o) => (
                  <div key={o.id} className="rec-item">
                    <div className="rec-item-body">
                      <div className="rec-item-title">{o.titre}</div>
                      <div className="rec-item-meta">{o._count.candidatures} candidatures reçues</div>
                    </div>
                    <Link to={`/offres/${o.id}`} className="pf-btn" style={{ padding: ".4rem .8rem", fontSize: ".8rem" }}>Voir</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
