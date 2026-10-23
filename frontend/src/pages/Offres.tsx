import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type Offre } from "../api";
import { useI18n } from "../i18n";
import PublicNav from "../components/PublicNav";
import PageHeader from "../components/PageHeader";

interface Filiere { id: number; code: string; intitule: string }

const TYPE_LABEL: Record<string, string> = {
  CDI: "CDI", CDD: "CDD", STAGE: "Stage",
  INDEPENDANT: "Independant", OCCASIONNEL: "Occasionnel",
};

if (user) {
    return <AppLayout><div className="pf-container" style={{ paddingTop: "2rem" }}><OffresInner /></div></AppLayout>;
  }
  return <OffresInner />;
}

function OffresInner() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [offres, setOffres] = useState<Offre[] | null>(null);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [ville, setVille] = useState(params.get("ville") ?? "");
  const [typeContrat, setTypeContrat] = useState(params.get("typeContrat") ?? "");
  const [filiereId, setFiliereId] = useState(params.get("filiereId") ?? "");

  useEffect(() => {
    api<Filiere[]>("/filieres").then(setFilieres).catch(() => {});
  }, []);

  const charger = () => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (ville) p.set("ville", ville);
    if (typeContrat) p.set("typeContrat", typeContrat);
    if (filiereId) p.set("filiereId", filiereId);
    setParams(p);
    setOffres(null);
    api<Offre[]>(`/offres?${p.toString()}`).then(setOffres).catch(() => setOffres([]));
  };

  useEffect(charger, []);

  const filtrer = (e: FormEvent) => { e.preventDefault(); charger(); };
  const reinit = () => {
    setQ(""); setVille(""); setTypeContrat(""); setFiliereId("");
    setParams(new URLSearchParams());
    setOffres(null);
    api<Offre[]>("/offres").then(setOffres).catch(() => setOffres([]));
  };

  return (
    <div className="pf-page">
      <PublicNav />
      <div className="pf-container">
        <PageHeader title={t("nav.offers")} subtitle="Trouvez l opportunite qui correspond a votre parcours" backTo="/" backLabel="Accueil" />

        <form className="pf-filters" onSubmit={filtrer}>
          <div className="pf-filter"><label>{t("common.search")}</label><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mot-cle..." /></div>
          <div className="pf-filter"><label>{t("offer.filterCity")}</label><input value={ville} onChange={(e) => setVille(e.target.value)} /></div>
          <div className="pf-filter"><label>{t("offer.filterContract")}</label><select value={typeContrat} onChange={(e) => setTypeContrat(e.target.value)}><option value="">{t("common.all")}</option>{["CDI","CDD","STAGE","INDEPENDANT","OCCASIONNEL"].map((c) => <option key={c} value={c}>{TYPE_LABEL[c] ?? c}</option>)}</select></div>
          <div className="pf-filter"><label>{t("offer.filterField")}</label><select value={filiereId} onChange={(e) => setFiliereId(e.target.value)}><option value="">{t("common.all")}</option>{filieres.map((f) => <option key={f.id} value={f.id}>{f.code} - {f.intitule}</option>)}</select></div>
          <div className="pf-filter pf-filter-btn"><button type="submit" className="pf-btn pf-btn-primary">{t("common.search")}</button></div>
        </form>

        {offres === null && (<div className="pf-offres-grid">{[1,2,3,4,5,6].map((i) => <div key={i} className="pf-skeleton" />)}</div>)}
        {offres !== null && offres.length === 0 && (
          <div className="pf-empty"><div className="pf-empty-icon">📭</div><h3>Aucune offre</h3><p>Essayez d elargir vos criteres.</p><button className="pf-btn pf-btn-ghost" onClick={reinit}>Reinitialiser</button></div>
        )}
        {offres !== null && offres.length > 0 && (
          <>
            <p style={{ color: "var(--texte-muet)", margin: "0 0 1.25rem", fontSize: ".9rem" }}><strong style={{ color: "var(--fusion-cyan)" }}>{offres.length}</strong> offre{offres.length > 1 ? "s" : ""}</p>
            <div className="pf-offres-grid">
              {offres.map((o) => (
                <Link key={o.id} to={`/offres/${o.id}`} className="pf-offre-card">
                  <div className="pf-offre-meta">
                    {o.typeContrat && <span className="pf-chip pf-chip-violet">{TYPE_LABEL[o.typeContrat] ?? o.typeContrat}</span>}
                    {o.filiere && <span className="pf-chip pf-chip-cyan">{o.filiere.code}</span>}
                    <span className="pf-chip">{o.statut === "CLOTUREE" ? "Cloturee" : "Ouverte"}</span>
                  </div>
                  <h3>{o.titre}</h3>
                  <p className="pf-org">{o.organisme.nom}{o.organisme.ville ? ` - ${o.organisme.ville}` : ""}</p>
                  <p className="pf-desc">{o.description}</p>
                  <div className="pf-offre-footer"><span>{o.lieu} - Limite {new Date(o.dateLimite).toLocaleDateString("fr-FR")}</span><span className="pf-arrow">Voir &rarr;</span></div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}