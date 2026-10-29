import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api";

interface ProfilDetail {
  utilisateur: { id: number; nom: string; email: string };
  profil: {
    niveauEtudes: string | null;
    filiere: { code: string; intitule: string } | null;
    etablissement: string | null;
    diplomes: string[];
    competences: string[];
    experience: string | null;
    aCv: boolean;
    cvNom: string | null;
    aPhoto: boolean;
  };
}

function initiales(nom: string) {
  return nom.trim().split(/\s+/).map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("") || "?";
}

export default function RecruteurCandidatDetail() {
  const { id } = useParams();
  const [data, setData] = useState<ProfilDetail | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    // Utilisation de api() qui gère automatiquement le token
    api<ProfilDetail>(`/profils/${id}`)
      .then(setData)
      .catch((e) => setErreur(e.message));
  }, [id]);

  if (erreur) return (
    <div>
      <Link to="/recruteur/candidatures" className="pf-back"><span className="pf-back-icon">&larr;</span> Retour</Link>
      <div className="pf-alert pf-alert-error">{erreur}</div>
    </div>
  );

  if (!data) return <p className="muted">Chargement...</p>;

  const { utilisateur, profil } = data;

  return (
    <div>
      <Link to="/recruteur/candidatures" className="pf-back"><span className="pf-back-icon">&larr;</span> Retour aux candidatures</Link>

      <div className="rec-hero" style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <div className="rec-avatar rec-avatar-lg">
          {initiales(utilisateur.nom)}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ margin: 0 }}>{utilisateur.nom}</h1>
          <p style={{ margin: ".35rem 0" }}>
            {profil.filiere ? `${profil.filiere.code} - ${profil.filiere.intitule}` : "Filiere non precisee"}
            {profil.niveauEtudes ? ` - ${profil.niveauEtudes}` : ""}
          </p>
          <p style={{ margin: 0, color: "var(--texte-muet)" }}>{utilisateur.email}</p>
        </div>
        {profil.aCv && (
          <button className="pf-btn pf-btn-primary" onClick={() => alert("Le telechargement du CV necessite la route /cv (a faire si besoin)")}>
            Telecharger le CV
          </button>
        )}
      </div>

      <div className="rec-profile-card">
        <h3>Formation</h3>
        {profil.etablissement && <p><strong>Etablissement :</strong> {profil.etablissement}</p>}
        {profil.niveauEtudes && <p><strong>Niveau :</strong> {profil.niveauEtudes}</p>}
        {profil.diplomes.length > 0 ? (
          <div>
            <p><strong>Diplomes :</strong></p>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--texte-muet)" }}>
              {profil.diplomes.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        ) : <p className="muted">Aucun diplome renseigne.</p>}
      </div>

      <div className="rec-profile-card">
        <h3>Competences</h3>
        {profil.competences.length === 0 && <p className="muted">Aucune competence renseignee.</p>}
        {profil.competences.length > 0 && (
          <div className="rec-skill-list">
            {profil.competences.map((c, i) => <span key={i} className="pf-chip pf-chip-cyan">{c}</span>)}
          </div>
        )}
      </div>

      <div className="rec-profile-card">
        <h3>Experience</h3>
        {profil.experience ? <p style={{ whiteSpace: "pre-line" }}>{profil.experience}</p> : <p className="muted">Aucune experience renseignee.</p>}
      </div>
    </div>
  );
}
