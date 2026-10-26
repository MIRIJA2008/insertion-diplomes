import { useEffect, useMemo, useState } from "react";
import { api, type Candidature } from "../../api";
import { useI18n } from "../../i18n";

const STATUTS = [
  { key: "", label: "Toutes" },
  { key: "ENVOYEE", label: "Envoyees" },
  { key: "VUE", label: "Vues" },
  { key: "ACCEPTEE", label: "Acceptees" },
  { key: "REFUSEE", label: "Refusees" },
];

const STATUT_LABEL: Record<string, string> = {
  ENVOYEE: "Envoyee", VUE: "Vue", ACCEPTEE: "Acceptee", REFUSEE: "Refusee",
};

const STATUT_ORDER: Record<string, number> = {
  ENVOYEE: 1, VUE: 2, ACCEPTEE: 3, REFUSEE: 3,
};

function badgeClass(statut: string) {
  const s = statut.toLowerCase();
  if (s === "acceptee") return "cand-badge cand-badge-acceptee";
  if (s === "refusee") return "cand-badge cand-badge-refusee";
  if (s === "vue") return "cand-badge cand-badge-vue";
  return "cand-badge cand-badge-envoyee";
}

function etapesAtteintes(statut: string) {
  return STATUT_ORDER[statut] ?? 1;
}

function Timeline({ statut }: { statut: string }) {
  const n = etapesAtteintes(statut);
  return (
    <div className="cand-timeline">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`cand-timeline-step ${i <= n ? "done" : ""}`} />
      ))}
    </div>
  );
}

export default function CandidatSuivi() {
  const { t } = useI18n();
  const [all, setAll] = useState<Candidature[] | null>(null);
  const [filtre, setFiltre] = useState("");

  useEffect(() => {
    api<Candidature[]>("/mes-candidatures").then(setAll).catch(() => setAll([]));
  }, []);

  const filtered = useMemo(() => {
    if (!all) return null;
    if (!filtre) return all;
    return all.filter((c) => c.statut === filtre);
  }, [all, filtre]);

  const stats = useMemo(() => {
    if (!all) return { total: 0, envoyees: 0, vues: 0, acceptees: 0, refusees: 0 };
    return {
      total: all.length,
      envoyees: all.filter((c) => c.statut === "ENVOYEE").length,
      vues: all.filter((c) => c.statut === "VUE").length,
      acceptees: all.filter((c) => c.statut === "ACCEPTEE").length,
      refusees: all.filter((c) => c.statut === "REFUSEE").length,
    };
  }, [all]);

  return (
    <div>
      <div className="pf-header">
        <div className="pf-header-copy">
          <h1>Mes candidatures</h1>
          <p>Suivez l evolution de vos candidatures envoyees.</p>
        </div>
      </div>

      {all !== null && all.length > 0 && (
        <div className="cand-stats" style={{ marginBottom: "1.5rem" }}>
          <div className="cand-stat">
            <div className="cand-stat-label">Total</div>
            <div className="cand-stat-value">{stats.total}</div>
          </div>
          <div className="cand-stat">
            <div className="cand-stat-label">En attente</div>
            <div className="cand-stat-value">{stats.envoyees + stats.vues}</div>
          </div>
          <div className="cand-stat">
            <div className="cand-stat-label">Acceptees</div>
            <div className="cand-stat-value" style={{ color: "#34d399" }}>{stats.acceptees}</div>
          </div>
          <div className="cand-stat">
            <div className="cand-stat-label">Refusees</div>
            <div className="cand-stat-value" style={{ color: "#fb7185" }}>{stats.refusees}</div>
          </div>
        </div>
      )}

      <div className="cand-tabs">
        {STATUTS.map((s) => (
          <button
            key={s.key}
            className={`cand-tab ${filtre === s.key ? "active" : ""}`}
            onClick={() => setFiltre(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {all === null && <p className="muted">{t("common.loading")}</p>}
      {all !== null && all.length === 0 && (
        <div className="pf-empty">
          <div className="pf-empty-icon">📝</div>
          <h3>Aucune candidature pour le moment</h3>
          <p>Explorez les offres et postulez a celles qui vous correspondent.</p>
          <a href="/offres" className="pf-btn pf-btn-primary">Explorer les offres</a>
        </div>
      )}
      {filtered !== null && filtered.length === 0 && all !== null && all.length > 0 && (
        <p className="empty">Aucune candidature dans ce filtre.</p>
      )}
      {filtered !== null && filtered.length > 0 && (
        <div className="cand-list">
          {filtered.map((c: any) => (
            <div key={c.id} className="cand-item">
              <div className="rec-avatar" style={{ background: "linear-gradient(135deg, var(--fusion-cyan), var(--fusion-violet))" }}>
                {(c.offre?.titre ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="cand-item-body">
                <div className="cand-item-title">{c.offre?.titre ?? "Offre"}</div>
                <div className="cand-item-meta">
                  {c.offre?.organisme?.nom ?? "-"} - {c.offre?.lieu ?? ""} - envoyee le {new Date(c.dateEnvoi).toLocaleDateString("fr-FR")}
                </div>
                <Timeline statut={c.statut} />
              </div>
              <span className={badgeClass(c.statut)}>{STATUT_LABEL[c.statut] ?? c.statut}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}