import { useEffect, useState } from "react";
import { api } from "../api";

interface Campagne { id: number; titre: string; statut: string }
interface Filiere { id: number; code: string; intitule: string }
interface Promotion { anneeSortie: number }

interface Stats {
  invitations: number;
  reponses: number;
  tauxReponse: number | null;
  fiable: boolean;
  seuilFiabilite: number;
  enEmploi: number;
  tauxInsertion: number | null;
  tauxPoursuiteEtudes: number | null;
  tauxRechercheEmploi: number | null;
  delaiMoyenMois: number | null;
  adequationMoyenne: number | null;
  situations: { situation: string; effectif: number; pourcentage: number | null }[];
  secteurs: { secteur: string; effectif: number; pourcentage: number | null }[];
  contrats: { typeContrat: string; effectif: number; pourcentage: number | null }[];
}

interface LigneFiliere {
  filiere: Filiere;
  invitations: number;
  reponses: number;
  tauxReponse: number | null;
  tauxInsertion: number | null;
  delaiMoyenMois: number | null;
  adequationMoyenne: number | null;
  fiable: boolean;
}

const SITUATIONS: Record<string, string> = {
  EMPLOI_SALARIE: "Emploi salarie",
  EMPLOI_INDEPENDANT: "Emploi independant",
  POURSUITE_ETUDES: "Poursuite d'etudes",
  RECHERCHE_EMPLOI: "Recherche d'emploi",
  AUTRE: "Autre situation",
};

const CONTRATS: Record<string, string> = {
  CDI: "CDI",
  CDD: "CDD",
  STAGE: "Stage",
  INDEPENDANT: "Independant",
  OCCASIONNEL: "Occasionnel",
};

const nombre = (v: number | null, unite = "") =>
  v === null ? "?" : `${v.toLocaleString("fr-FR")}${unite}`;

function Carte({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-title">{titre}</span>
      <strong className="stat-value">{valeur}</strong>
      {detail && <span className="muted stat-detail">{detail}</span>}
    </div>
  );
}

