import { useI18n, type Langue } from "../i18n";
import { api } from "../api";

export default function LanguageSelector() {
  const { langue, definirLangue } = useI18n();
  const changer = (l: Langue) => {
    definirLangue(l);
    api("/profils/moi/preferences", { method: "PUT", body: { langue: l } }).catch(() => {});
  };
  return (
    <select className="select-lang" value={langue} onChange={(e) => changer(e.target.value as Langue)} aria-label="Langue">
      <option value="fr">Fran\u00E7ais</option>
      <option value="mg">Malagasy</option>
    </select>
  );
}