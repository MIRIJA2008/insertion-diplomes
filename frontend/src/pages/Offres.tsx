import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api, type Offre } from "../api";
import { useI18n } from "../i18n";
import OffreCard from "../components/OffreCard";

interface Filiere { id: number; code: string; intitule: string }

export default function Offres() {
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

  const filtrer = (e: FormEvent) => {
    e.preventDefault();
    charger();
  };

  return (
    <section>
      <h2>{t("nav.offers")}</h2>
      <form className="card filters" onSubmit={filtrer} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div>
          <label>{t("common.search")}</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("home.searchPlaceholder")} />
        </div>
        <div>
          <label>{t("offer.filterCity")}</label>
          <input value={ville} onChange={(e) => setVille(e.target.value)} />
        </div>
        <div>
          <label>{t("offer.filterContract")}</label>
          <select value={typeContrat} onChange={(e) => setTypeContrat(e.target.value)}>
            <option value="">{t("common.all")}</option>
            {["CDI", "CDD", "STAGE", "INDEPENDANT", "OCCASIONNEL"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>{t("offer.filterField")}</label>
          <select value={filiereId} onChange={(e) => setFiliereId(e.target.value)}>
            <option value="">{t("common.all")}</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} - {f.intitule}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button type="submit">{t("common.search")}</button>
        </div>
      </form>

      {offres === null && <p className="muted">{t("common.loading")}</p>}
      {offres !== null && offres.length === 0 && <p className="empty">{t("common.none")}</p>}
      {offres !== null && offres.length > 0 && (
        <div className="grille">
          {offres.map((o) => <OffreCard key={o.id} offre={o} />)}
        </div>
      )}
    </section>
  );
}