import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError } from "../api";

interface Enquete {
  titre: string;
  etat: "OUVERTE" | "NON_OUVERTE" | "CLOTUREE" | "DEJA_REPONDU";
  dateFin: string;
  secteurs: string[];
}

const SITUATIONS = [
  ["EMPLOI_SALARIE", "J'ai un emploi salarie"],
  ["EMPLOI_INDEPENDANT", "Je travaille a mon compte"],
  ["POURSUITE_ETUDES", "Je poursuis mes etudes"],
  ["RECHERCHE_EMPLOI", "Je cherche un emploi"],
  ["AUTRE", "Autre situation"],
] as const;

const CONTRATS = [
  ["CDI", "CDI (contrat a duree indeterminee)"],
  ["CDD", "CDD (contrat a duree determinee)"],
  ["STAGE", "Stage"],
  ["INDEPENDANT", "Independant"],
  ["OCCASIONNEL", "Travail occasionnel"],
] as const;

const MESSAGES: Record<string, string> = {
  DEJA_REPONDU: "Vous avez deja repondu a cette enquete. Merci !",
  NON_OUVERTE: "Cette enquete n'est pas encore ouverte.",
  CLOTUREE: "Cette enquete est terminee.",
};

export default function Enquete() {
  const { jeton = "" } = useParams();
  const [enquete, setEnquete] = useState<Enquete | null>(null);
  const [chargement, setChargement] = useState(true);
  const [lienInvalide, setLienInvalide] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const [consentement, setConsentement] = useState(false);
  const [situation, setSituation] = useState("");
  const [secteur, setSecteur] = useState("");
  const [typeContrat, setTypeContrat] = useState("");
  const [delai, setDelai] = useState("");
  const [adequation, setAdequation] = useState(0);
  const [ville, setVille] = useState("");
  const [remarque, setRemarque] = useState("");

  const enEmploi = situation === "EMPLOI_SALARIE" || situation === "EMPLOI_INDEPENDANT";

  useEffect(() => {
    api<Enquete>(`/enquete/${jeton}`)
      .then(setEnquete)
      .catch((e) => {
        if (e instanceof ApiError && (e.status === 404 || e.status === 400)) setLienInvalide(true);
        else setErreur("Impossible de charger l'enquete. Reessayez plus tard.");
      })
      .finally(() => setChargement(false));
  }, [jeton]);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    if (enEmploi && adequation === 0) {
      setErreur("Veuillez donner une note de 1 a 5 pour la formation.");
      return;
    }
    setEnvoi(true);
    try {
      await api(`/enquete/${jeton}`, {
        method: "POST",
        body: {
          consentement,
          situation,
          ville,
          remarque: remarque.trim() || null,
          ...(enEmploi
            ? {
                secteur,
                typeContrat,
                delaiInsertionMois: Number(delai),
                adequationFormation: adequation,
              }
            : {}),
        },
      });
      setEnvoye(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setEnvoi(false);
    }
  };

  let contenu;
  if (chargement) {
    contenu = <p className="muted">Chargement...</p>;
  } else if (lienInvalide) {
    contenu = <div className="notice"><h1>Lien invalide</h1><p>Ce lien n'est pas valide. Verifiez-le ou contactez votre etablissement.</p></div>;
  } else if (!enquete) {
    contenu = <p className="error" role="alert">{erreur}</p>;
  } else if (envoye) {
    contenu = <div className="notice"><p className="success">Merci, votre reponse a ete enregistree.</p></div>;
  } else if (enquete.etat !== "OUVERTE") {
    contenu = <div className="notice"><h1>{enquete.titre}</h1><p>{MESSAGES[enquete.etat]}</p></div>;
  } else {
    contenu = (
      <form className="card" onSubmit={soumettre}>
        <h1>{enquete.titre}</h1>
        <p className="muted">Quelques questions, environ 3 minutes.</p>

        <label className="choice consent">
          <input type="checkbox" required checked={consentement} onChange={(e) => setConsentement(e.target.checked)} />
          <span>J'accepte que mes reponses soient utilisees, de facon anonyme et regroupee, pour les statistiques sur l'insertion des diplomes.</span>
        </label>

        <label>Quelle est votre situation actuelle ?</label>
        {SITUATIONS.map(([valeur, libelle]) => (
          <label key={valeur} className="choice">
            <input type="radio" name="situation" required checked={situation === valeur} onChange={() => setSituation(valeur)} />
            <span>{libelle}</span>
          </label>
        ))}

        {enEmploi && (
          <>
            <label htmlFor="secteur">Dans quel secteur travaillez-vous ?</label>
            <select id="secteur" required value={secteur} onChange={(e) => setSecteur(e.target.value)}>
              <option value="">Choisir...</option>
              {enquete.secteurs.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <label htmlFor="contrat">Quel est votre type de contrat ?</label>
            <select id="contrat" required value={typeContrat} onChange={(e) => setTypeContrat(e.target.value)}>
              <option value="">Choisir...</option>
              {CONTRATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>

            <label htmlFor="delai">Apres votre diplome, au bout de combien de mois avez-vous obtenu votre premier emploi ?</label>
            <input id="delai" type="number" inputMode="numeric" min={0} max={120} required value={delai} onChange={(e) => setDelai(e.target.value)} />

            <label>La formation recue correspond-elle a votre travail ? (1 = pas du tout, 5 = tout a fait)</label>
            <div className="scale">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="choice">
                  <input type="radio" name="adequation" checked={adequation === n} onChange={() => setAdequation(n)} />
                  <span>{n}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <label htmlFor="ville">Dans quelle ville habitez-vous ou travaillez-vous ?</label>
        <input id="ville" required maxLength={100} value={ville} onChange={(e) => setVille(e.target.value)} />

        <label htmlFor="remarque">Une remarque sur votre formation ? (facultatif)</label>
        <textarea id="remarque" rows={3} maxLength={500} value={remarque} onChange={(e) => setRemarque(e.target.value)} />

        {erreur && <p className="error" role="alert">{erreur}</p>}
        <button type="submit" disabled={envoi}>{envoi ? "Envoi..." : "Envoyer mes reponses"}</button>
      </form>
    );
  }

  return <div className="public-page">{contenu}</div>;
}
