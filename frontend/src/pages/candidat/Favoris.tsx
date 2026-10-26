import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useI18n } from "../../i18n";

interface FavoriItem {
  id: number;
  offre: {
    id: number;
    titre: string;
    description: string;
    lieu: string;
    typeContrat: string | null;
    dateLimite: string;
    organisme: { nom: string; ville: string | null };
    filiere?: { code: string; intitule: string } | null;
  };
}

const TYPE_LABEL: Record<string, string> = {
  CDI: "CDI", CDD: "CDD", STAGE: "Stage", INDEPENDANT: "Independant", OCCASIONNEL: "Occasionnel",
};

export default function CandidatFavoris() {
  const { t } = useI18n();
  const [favoris, setFavoris] = useState<FavoriItem[] | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);

  const charger = () => {
    setFavoris(null);
    api<FavoriItem[]>("/mes-favoris").then(setFavoris).catch(() => setFavoris([]));
  };

  useEffect(charger, []);

  const retirer = async (offreId: number) => {
    setEnCours(offreId);
    try {
      await api(`/offres/${offreId}/favori`, { method: "PUT" });
      charger();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div>
      <div className="pf-header">
        <div className="pf-header-copy">
          <h1>Mes favoris</h1>
          <p>Les offres que vous avez sauvegardees pour y revenir plus tard.</p>
        </div>
      </div>

      {favoris === null && <p className="muted">{t("common.loading")}</p>}
      {favoris !== null && favoris.length === 0 && (
        <div className="pf-empty">
          <div className="pf-empty-icon">⭐</div>
          <h3>Aucun favori pour le moment</h3>
          <p>Cliquez sur l etoile d une offre pour la sauvegarder ici.</p>
          <Link to="/offres" className="pf-btn pf-btn-primary">Explorer les offres</Link>
        </div>
      )}
      {favoris !== null && favoris.length > 0 && (
        <>
          <p style={{ color: "var(--texte-muet)", marginBottom: "1rem", fontSize: ".9rem" }}>
            <strong style={{ color: "var(--fusion-cyan)" }}>{favoris.length}</strong> offre{favoris.length > 1 ? "s" : ""} en favori
          </p>
          <div className="pf-offres-grid">
            {favoris.map((f) => (
              <div key={f.id} className="pf-offre-card">
                <div className="pf-offre-meta">
                  {f.offre.typeContrat && (
                    <span className="pf-chip pf-chip-violet">{TYPE_LABEL[f.offre.typeContrat] ?? f.offre.typeContrat}</span>
                  )}
                  {f.offre.filiere && <span className="pf-chip pf-chip-cyan">{f.offre.filiere.code}</span>}
                </div>
                <h3>{f.offre.titre}</h3>
                <p className="pf-org">
                  {f.offre.organisme.nom}
                  {f.offre.organisme.ville ? ` - ${f.offre.organisme.ville}` : ""}
                </p>
                <p className="pf-desc">{f.offre.description}</p>
                <div className="pf-offre-footer">
                  <span>{f.offre.lieu} - Limite {new Date(f.offre.dateLimite).toLocaleDateString("fr-FR")}</span>
                </div>
                <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem", flexWrap: "wrap" }}>
                  <Link to={`/offres/${f.offre.id}`} className="pf-btn" style={{ padding: ".4rem .8rem", fontSize: ".8rem" }}>
                    Voir l offre
                  </Link>
                  <button
                    className="pf-btn pf-btn-ghost"
                    style={{ padding: ".4rem .8rem", fontSize: ".8rem" }}
                    onClick={() => retirer(f.offre.id)}
                    disabled={enCours === f.offre.id}
                  >
                    {enCours === f.offre.id ? "Retrait..." : "Retirer des favoris"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}