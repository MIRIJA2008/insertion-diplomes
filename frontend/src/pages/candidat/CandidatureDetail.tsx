import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../auth";

interface HistoriqueItem {
  id: number;
  ancienStatut: string | null;
  nouveauStatut: string;
  commentaire: string | null;
  creeLe: string;
  auteur: { id: number; nom: string };
}

interface CandidatureDetail {
  id: number;
  statut: string;
  lettre: string | null;
  dateEnvoi: string;
  offre: {
    id: number;
    titre: string;
    lieu: string;
    typeContrat: string | null;
    dateLimite: string;
    organisme: { nom: string; ville: string | null };
  };
  candidat: {
    id: number;
    nom: string;
    email: string;
    profilCandidat: { filiere: { code: string; intitule: string } | null } | null;
  };
  historique: HistoriqueItem[];
}

const STATUT_LABEL: Record<string, string> = {
  ENVOYEE: "Envoyee", VUE: "Vue", ACCEPTEE: "Acceptee", REFUSEE: "Refusee",
};

const STATUTS_RECRUTEUR = ["ENVOYEE", "VUE", "ACCEPTEE", "REFUSEE"];

function badgeClass(statut: string) {
  const s = statut.toLowerCase();
  if (s === "acceptee") return "cand-badge cand-badge-acceptee";
  if (s === "refusee") return "cand-badge cand-badge-refusee";
  if (s === "vue") return "cand-badge cand-badge-vue";
  return "cand-badge cand-badge-envoyee";
}

