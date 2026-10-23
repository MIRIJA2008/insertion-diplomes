import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, type Offre } from "../../api";
import { useI18n } from "../../i18n";

const TYPE_LABEL: Record<string, string> = {
  CDI: "CDI", CDD: "CDD", STAGE: "Stage", INDEPENDANT: "Independant", OCCASIONNEL: "Occasionnel",
};

interface Filiere { id: number; code: string; intitule: string }

export default function RecruteurMesOffres() {
  const { t } = useI18n();
  const [offres, setOffres] = useState<Offre[] | null>(null);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titre: "", description: "", lieu: "", typeContrat: "CDI",
    niveauRequis: "", filiereId: "", profilRecherche: "",
    competences: "", dateLimite: "",
  });
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setOffres(null);
    api<Offre[]>("/offres/recruteur/mes-offres").then(setOffres).catch(() => setOffres([]));
  };
  useEffect(() => {
    charger();
    api<Filiere[]>("/filieres").then(setFilieres).catch(() => {});
  }, []);

  const creer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    try {
      await api("/offres", {
        method: "POST",
        body: {
          titre: form.titre,
          description: form.description,
          lieu: form.lieu,
          typeContrat: form.typeContrat || undefined,
          niveauRequis: form.niveauRequis || undefined,
          filiereId: form.filiereId ? Number(form.filiereId) : undefined,
          profilRecherche: form.profilRecherche || undefined,
          competencesRecherchees: form.competences.split(",").map((s) => s.trim()).filter(Boolean),
          dateLimite: new Date(form.dateLimite).toISOString(),
        },
      });
      setOpen(false);
      setForm({ titre: "", description: "", lieu: "", typeContrat: "CDI", niveauRequis: "", filiereId: "", profilRecherche: "", competences: "", dateLimite: "" });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    }
  };

  const cloturer = async (id: number) => {
    if (!confirm("Cloturer cette offre ?")) return;
    await api(`/offres/${id}`, { method: "PUT", body: { statut: "CLOTUREE" } }).catch(() => {});
    charger();
  };

  return (
    <div>
      <div className="pf-header">
        <div className="pf-header-copy">
          <h1>Mes offres</h1>
          <p>Gerez vos offres d emploi publiees.</p>
        </div>
        <div className="pf-header-actions">
          <button className="pf-btn pf-btn-primary" onClick={() => setOpen(true)}>+ Publier une offre</button>
        </div>
      </div>

      {offres === null && <p className="muted">{t("common.loading")}</p>}
      {offres !== null && offres.length === 0 && (
        <div className="pf-empty">
          <div className="pf-empty-icon">📝</div>
          <h3>Aucune offre publiee</h3>
          <p>Publiez votre premiere offre pour attirer des candidats.</p>
          <button className="pf-btn pf-btn-primary" onClick={() => setOpen(true)}>Creer une offre</button>
        </div>
      )}
      {offres !== null && offres.length > 0 && (
        <div className="pf-offres-grid">
          {offres.map((o) => (
            <div key={o.id} className="pf-offre-card">
              <div className="pf-offre-meta">
                {o.typeContrat && <span className="pf-chip pf-chip-violet">{TYPE_LABEL[o.typeContrat] ?? o.typeContrat}</span>}
                {o.filiere && <span className="pf-chip pf-chip-cyan">{o.filiere.code}</span>}
                <span className="pf-chip">{o.statut === "CLOTUREE" ? "Cloturee" : "Ouverte"}</span>
              </div>
              <h3>{o.titre}</h3>
              <p className="pf-desc">{o.description}</p>
              <div className="pf-offre-footer">
                <span>{o.lieu} - {o.nbCandidatures} cand.</span>
              </div>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: ".5rem" }}>
                <Link to={`/offres/${o.id}`} className="pf-btn" style={{ padding: ".4rem .8rem", fontSize: ".8rem" }}>Voir</Link>
                <Link to="/recruteur/candidatures" className="pf-btn" style={{ padding: ".4rem .8rem", fontSize: ".8rem" }}>Candidatures</Link>
                {o.statut !== "CLOTUREE" && (
                  <button className="pf-btn pf-btn-ghost" style={{ padding: ".4rem .8rem", fontSize: ".8rem" }} onClick={() => cloturer(o.id)}>Cloturer</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", backdropFilter: "blur(4px)", zIndex: 100, display: "grid", placeItems: "center", padding: "1rem" }}
             onClick={() => setOpen(false)}>
          <div className="card" style={{ maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Publier une offre</h2>
            <form onSubmit={creer} style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
              <label>Titre*<input required value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></label>
              <label>Description*<textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
              <label>Lieu*<input required value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} placeholder="Antananarivo" /></label>
              <label>Type de contrat
                <select value={form.typeContrat} onChange={(e) => setForm({ ...form, typeContrat: e.target.value })}>
                  {["CDI","CDD","STAGE","INDEPENDANT","OCCASIONNEL"].map((c) => <option key={c} value={c}>{TYPE_LABEL[c]}</option>)}
                </select>
              </label>
              <label>Niveau requis<input value={form.niveauRequis} onChange={(e) => setForm({ ...form, niveauRequis: e.target.value })} /></label>
              <label>Filiere
                <select value={form.filiereId} onChange={(e) => setForm({ ...form, filiereId: e.target.value })}>
                  <option value="">-</option>
                  {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} - {f.intitule}</option>)}
                </select>
              </label>
              <label>Profil recherche<input value={form.profilRecherche} onChange={(e) => setForm({ ...form, profilRecherche: e.target.value })} /></label>
              <label>Competences (separees par virgule)<input value={form.competences} onChange={(e) => setForm({ ...form, competences: e.target.value })} placeholder="React, Node.js..." /></label>
              <label>Date limite*<input required type="date" value={form.dateLimite} onChange={(e) => setForm({ ...form, dateLimite: e.target.value })} /></label>
              {erreur && <div className="pf-alert pf-alert-error">{erreur}</div>}
              <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                <button type="button" className="pf-btn pf-btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
                <button type="submit" className="pf-btn pf-btn-primary">Publier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}