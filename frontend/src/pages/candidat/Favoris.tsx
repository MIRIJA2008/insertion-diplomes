import { useEffect, useState } from "react";
import { api, type Offre } from "../../api";
import { useI18n } from "../../i18n";
import OffreCard from "../../components/OffreCard";

interface Favori { id: number; offre: Offre }

export default function CandidatFavoris() {
  const { t } = useI18n();
  const [liste, setListe] = useState<Favori[] | null>(null);

  useEffect(() => {
    api<Favori[]>("/mes-favoris").then(setListe).catch(() => setListe([]));
  }, []);

  return (
    <section>
      <h2>{t("cand.myFavorites")}</h2>
      {liste === null && <p className="muted">{t("common.loading")}</p>}
      {liste !== null && liste.length === 0 && <p className="empty">{t("common.none")}</p>}
      {liste !== null && liste.length > 0 && (
        <div className="grille">
          {liste.map((f) => <OffreCard key={f.id} offre={f.offre} />)}
        </div>
      )}
    </section>
  );
}