function prochainesEtapes(statut: string) {
  switch (statut) {
    case "ENVOYEE":
      return {
        icon: "⏳",
        titre: "En attente de consultation",
        texte: "Le recruteur n'a pas encore consulte votre candidature. Vous serez notifie des qu'il y aura du nouveau.",
      };
    case "VUE":
      return {
        icon: "👀",
        titre: "Candidature consultee",
        texte: "Le recruteur a vu votre profil. Preparez vos arguments et restez disponible pour un entretien.",
      };
    case "ACCEPTEE":
      return {
        icon: "🎉",
        titre: "Candidature acceptee",
        texte: "Felicitations ! Le recruteur va vous contacter prochainement pour la suite du processus.",
      };
    case "REFUSEE":
      return {
        icon: "💪",
        titre: "Candidature non retenue",
        texte: "Ne vous decouragez pas. Explorez d'autres offres et continuez a enrichir votre profil.",
      };
    default:
      return { icon: "📄", titre: "Statut", texte: "En cours de traitement." };
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function CandidatureDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<CandidatureDetail | null>(null);
  const [erreur, setErreur] = useState("");
  const [statutEdit, setStatutEdit] = useState("");
  const [commentaireEdit, setCommentaireEdit] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isRecruteur = user?.role === "RECRUTEUR" || user?.role === "ADMIN";
  const isCandidat = user?.role === "CANDIDAT";
  const retourTo = isRecruteur ? "/recruteur/candidatures" : "/candidat/candidatures";
  const retourLabel = isRecruteur ? "Retour aux candidatures recues" : "Retour a mes candidatures";

  const charger = () => {
    api<CandidatureDetail>(`/candidatures/${id}`)
      .then((d) => {
        setData(d);
        setStatutEdit(d.statut);
      })
      .catch((e) => setErreur(e.message));
  };

  useEffect(charger, [id]);

  const changerStatut = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api(`/candidatures/${id}/statut`, {
        method: "PATCH",
        body: { statut: statutEdit, commentaire: commentaireEdit || undefined },
      });
      setMessage("Statut mis a jour");
      setCommentaireEdit("");
      charger();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const retirerCandidature = async () => {
    if (!confirm("Retirer definitivement cette candidature ?")) return;
    try {
      await api(`/mes-candidatures/${id}`, { method: "DELETE" });
      window.location.href = "/candidat/candidatures";
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  };

  if (erreur) {
    return (
      <div>
        <Link to={retourTo} className="pf-back"><span className="pf-back-icon">&larr;</span> {retourLabel}</Link>
        <div className="pf-alert pf-alert-error">{erreur}</div>
      </div>
    );
  }
  if (!data) return <p className="muted">Chargement...</p>;

  const next = prochainesEtapes(data.statut);

  return (
    <div>
      <Link to={retourTo} className="pf-back"><span className="pf-back-icon">&larr;</span> {retourLabel}</Link>

      <div className="cand-detail-grid">
        {/* Colonne principale */}
        <div className="cand-detail-main">
          <div className="cand-detail-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <h1>{data.offre.titre}</h1>
                <div className="cand-detail-org">
                  {data.offre.organisme.nom}
                  {data.offre.organisme.ville ? ` - ${data.offre.organisme.ville}` : ""}
                </div>
              </div>
              <span className={badgeClass(data.statut)}>{STATUT_LABEL[data.statut] ?? data.statut}</span>
            </div>
            <div className="cand-detail-meta">
              <span><strong>Lieu :</strong> {data.offre.lieu}</span>
              {data.offre.typeContrat && <span><strong>Contrat :</strong> {data.offre.typeContrat}</span>}
              <span><strong>Envoyee le :</strong> {formatDate(data.dateEnvoi)}</span>
            </div>
          </div>

          {/* Candidat */}
          {isRecruteur && (
            <div className="cand-detail-card">
              <h3>Candidat</h3>
              <p><strong>{data.candidat.nom}</strong></p>
              <p>{data.candidat.email}</p>
              {data.candidat.profilCandidat?.filiere && (
                <p>{data.candidat.profilCandidat.filiere.code} - {data.candidat.profilCandidat.filiere.intitule}</p>
              )}
              <Link to={`/recruteur/candidat/${data.candidat.id}`} className="pf-btn" style={{ marginTop: ".5rem" }}>
                Voir le profil complet
              </Link>
            </div>
          )}

          {/* Lettre */}
          <div className="cand-detail-card">
            <h3>Lettre de motivation</h3>
            {data.lettre ? (
              <div className="cand-lettre">{data.lettre}</div>
            ) : (
              <p className="muted">Aucune lettre de motivation fournie.</p>
            )}
          </div>

          {/* Historique */}
          <div className="cand-detail-card">
            <h3>Historique</h3>
            {data.historique.length === 0 ? (
              <p className="muted">Aucun historique disponible.</p>
            ) : (
              <div className="cand-timeline-v">
                {data.historique.map((h, i) => (
                  <div key={h.id} className={`cand-timeline-v-item ${i === 0 ? "current" : ""}`}>
                    <div className="cand-timeline-v-date">{formatDate(h.creeLe)}</div>
                    <div className="cand-timeline-v-title">
                      {h.ancienStatut ? `${STATUT_LABEL[h.ancienStatut] ?? h.ancienStatut} → ` : ""}
                      {STATUT_LABEL[h.nouveauStatut] ?? h.nouveauStatut}
                    </div>
                    {h.commentaire && <div className="cand-timeline-v-comment">{h.commentaire}</div>}
                    <div className="cand-timeline-v-author">par {h.auteur.nom}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne laterale */}
        <div className="cand-detail-side">
          <div className="cand-next-step">
            <div className="cand-next-step-icon">{next.icon}</div>
            <div className="cand-next-step-title">{next.titre}</div>
            <div className="cand-next-step-text">{next.texte}</div>
          </div>

          {/* Actions recruteur */}
          {isRecruteur && (
            <div className="cand-detail-card">
              <h3>Decisions</h3>
              <div className="cand-detail-actions">
                <label>
                  Nouveau statut
                  <select value={statutEdit} onChange={(e) => setStatutEdit(e.target.value)}>
                    {STATUTS_RECRUTEUR.map((s) => (
                      <option key={s} value={s}>{STATUT_LABEL[s]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Commentaire (optionnel)
                  <textarea
                    rows={3}
                    value={commentaireEdit}
                    onChange={(e) => setCommentaireEdit(e.target.value)}
                    placeholder="Raison du changement, note interne..."
                  />
                </label>
                <button className="pf-btn pf-btn-primary" onClick={changerStatut} disabled={saving || statutEdit === data.statut}>
                  {saving ? "Enregistrement..." : "Enregistrer la decision"}
                </button>
                {message && <div className={`pf-alert ${message.includes("mis a jour") ? "pf-alert-success" : "pf-alert-error"}`}>{message}</div>}
              </div>
            </div>
          )}

          {/* Actions candidat */}
          {isCandidat && (data.statut === "ENVOYEE" || data.statut === "VUE") && (
            <div className="cand-detail-card">
              <h3>Actions</h3>
              <button className="pf-btn pf-btn-ghost" onClick={retirerCandidature}>
                Retirer ma candidature
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}