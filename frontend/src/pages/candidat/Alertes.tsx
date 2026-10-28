import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api";

interface Filiere { id: number; code: string; intitule: string }
interface Alerte { id: number; nom: string; filiereId: number | null; filiere: Filiere | null; typeContrat: string | null; ville: string | null; motsCles: string | null; active: boolean; }

const TYPES = ["CDI", "CDD", "STAGE", "INDEPENDANT", "OCCASIONNEL"];

export default function CandidatAlertes() {
  const [alertes, setAlertes] = useState<Alerte[] | null>(null);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [filiereId, setFiliereId] = useState("");
  const [typeContrat, setTypeContrat] = useState("");
  const [ville, setVille] = useState("");
  const [motsCles, setMotsCles] = useState("");
  const [saving, setSaving] = useState(false);

  const charger = () => {
    setAlertes(null);
    api<Alerte[]>("/alertes").then(setAlertes).catch(() => setAlertes([]));
  };

  useEffect(() => {
    charger();
    api<Filiere[]>("/filieres").then(setFilieres).catch(() => {});
  }, []);
  const creer = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/alertes", {
        method: "POST",
        body: {
          nom,
          filiereId: filiereId ? Number(filiereId) : undefined,
          typeContrat: typeContrat || undefined,
          ville: ville || undefined,
          motsCles: motsCles || undefined,
        },
      });
      setOpen(false);
      setNom(""); setFiliereId(""); setTypeContrat(""); setVille(""); setMotsCles("");
      charger();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: number, active: boolean) => {
    await api(`/alertes/${id}`, { method: "PATCH", body: { active: !active } }).catch(() => {});
    charger();
  };

  const supprimer = async (id: number) => {
    if (!confirm("Supprimer cette alerte ?")) return;
    await api(`/alertes/${id}`, { method: "DELETE" }).catch(() => {});
    charger();
  };

  const actives = alertes ? alertes.filter((a) => a.active).length : 0;

  return (
    <div>
      <div className="pf-header">
        <div className="pf-header-copy">
          <h1>Mes alertes d offres</h1>
          <p>Recevez une notification des qu une offre correspond a vos criteres.</p>
        </div>
        <div className="pf-header-actions">
          <button className="pf-btn pf-btn-primary" onClick={() => setOpen(true)}>+ Creer une alerte</button>
        </div>
      </div>

      {alertes === null && <p className="muted">Chargement...</p>}

      {alertes !== null && alertes.length === 0 && (
        <div className="alerte-empty">
          <div className="alerte-empty-icon">🔔</div>
          <h3>Aucune alerte</h3>
          <p>Creez votre premiere alerte pour etre notifie des offres qui vous correspondent.</p>
        </div>
      )}

      {alertes !== null && alertes.length > 0 && (
        <div>
          <p style={{ color: "var(--texte-muet)", marginBottom: "1rem", fontSize: ".9rem" }}>
            <strong style={{ color: "var(--fusion-cyan)" }}>{alertes.length}</strong>
            {" alerte(s) - "}
            <strong style={{ color: "var(--fusion-cyan)" }}>{actives}</strong>
            {" active(s)"}
          </p>
          {alertes.map((a) => (
            <div key={a.id} className={`alerte-card ${a.active ? "" : "inactive"}`}>
              <div className="alerte-card-header">
                <div className="alerte-card-title">{a.nom}</div>
                <label className="alerte-switch">
                  <input type="checkbox" checked={a.active} onChange={() => toggle(a.id, a.active)} />
                  <span className="alerte-switch-track" />
                </label>
              </div>
              <div className="alerte-card-meta">
                {a.filiere && <span className="pf-chip pf-chip-cyan">{a.filiere.code}</span>}
                {a.typeContrat && <span className="pf-chip pf-chip-violet">{a.typeContrat}</span>}
                {a.ville && <span className="pf-chip">{a.ville}</span>}
                {a.motsCles && <span className="pf-chip">{a.motsCles}</span>}
              </div>
              <div className="alerte-card-actions">
                <button className="pf-btn pf-btn-ghost" style={{ padding: ".35rem .75rem", fontSize: ".8rem" }} onClick={() => supprimer(a.id)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 100, display: "grid", placeItems: "center", padding: "1rem" }} onClick={() => setOpen(false)}>
          <div className="card" style={{ maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Creer une alerte</h2>
            <form onSubmit={creer} style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
              <label>
                Nom*
                <input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Offres informatique" />
              </label>
              <label>
                Filiere
                <select value={filiereId} onChange={(e) => setFiliereId(e.target.value)}>
                  <option value="">Toutes</option>
                  {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} - {f.intitule}</option>)}
                </select>
              </label>
              <label>
                Type de contrat
                <select value={typeContrat} onChange={(e) => setTypeContrat(e.target.value)}>
                  <option value="">Tous</option>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>
                Ville
                <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ex: Antananarivo" />
              </label>
              <label>
                Mots-cles
                <input value={motsCles} onChange={(e) => setMotsCles(e.target.value)} placeholder="Ex: React, data" />
              </label>
              <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                <button type="button" className="pf-btn pf-btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
                <button type="submit" className="pf-btn pf-btn-primary" disabled={saving}>{saving ? "..." : "Creer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
