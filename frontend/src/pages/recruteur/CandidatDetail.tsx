import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth";

interface Filiere { id: number; code: string; intitule: string }
interface ProfilDetail {
  utilisateur: { id: number; nom: string; email: string; creeLe: string };
  profil: {
    niveauEtudes: string | null;
    filiere: Filiere | null;
    etablissement: string | null;
    diplomes: string[];
    competences: string[];
    experience: string | null;
    aCv: boolean;
    cvNom: string | null;
    aPhoto: boolean;
    majLe: string;
  };
}

function initiales(nom: string) {
  return nom.trim().split(/\s+/).map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("") || "?";
}

export default function RecruteurCandidatDetail() {
  const { id } = useParams();
  const { token } = useAuth() as any;
  const [data, setData] = useState<ProfilDetail | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const base = (window as any).__API_BASE__ ?? "";
        const t = localStorage.getItem("insertion.session");
        const tok = t ? JSON.parse(t).token : "";
        const res = await fetch(`/api/profils/${id}`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        setData(await res.json());
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur");
      }
    })();
  }, [id]);

  const tokenFromStorage = () => {
    const t = localStorage.getItem("insertion.session");
    return t ? JSON.parse(t).token : "";
  };

  const urlPhoto = `/api/profils/${id}/photo?token=${encodeURIComponent(tokenFromStorage())}`;
  const urlCv = `/api/profils/${id}/cv?token=${encodeURIComponent(tokenFromStorage())}`;

  if (erreur) {
    return (
      <div>
        <Link to="/recruteur/candidatures" className="pf-back"><span className="pf-back-icon">&larr;</span> Retour aux candidatures</Link>
        <div className="pf-alert pf-alert-error">{erreur}</div>
      </div>
    );
  }
  if (!data) return <p className="muted">Chargement...</p>;

  const { utilisateur, profil } = data;

  return (
    <div>
      <Link to="/recruteur/candidatures" className="pf-back"><span className="pf-back-icon">&larr;</span> Retour aux candidatures</Link>

      <div className="rec-hero" style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
        {profil.aPhoto ? (
          <img
            src={urlPhoto}
            alt={utilisateur.nom}
            style={{ width: 96, height: 96, borderRadius: 24, objectFit: "cover", border: "1px solid var(--bord)" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="rec-avatar rec-avatar-lg">{initiales(utilisateur.nom)}</div>
        )}
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ margin: 0 }}>{utilisateur.nom}</h1>
          <p style={{ margin: ".35rem 0" }}>
            {profil.filiere ? `${profil.filiere.code} - ${profil.filiere.intitule}` : "Filiere non precisee"}
            {profil.niveauEtudes ? ` - ${profil.niveauEtudes}` : ""}
          </p>
          <p style={{ margin: 0, color: "var(--texte-muet)" }}>{utilisateur.email}</p>
        </div>
        {profil.aCv && (
          <a href={urlCv} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-primary">
            Telecharger le CV
          </a>
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