function Barres({ lignes }: { lignes: { libelle: string; effectif: number; pourcentage: number | null }[] }) {
  if (lignes.length === 0) return <p className="muted">Aucune donnee.</p>;
  return (
    <ul className="bars">
      {lignes.map((l) => (
        <li key={l.libelle}>
          <div className="bar-head">
            <span>{l.libelle}</span>
            <span>{nombre(l.pourcentage, " %")} ({l.effectif})</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${l.pourcentage ?? 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [annees, setAnnees] = useState<number[]>([]);
  const [campagneId, setCampagneId] = useState("");
  const [filiereId, setFiliereId] = useState("");
  const [annee, setAnnee] = useState("");

  const [stats, setStats] = useState<Stats | null>(null);
  const [lignes, setLignes] = useState<LigneFiliere[]>([]);
  const [prets, setPrets] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    Promise.all([
      api<Campagne[]>("/campagnes"),
      api<Filiere[]>("/filieres"),
      api<Promotion[]>("/promotions"),
    ])
      .then(([c, f, p]) => {
        setCampagnes(c);
        setFilieres(f);
        setAnnees([...new Set(p.map((x) => x.anneeSortie))].sort((a, b) => b - a));
        const defaut = c.find((x) => x.statut === "OUVERTE") ?? c[0];
        if (defaut) setCampagneId(String(defaut.id));
      })
      .catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible"))
      .finally(() => setPrets(true));
  }, []);

  useEffect(() => {
    if (!prets || campagnes.length === 0) return;
    let annule = false;
    const params = new URLSearchParams();
    if (campagneId) params.set("campagneId", campagneId);
    if (annee) params.set("anneeSortie", annee);
    const parFiliere = params.toString();
    if (filiereId) params.set("filiereId", filiereId);

    setChargement(true);
    setErreur("");
    Promise.all([
      api<Stats>(`/statistiques?${params.toString()}`),
      api<LigneFiliere[]>(`/statistiques/par-filiere?${parFiliere}`),
    ])
      .then(([s, l]) => {
        if (annule) return;
        setStats(s);
        setLignes(l);
      })
      .catch((e) => {
        if (!annule) setErreur(e instanceof Error ? e.message : "Chargement impossible");
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, [prets, campagnes.length, campagneId, filiereId, annee]);

  if (!prets) return <p className="muted">Chargement...</p>;
  if (campagnes.length === 0) {
    return (
      <section>
        <h2>Tableau de bord</h2>
        <p className="muted">Aucune campagne pour le moment. Les statistiques apparaitront apres la premiere enquete.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Tableau de bord</h2>

      <div className="card filters">
        <div>
          <label htmlFor="f-campagne">Campagne</label>
          <select id="f-campagne" value={campagneId} onChange={(e) => setCampagneId(e.target.value)}>
            {campagnes.map((c) => <option key={c.id} value={c.id}>{c.titre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-filiere">Filiere</label>
          <select id="f-filiere" value={filiereId} onChange={(e) => setFiliereId(e.target.value)}>
            <option value="">Toutes</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} - {f.intitule}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-annee">Annee de sortie</label>
          <select id="f-annee" value={annee} onChange={(e) => setAnnee(e.target.value)}>
            <option value="">Toutes</option>
            {annees.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {erreur && <p className="error" role="alert">{erreur}</p>}
      {chargement && <p className="muted">Mise a jour...</p>}

      {stats && (
        <div className={chargement ? "dim" : ""}>
          {!stats.fiable && (
            <p className="warning" role="status">
              Resultats peu fiables : {stats.reponses} repondant(s) seulement (seuil : {stats.seuilFiabilite}).
              Ne tirez pas de conclusion de ces chiffres.
            </p>
          )}

          <div className="stat-grid">
            <Carte titre="Taux de reponse" valeur={nombre(stats.tauxReponse, " %")} detail={`${stats.reponses} reponse(s) sur ${stats.invitations} invitation(s)`} />
            <Carte titre="Taux d'insertion" valeur={nombre(stats.tauxInsertion, " %")} detail={`${stats.enEmploi} en emploi sur ${stats.reponses} repondant(s)`} />
            <Carte titre="Poursuite d'etudes" valeur={nombre(stats.tauxPoursuiteEtudes, " %")} />
            <Carte titre="Recherche d'emploi" valeur={nombre(stats.tauxRechercheEmploi, " %")} />
            <Carte titre="Delai moyen d'insertion" valeur={nombre(stats.delaiMoyenMois, " mois")} detail="parmi les personnes en emploi" />
            <Carte titre="Adequation formation-emploi" valeur={stats.adequationMoyenne === null ? "?" : `${nombre(stats.adequationMoyenne)} / 5`} detail="parmi les personnes en emploi" />
          </div>

          <div className="two-cols">
            <div className="card">
              <h3>Situation des repondants</h3>
              <Barres lignes={stats.situations.map((s) => ({ libelle: SITUATIONS[s.situation] ?? s.situation, effectif: s.effectif, pourcentage: s.pourcentage }))} />
            </div>
            <div className="card">
              <h3>Secteurs d'activite</h3>
              <Barres lignes={stats.secteurs.map((s) => ({ libelle: s.secteur, effectif: s.effectif, pourcentage: s.pourcentage }))} />
            </div>
            <div className="card">
              <h3>Types de contrat</h3>
              <Barres lignes={stats.contrats.map((c) => ({ libelle: CONTRATS[c.typeContrat] ?? c.typeContrat, effectif: c.effectif, pourcentage: c.pourcentage }))} />
            </div>
          </div>

          <h3>Comparaison par filiere</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Filiere</th>
                  <th>Reponses</th>
                  <th>Taux de reponse</th>
                  <th>Taux d'insertion</th>
                  <th>Delai moyen</th>
                  <th>Adequation</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.filiere.id}>
                    <td>{l.filiere.code} - {l.filiere.intitule}{!l.fiable && <span className="badge" title="Moins de 5 repondants">peu fiable</span>}</td>
                    <td>{l.reponses} / {l.invitations}</td>
                    <td>{nombre(l.tauxReponse, " %")}</td>
                    <td>{nombre(l.tauxInsertion, " %")}</td>
                    <td>{nombre(l.delaiMoyenMois, " mois")}</td>
                    <td>{l.adequationMoyenne === null ? "?" : `${nombre(l.adequationMoyenne)} / 5`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
