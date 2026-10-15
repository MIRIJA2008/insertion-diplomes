import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, getSession } from "../api";
import { useAuth } from "../auth";

interface Campagne {
  id: number;
  titre: string;
  dateDebut: string;
  dateFin: string;
  statut: "BROUILLON" | "OUVERTE" | "CLOTUREE";
  _count: { invitations: number };
}
interface Promotion {
  id: number;
  anneeSortie: number;
  filiere: { code: string };
}
interface Invitation {
  id: number;
  lien: string;
  diplome: { nom: string; prenom: string };
  repondu: boolean;
}
interface InvitationsPage {
  data: Invitation[];
  pagination: { page: number; total: number; pages: number };
}
interface Resume {
  invitations: number;
  reponses: number;
  tauxReponse: number;
}

const STATUTS = { BROUILLON: "Brouillon", OUVERTE: "Ouverte", CLOTUREE: "Clôturée" } as const;
const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");
const debutISO = (d: string) => new Date(`${d}T00:00:00`).toISOString();
const finISO = (d: string) => new Date(`${d}T23:59:59`).toISOString();

export default function Campagnes() {
  const { user } = useAuth();
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectionId, setSelectionId] = useState<number | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [invitations, setInvitations] = useState<InvitationsPage | null>(null);
  const [filtre, setFiltre] = useState("");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [promotionId, setPromotionId] = useState("");
  const [titre, setTitre] = useState("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [erreur, setErreur] = useState("");
  const [info, setInfo] = useState("");
  const [qr, setQr] = useState<{ url: string; nom: string } | null>(null);
  const [chargement, setChargement] = useState(true);

  const selection = campagnes.find((c) => c.id === selectionId) ?? null;

  const chargerCampagnes = useCallback(async () => {
    try {
      setCampagnes(await api<Campagne[]>("/campagnes"));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void chargerCampagnes();
    api<Promotion[]>("/promotions").then(setPromotions).catch(() => undefined);
  }, [chargerCampagnes]);

  useEffect(() => {
    if (selectionId === null) return;
    let annule = false;
    const q = new URLSearchParams({ page: String(page), limite: "10" });
    if (filtre) q.set("statut", filtre);
    Promise.all([
      api<{ resume: Resume }>(`/campagnes/${selectionId}`),
      api<InvitationsPage>(`/campagnes/${selectionId}/invitations?${q.toString()}`),
    ])
      .then(([d, i]) => {
        if (annule) return;
        setResume(d.resume);
        setInvitations(i);
      })
      .catch((e) => {
        if (!annule) setErreur(e instanceof Error ? e.message : "Chargement impossible");
      });
    return () => {
      annule = true;
    };
  }, [selectionId, page, filtre, version]);

  useEffect(() => {
    return () => {
      if (qr) URL.revokeObjectURL(qr.url);
    };
  }, [qr]);

  const action = async (fn: () => Promise<void>) => {
    setErreur("");
    setInfo("");
    try {
      await fn();
      await chargerCampagnes();
      setVersion((v) => v + 1);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Opération impossible");
    }
  };

  const creer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    setInfo("");
    try {
      const c = await api<Campagne>("/campagnes", {
        method: "POST",
        body: { titre, dateDebut: debutISO(debut), dateFin: finISO(fin) },
      });
      setTitre("");
      setDebut("");
      setFin("");
      await chargerCampagnes();
      setSelectionId(c.id);
      setPage(1);
      setFiltre("");
      setInfo("Campagne créée en brouillon. Générez maintenant les invitations.");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Création impossible");
    }
  };

  const choisir = (id: number) => {
    setSelectionId(id);
    setPage(1);
    setFiltre("");
    setResume(null);
    setInvitations(null);
    setQr(null);
    setInfo("");
    setErreur("");
  };

  const generer = () =>
    action(async () => {
      if (!selection) return;
      const r = await api<{ diplomesCibles: number; invitationsCreees: number; dejaExistantes: number }>(
        `/campagnes/${selection.id}/invitations`,
        { method: "POST", body: promotionId ? { promotionId: Number(promotionId) } : {} },
      );
      setInfo(`${r.invitationsCreees} invitation(s) créée(s), ${r.dejaExistantes} déjà existante(s).`);
    });

  const ouvrir = () => {
    if (!selection || !window.confirm("Ouvrir la campagne ? Les diplômés pourront alors répondre.")) return;
    void action(async () => {
      await api(`/campagnes/${selection.id}/ouvrir`, { method: "POST" });
      setInfo("Campagne ouverte.");
    });
  };

  const cloturer = () => {
    if (!selection || !window.confirm("Clôturer la campagne ? Plus aucune réponse ne sera acceptée.")) return;
    void action(async () => {
      await api(`/campagnes/${selection.id}/cloturer`, { method: "POST" });
      setInfo("Campagne clôturée.");
    });
  };

  const supprimer = (c: Campagne) => {
    if (!window.confirm(`Supprimer la campagne « ${c.titre} » ?`)) return;
    void action(async () => {
      await api(`/campagnes/${c.id}`, { method: "DELETE" });
      if (selectionId === c.id) {
        setSelectionId(null);
        setResume(null);
        setInvitations(null);
      }
    });
  };

  const copier = async (lien: string) => {
    try {
      await navigator.clipboard.writeText(lien);
      setInfo("Lien copié.");
    } catch {
      window.prompt("Copiez ce lien :", lien);
    }
  };

  const afficherQr = async (inv: Invitation) => {
    if (!selection) return;
    setErreur("");
    try {
      const session = getSession();
      const res = await fetch(`/api/campagnes/${selection.id}/invitations/${inv.id}/qrcode`, {
        headers: session ? { Authorization: `Bearer ${session.token}` } : {},
      });
      if (!res.ok) throw new Error("QR code indisponible");
      const blob = await res.blob();
      setQr({ url: URL.createObjectURL(blob), nom: `${inv.diplome.prenom} ${inv.diplome.nom}` });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "QR code indisponible");
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <section>
        <h2>Campagnes</h2>
        <p className="muted">Cette page est réservée à l'administrateur.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Campagnes</h2>
      {erreur && <p className="error" role="alert">{erreur}</p>}
      {info && <p className="success" role="status">{info}</p>}

      <form className="card inline-form" onSubmit={creer}>
        <input placeholder="Titre de la campagne" required minLength={3} value={titre} onChange={(e) => setTitre(e.target.value)} />
        <input type="date" required aria-label="Date de début" value={debut} onChange={(e) => setDebut(e.target.value)} />
        <input type="date" required aria-label="Date de fin" min={debut} value={fin} onChange={(e) => setFin(e.target.value)} />
        <button type="submit">Créer</button>
      </form>

      {chargement ? (
        <p className="muted">Chargement...</p>
      ) : campagnes.length === 0 ? (
        <p className="muted">Aucune campagne pour le moment.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Titre</th><th>Période</th><th>Statut</th><th>Invitations</th><th></th></tr>
            </thead>
            <tbody>
              {campagnes.map((c) => (
                <tr key={c.id} className={c.id === selectionId ? "row-selected" : ""}>
                  <td>{c.titre}</td>
                  <td>{date(c.dateDebut)} → {date(c.dateFin)}</td>
                  <td><span className={`statut statut-${c.statut}`}>{STATUTS[c.statut]}</span></td>
                  <td>{c._count.invitations}</td>
                  <td className="actions">
                    <button className="secondary dark" onClick={() => choisir(c.id)}>Gérer</button>
                    {c.statut === "BROUILLON" && <button className="danger" onClick={() => supprimer(c)}>Supprimer</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selection && (
        <div className="card detail">
          <h3>{selection.titre} <span className={`statut statut-${selection.statut}`}>{STATUTS[selection.statut]}</span></h3>

          {resume && (
            <div className="stat-grid">
              <div className="stat-card"><span className="stat-title">Invitations</span><strong className="stat-value">{resume.invitations}</strong></div>
              <div className="stat-card"><span className="stat-title">Réponses</span><strong className="stat-value">{resume.reponses}</strong></div>
              <div className="stat-card"><span className="stat-title">Taux de réponse</span><strong className="stat-value">{resume.tauxReponse.toLocaleString("fr-FR")} %</strong></div>
            </div>
          )}

          <div className="actions-bar">
            {selection.statut !== "CLOTUREE" && (
              <>
                <select aria-label="Promotion ciblée" value={promotionId} onChange={(e) => setPromotionId(e.target.value)}>
                  <option value="">Tous les diplômés</option>
                  {promotions.map((p) => <option key={p.id} value={p.id}>{p.filiere.code} – {p.anneeSortie}</option>)}
                </select>
                <button className="secondary dark" onClick={() => void generer()}>Générer les invitations</button>
              </>
            )}
            {selection.statut === "BROUILLON" && <button onClick={ouvrir}>Ouvrir la campagne</button>}
            {selection.statut === "OUVERTE" && <button onClick={cloturer}>Clôturer la campagne</button>}
          </div>
          <p className="muted small">La diffusion des liens (message, impression du QR code) se fait en dehors de l'application.</p>

          <div className="tabs">
            {([["", "Toutes"], ["repondu", "Répondues"], ["en_attente", "En attente"]] as const).map(([v, l]) => (
              <button key={v} className={filtre === v ? "tab on" : "tab"} onClick={() => { setFiltre(v); setPage(1); }}>{l}</button>
            ))}
          </div>

          {invitations && invitations.data.length === 0 ? (
            <p className="muted">Aucune invitation pour ce filtre.</p>
          ) : (
            invitations && (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Diplômé</th><th>Lien</th><th>QR code</th><th>État</th></tr></thead>
                  <tbody>
                    {invitations.data.map((i) => (
                      <tr key={i.id}>
                        <td>{i.diplome.prenom} {i.diplome.nom}</td>
                        <td><button className="secondary dark" onClick={() => void copier(i.lien)}>Copier le lien</button></td>
                        <td><button className="secondary dark" onClick={() => void afficherQr(i)}>Voir</button></td>
                        <td>{i.repondu ? <span className="statut statut-OUVERTE">Répondu</span> : <span className="statut statut-BROUILLON">En attente</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {invitations && invitations.pagination.pages > 1 && (
            <div className="pager">
              <button className="secondary dark" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button>
              <span>Page {invitations.pagination.page} sur {invitations.pagination.pages}</span>
              <button className="secondary dark" disabled={page >= invitations.pagination.pages} onClick={() => setPage(page + 1)}>Suivant</button>
            </div>
          )}

          {qr && (
            <div className="qr-box">
              <img src={qr.url} alt={`QR code de ${qr.nom}`} width={200} height={200} />
              <div>
                <strong>{qr.nom}</strong>
                <p className="muted small">Ce QR code mène au formulaire personnel de ce diplômé.</p>
                <a className="link-button" href={qr.url} download={`qr-${qr.nom.replace(/\s+/g, "-")}.png`}>Télécharger l'image</a>
                <button className="secondary dark" onClick={() => setQr(null)}>Fermer</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
