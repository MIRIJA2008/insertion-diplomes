import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../auth";

interface Historique {
  id: number;
  ancienStatut: string | null;
  nouveauStatut: string;
  commentaire: string | null;
  creeLe: string;
  auteur: { nom: string };
}

interface Detail {
  id: number;
  statut: string;
  lettre: string | null;
  dateEnvoi: string;
  offre: { id: number; titre: string; lieu: string; organisme: { nom: string } };
  candidat: { id: number; nom: string; email: string; profilCandidat: any };
  historique: Historique[];
}

const BADGE: any = {
  ENVOYEE: "cand-badge-envoyee",
  VUE: "cand-badge-vue",
  ACCEPTEE: "cand-badge-acceptee",
  REFUSEE: "cand-badge-refusee",
};

export default function CandidatureDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<Detail | null>(null);
  const [erreur, setErreur] = useState("");
  const [statut, setStatut] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState(false);

  const isRecruteur = user?.role === "RECRUTEUR" || user?.role === "ADMIN";
  const retourTo = isRecruteur ? "/recruteur/candidatures" : "/candidat/candidatures";

  const charger = () => {
    api<Detail>(`/candidatures/${id}`)
      .then((d) => { setData(d); setStatut(d.statut); })
      .catch((e) => setErreur(e.message));
  };

  useEffect(charger, [id]);

  const changerStatut = async () => {
    setSaving(true);
    try {
      await api(`/candidatures/${id}/statut`, { method: "PATCH", body: { statut, commentaire } });
      charger();
      setCommentaire("");
      alert("Statut mis a jour !");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (erreur) return (
    <div>
      <Link to={retourTo} className="pf-back"><span className="pf-back-icon">&larr;</span> Retour</Link>
      <div className="pf-alert pf-alert-error">{erreur}</div>
    </div>
  );

  if (!data) return <p className="muted">Chargement...</p>;

  return (
    <div>
      <Link to={retourTo} className="pf-back"><span className="pf-back-icon">&larr;</span> Retour aux candidatures</Link>

      <div className="cand-detail-grid">
        <div className="cand-detail-main">
          <div className="cand-detail-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <h1>{data.offre.titre}</h1>
                <div className="cand-detail-org">{data.offre.organisme.nom} - {data.offre.lieu}</div>
              </div>
              <span className={`cand-badge ${BADGE[data.statut] || ""}`}>{data.statut}</span>
            </div>
            <div className="cand-detail-meta">
              <span><strong>Envoyee le :</strong> {new Date(data.dateEnvoi).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>

          {isRecruteur && (
            <div className="cand-detail-card">
              <h3>Candidat</h3>
              <p><strong>{data.candidat.nom}</strong></p>
              <p>{data.candidat.email}</p>
              <Link to={`/recruteur/candidat/${data.candidat.id}`} className="pf-btn" style={{ marginTop: "1rem" }}>Voir le profil complet</Link>
            </div>
          )}

          <div className="cand-detail-card">
            <h3>Lettre de motivation</h3>
            {data.lettre ? <div className="cand-lettre">{data.lettre}</div> : <p className="muted">Aucune lettre fournie.</p>}
          </div>

          <div className="cand-detail-card">
            <h3>Historique</h3>
            <div className="cand-timeline-v">
              {data.historique && data.historique.map((h, i) => (
                <div key={h.id} className={`cand-timeline-v-item ${i === 0 ? "current" : ""}`}>
                  <div className="cand-timeline-v-date">{new Date(h.creeLe).toLocaleString("fr-FR")}</div>
                  <div className="cand-timeline-v-title">
                    {h.ancienStatut ? `${h.ancienStatut} → ` : ""}{h.nouveauStatut}
                  </div>
                  {h.commentaire && <div className="cand-timeline-v-comment">{h.commentaire}</div>}
                  <div className="cand-timeline-v-author">par {h.auteur.nom}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cand-detail-side">
          {isRecruteur && (
            <div className="cand-detail-card">
              <h3>Prendre une decision</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <select value={statut} onChange={(e) => setStatut(e.target.value)} style={{ padding: ".6rem", borderRadius: "8px", border: "1px solid var(--bord)", background: "var(--surface-2)" }}>
                  <option value="ENVOYEE">Envoyee</option>
                  <option value="VUE">Vue</option>
                  <option value="ACCEPTEE">Acceptee</option>
                  <option value="REFUSEE">Refusee</option>
                </select>
                <textarea placeholder="Commentaire (optionnel)..." rows={3} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} style={{ padding: ".6rem", borderRadius: "8px", border: "1px solid var(--bord)", background: "var(--surface-2)", fontFamily: "inherit" }} />
                <button className="pf-btn pf-btn-primary" onClick={changerStatut} disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer la decision"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
