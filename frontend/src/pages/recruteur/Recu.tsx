import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Candidature } from "../../api";
import { useI18n } from "../../i18n";

const STATUTS = [
  { key: "", label: "Toutes" },
  { key: "ENVOYEE", label: "Envoyees" },
  { key: "VUE", label: "Vues" },
  { key: "ACCEPTEE", label: "Acceptees" },
  { key: "REFUSEE", label: "Refusees" },
];

const LABEL: Record<string, string> = {
  ENVOYEE: "Envoyee", VUE: "Vue", ACCEPTEE: "Acceptee", REFUSEE: "Refusee",
};

function initiales(nom: string) {
  return nom.trim().split(/\s+/).map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("") || "?";
}

export default function RecruteurRecu() {
  const { t } = useI18n();
  const [all, setAll] = useState<Candidature[] | null>(null);
  const [filtre, setFiltre] = useState("");

  const charger = () => {
    setAll(null);
    api<Candidature[]>("/recruteur/candidatures").then(setAll).catch(() => setAll([]));
  };
  useEffect(charger, []);

  const filtered = useMemo(() => {
    if (!all) return null;
    if (!filtre) return all;
    return all.filter((c) => c.statut === filtre);
  }, [all, filtre]);

  const changerStatut = async (id: number, statut: string) => {
    try {
      await api(`/candidatures/${id}/statut`, { method: "PATCH", body: { statut } });
      charger();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <div>
      <div className="pf-header">
        <div className="pf-header-copy">
          <h1>Candidatures recues</h1>
          <p>Suivez les candidatures et mettez a jour leur statut.</p>
        </div>
      </div>

      <div className="rec-filters">
        {STATUTS.map((s) => (
          <button
            key={s.key}
            className={`rec-filter-chip ${filtre === s.key ? "active" : ""}`}
            onClick={() => setFiltre(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {all === null && <p className="muted">{t("common.loading")}</p>}
      {all !== null && all.length === 0 && (
        <div className="pf-empty">
          <div className="pf-empty-icon">📭</div>
          <h3>Aucune candidature</h3>
          <p>Vos candidatures recues apparaitront ici.</p>
        </div>
      )}
      {filtered !== null && filtered.length === 0 && all !== null && all.length > 0 && (
        <p className="empty">Aucune candidature dans ce filtre.</p>
      )}
      {filtered !== null && filtered.length > 0 && (
        <div className="rec-list">
          {filtered.map((c) => (
            <div key={c.id} className="rec-item">
              <div className="rec-avatar">{initiales(c.candidat.nom)}</div>
              <div className="rec-item-body">
                <div className="rec-item-title">{c.candidat.nom}</div>
                <div className="rec-item-meta">
                  {c.offre.titre} - {new Date(c.dateEnvoi).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
                <span className="pf-chip pf-chip-cyan">{LABEL[c.statut] ?? c.statut}</span>
                <Link to={`/recruteur/candidat/${c.candidat.id}`} className="pf-btn" style={{ padding: ".4rem .8rem", fontSize: ".8rem" }}>
                  Voir profil
                </Link>
                <select
                  value={c.statut}
                  onChange={(e) => changerStatut(c.id, e.target.value)}
                  style={{ padding: ".4rem .6rem", borderRadius: 8, border: "1px solid var(--bord)", background: "var(--surface-2)", color: "var(--texte)", fontSize: ".82rem" }}
                >
                  {["ENVOYEE", "VUE", "ACCEPTEE", "REFUSEE"].map((s) => (
                    <option key={s} value={s}>{LABEL[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}