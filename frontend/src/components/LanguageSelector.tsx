import { useRef, useState } from "react";
import { useI18n, type Langue } from "../i18n";
import { api } from "../api";

export default function LanguageSelector() {
  const { langue, definirLangue } = useI18n();
  const [erreur, setErreur] = useState("");
  const requete = useRef(0);

  const changer = async (l: Langue) => {
    definirLangue(l);
    setErreur("");
    const id = ++requete.current;

    try {
      await api("/profils/moi/preferences", {
        method: "PUT",
        body: { langue: l },
      });
    } catch (e) {
      if (id === requete.current) {
        setErreur(
          e instanceof Error
            ? `Langue modifiée localement, mais non synchronisée : ${e.message}`
            : "Langue modifiée localement, mais non synchronisée avec le serveur."
        );
      }
    }
  };

  return (
    <div>
      <select
        className="select-lang"
        value={langue}
        onChange={(e) => void changer(e.target.value as Langue)}
        aria-label="Langue"
      >
        <option value="fr">Français</option>
        <option value="mg">Malagasy</option>
      </select>
      {erreur && <p role="alert" className="pf-alert pf-alert-error">{erreur}</p>}
    </div>
  );
}