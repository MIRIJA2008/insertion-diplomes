import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api";

interface ProfilMoi {
  utilisateur: { id: number; nom: string; email: string; langue?: string; couleurAccent?: string };
  profil: any;
}

const LANGUES = [
  { v: "fr", l: "Francais" },
  { v: "mg", l: "Malagasy" },
];

const COULEURS = ["bleu", "violet", "rose", "cyan", "vert", "orange"];

export default function CandidatParametres() {
  const [data, setData] = useState<ProfilMoi | null>(null);
  const [langue, setLangue] = useState("fr");
  const [couleur, setCouleur] = useState("bleu");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<ProfilMoi>("/profils/moi").then((d) => {
      setData(d);
      setLangue(d.utilisateur.langue ?? "fr");
      setCouleur(d.utilisateur.couleurAccent ?? "bleu");
    }).catch((e) => setErreur(e.message));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(""); setErreur(""); setSaving(true);
    try {
      await api("/profils/moi/preferences", { method: "PUT", body: { langue, couleurAccent: couleur } });
      setMessage("Preferences enregistrees avec succes");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (!data && !erreur) return <p className="muted">Chargement...</p>;

  return (
    <div>
      <div className="pf-header">
        <div className="pf-header-copy">
          <h1>Parametres</h1>
          <p>Personnalisez votre experience sur la plateforme.</p>
        </div>
      </div>

      {erreur && <div className="pf-alert pf-alert-error" style={{ marginBottom: "1rem" }}>{erreur}</div>}

      <form onSubmit={save}>
        <div className="cand-profil-card">
          <h3>Langue de l interface</h3>
          <div className="cand-pref-options">
            {LANGUES.map((l) => (
              <button
                key={l.v}
                type="button"
                className={`cand-pref-option ${langue === l.v ? "active" : ""}`}
                onClick={() => setLangue(l.v)}
              >
                {l.l}
              </button>
            ))}
          </div>
        </div>

        <div className="cand-profil-card">
          <h3>Couleur d accent</h3>
          <p style={{ color: "var(--texte-muet)", fontSize: ".85rem", marginBottom: "1rem" }}>
            Choisissez la couleur principale de votre interface.
          </p>
          <div className="cand-pref-options">
            {COULEURS.map((c) => (
              <button
                key={c}
                type="button"
                className={`cand-pref-color ${c} ${couleur === c ? "active" : ""}`}
                onClick={() => setCouleur(c)}
                aria-label={`Couleur ${c}`}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="cand-profil-card">
          <h3>Informations personnelles</h3>
          {data && (
            <>
              <p style={{ margin: 0, marginBottom: ".5rem" }}><strong>Nom :</strong> {data.utilisateur.nom}</p>
              <p style={{ margin: 0 }}><strong>Email :</strong> {data.utilisateur.email}</p>
            </>
          )}
        </div>

        {message && <div className="pf-alert pf-alert-success">{message}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button type="submit" className="pf-btn pf-btn-primary" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer les preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}