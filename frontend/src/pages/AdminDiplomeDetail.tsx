import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import BackButton from "../components/BackButton";

interface CandidatureDetail {
  id: number; statut: string; dateEnvoi: string;
  offre: { titre: string; organisme: { nom: string } };
}

interface ProfilData {
  niveauEtudes: string | null;
  etablissement: string | null;
  filiere: { code: string; intitule: string } | null;
  competences: string[];
  experience: string | null;
  verifie: boolean;
  situationPro: string;
}

interface DiplomeDetail {
  id: number; nom: string; email: string; creeLe: string;
  profilCandidat: ProfilData | null;
  candidatures: CandidatureDetail[];
}

export default function AdminDiplomeDetail() {
  const { id } = useParams();
  const [data, setData] = useState<DiplomeDetail | null>(null);
  const [saving, setSaving] = useState(false);

  const charger = () => {
    api<DiplomeDetail>(`/admin/diplomes/${id}`).then(setData).catch(() => {});
  };

  useEffect(() => { charger(); }, [id]);

  const toggleVerif = async () => {
    if (!data?.profilCandidat) return;
    setSaving(true);
    try {
      await api(`/admin/diplomes/${id}/verifier`, {
        method: "PATCH",
        body: { verifie: !data.profilCandidat.verifie },
      });
      charger();
    } finally { setSaving(false); }
  };

  const changerSituation = async (situation: string) => {
    setSaving(true);
    try {
      await api(`/admin/diplomes/${id}/situation`, {
        method: "PATCH",
        body: { situationPro: situation },
      });
      charger();
    } finally { setSaving(false); }
  };

  if (!data) return <p className="muted">Chargement...</p>;
  const p = data.profilCandidat;

  return (
    <div>
      <BackButton />
      <Link to="/admin/diplomes" className="pf-back" style={{ marginBottom: "1rem" }}>&larr; Retour à la liste</Link>

      <div className="cand-detail-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <div className="rec-avatar rec-avatar-lg" style={{ background: "linear-gradient(135deg, var(--fusion-violet), var(--fusion-cyan))" }}>
            {data.nom.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{data.nom}</h1>
            <p style={{ margin: ".25rem 0", color: "var(--texte-muet)" }}>{data.email}</p>
            <div style={{ marginTop: ".5rem" }}>
              {p?.verifie ? (
                <span className="cand-badge cand-badge-acceptee">Profil Vérifié</span>
              ) : (
                <span className="cand-badge cand-badge-envoyee">En attente de vérification</span>
              )}
            </div>
          </div>
        </div>
        {p && (
          <button
            className={`pf-btn ${p.verifie ? "pf-btn-ghost" : "pf-btn-primary"}`}
            onClick={toggleVerif}
            disabled={saving}
          >
            {saving ? "..." : p.verifie ? "Retirer la vérification" : "Vérifier le profil"}
          </button>
        )}
      </div>

      <div className="cand-detail-grid">
        <div className="cand-detail-main">
          <div className="cand-detail-card">
            <h3>Parcours académique</h3>
            {p ? (
              <>
                <p><strong>Filière :</strong> {p.filiere ? `${p.filiere.code} - ${p.filiere.intitule}` : "Non renseigné"}</p>
                <p><strong>Niveau :</strong> {p.niveauEtudes || "Non renseigné"}</p>
                <p><strong>Établissement :</strong> {p.etablissement || "Non renseigné"}</p>
                <div style={{ marginTop: "1rem" }}>
                  <strong>Compétences :</strong>
                  <div className="rec-skill-list" style={{ marginTop: ".5rem" }}>
                    {p.competences.length > 0 ? p.competences.map((c, i) => <span key={i} className="pf-chip pf-chip-cyan">{c}</span>) : <span className="muted">Aucune.</span>}
                  </div>
                </div>
              </>
            ) : <p className="muted">Profil non complété.</p>}
          </div>

          <div className="cand-detail-card">
            <h3>Situation professionnelle</h3>
            {p ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <p>Statut actuel : <strong>{p.situationPro === "INCONNU" ? "Inconnu" : p.situationPro}</strong></p>
                <select
                  value={p.situationPro}
                  onChange={(e) => changerSituation(e.target.value)}
                  disabled={saving}
                  style={{ padding: ".6rem", borderRadius: "8px", border: "1px solid var(--bord)", background: "var(--surface-2)" }}
                >
                  <option value="INCONNU">Inconnu / À confirmer</option>
                  <option value="EN_RECHERCHE">En recherche d emploi</option>
                  <option value="EN_STAGE">En stage</option>
                  <option value="EN_ALTERNANCE">En alternance</option>
                  <option value="EN_CDD">En CDD</option>
                  <option value="EN_CDI">En CDI</option>
                  <option value="INDEPENDANT">Indépendant</option>
                  <option value="EN_FORMATION">En formation complémentaire</option>
                </select>
              </div>
            ) : <p className="muted">Profil non complété.</p>}
          </div>

          <div className="cand-detail-card">
            <h3>Historique des candidatures ({data.candidatures.length})</h3>
            {data.candidatures.length === 0 ? <p className="muted">Aucune candidature.</p> : (
              <div className="rec-list">
                {data.candidatures.map((c) => (
                  <div key={c.id} className="rec-item">
                    <div className="rec-item-body">
                      <div className="rec-item-title">{c.offre.titre}</div>
                      <div className="rec-item-meta">{c.offre.organisme.nom} - {new Date(c.dateEnvoi).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <span className={`cand-badge ${c.statut === "ACCEPTEE" ? "cand-badge-acceptee" : c.statut === "REFUSEE" ? "cand-badge-refusee" : "cand-badge-envoyee"}`}>{c.statut}</span>
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
