import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import BackButton from "../../components/BackButton";

interface Diplome {
  id: number; nom: string; email: string; creeLe: string;
  profilCandidat: {
    niveauEtudes: string | null;
    filiere: { code: string; intitule: string } | null;
    competences: string[];
    verifie: boolean;
  };
}

export default function RecruteurDecouverte() {
  const [list, setList] = useState<Diplome[] | null>(null);
  const [q, setQ] = useState("");
  const [erreurChargement, setErreurChargement] = useState("");
  const [erreurInvitation, setErreurInvitation] = useState("");

  const charger = useCallback(async () => {
    setList(null);
    setErreurChargement("");
    const url = q ? `/recruteurs/decouvrir?q=${encodeURIComponent(q)}` : "/recruteurs/decouvrir";

    try {
      const resultats = await api<Diplome[]>(url);
      setList(resultats);
    } catch (e) {
      setList(null);
      setErreurChargement(
        e instanceof Error ? e.message : "Impossible de charger les diplômés."
      );
    }
  }, [q]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const rechercher = (e: React.FormEvent) => {
    e.preventDefault();
    charger();
  };

  const inviter = async (id: number) => {
    setErreurInvitation("");
    try {
      await api("/recruteurs/inviter", { method: "POST", body: { diplomeId: id } });
      alert("Invitation envoyée avec succès !");
    } catch (e) {
      setErreurInvitation(
        e instanceof Error ? e.message : "Impossible d'envoyer cette invitation."
      );
    }
  };

  return (
    <div>
      <BackButton />
      <div className="pf-header">
        <div className="pf-header-copy"><h1>Découvrir les diplômés</h1><p>Recherchez des profils correspondant à vos besoins.</p></div>
      </div>

      <form onSubmit={rechercher} className="pf-filters" style={{ marginBottom: "2rem", gridTemplateColumns: "1fr auto" }}>
        <div className="pf-filter">
          <label>Recherche (nom, compétence)</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex: React, Marketing, Rakoto..." />
        </div>
        <div className="pf-filter pf-filter-btn">
          <button type="submit" className="pf-btn pf-btn-primary">Rechercher</button>
        </div>
      </form>

      {erreurChargement && (
        <div className="pf-error" role="alert">
          <p>{erreurChargement}</p>
          <button type="button" className="pf-btn pf-btn-ghost" onClick={() => void charger()}>
            Réessayer
          </button>
        </div>
      )}

      {erreurInvitation && (
        <p className="pf-error" role="alert">{erreurInvitation}</p>
      )}

      {list === null && !erreurChargement && <p className="muted">Chargement...</p>}
      {list !== null && !erreurChargement && list.length === 0 && <p className="empty">Aucun diplômé trouvé.</p>}
      {list !== null && !erreurChargement && list.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {list.map((d) => (
            <div key={d.id} className="pf-offre-card">
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                <div className="rec-avatar">
                  {d.nom.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{d.nom} {d.profilCandidat.verifie && "✅"}</h3>
                  <span style={{ fontSize: ".85rem", color: "var(--texte-muet)" }}>{d.email}</span>
                </div>
              </div>
              <div className="pf-offre-meta" style={{ marginBottom: "1rem" }}>
                {d.profilCandidat.filiere && <span className="pf-chip pf-chip-violet">{d.profilCandidat.filiere.code}</span>}
                {d.profilCandidat.niveauEtudes && <span className="pf-chip pf-chip-cyan">{d.profilCandidat.niveauEtudes}</span>}
              </div>
              <div style={{ fontSize: ".85rem", marginBottom: "1rem" }}>
                <strong>Compétences :</strong> 
                {d.profilCandidat.competences.join(", ") || "Non renseignées"}
              </div>
              <button className="pf-btn pf-btn-primary" style={{ width: "100%" }} onClick={() => inviter(d.id)}>
                Inviter à postuler
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
