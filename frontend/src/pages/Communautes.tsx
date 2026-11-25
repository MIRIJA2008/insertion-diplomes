import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";

interface Membre { utilisateur: { id: number; nom: string } }
interface MessageCommu { id: number; contenu: string; envoyeLe: string; auteur: { nom: string } }
interface Communaute {
  id: number;
  nom: string;
  description: string | null;
  domaine: string | null;
  filiere?: { code: string } | null;
  membres: Membre[];
  messages: MessageCommu[];
  _count: { membres: number };
}

export default function Communautes() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [liste, setListe] = useState<Communaute[]>([]);
  const [chargementListe, setChargementListe] = useState(true);
  const [erreurListe, setErreurListe] = useState<string | null>(null);
  const [selection, setSelection] = useState<Communaute | null>(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [domaine, setDomaine] = useState("");
  const [message, setMessage] = useState("");

  const [estMembre, setEstMembre] = useState(false);
  const [chargementDetail, setChargementDetail] = useState(false);
  const [erreurDetail, setErreurDetail] = useState<string | null>(null);
  const [erreurCreation, setErreurCreation] = useState<string | null>(null);
  const requeteDetail = useRef(0);

  const selectionner = async (communaute: Communaute) => {
    const numeroRequete = ++requeteDetail.current;

    setSelection({ ...communaute, membres: [], messages: [] });
    setEstMembre(false);
    setErreurDetail(null);
    setChargementDetail(true);

    try {
      const detail = await api<Communaute>(`/communautes/${communaute.id}`);

      if (numeroRequete !== requeteDetail.current) return;

      setSelection(detail);
      setEstMembre(true);
    } catch (error) {
      if (numeroRequete !== requeteDetail.current) return;

      setSelection({ ...communaute, membres: [], messages: [] });
      setEstMembre(false);

      if (!(error instanceof ApiError && error.status === 403)) {
        setErreurDetail(
          error instanceof Error
            ? error.message
            : "Impossible de charger cette communaute."
        );
      }
    } finally {
      if (numeroRequete === requeteDetail.current) {
        setChargementDetail(false);
      }
    }
  };

  const charger = async () => {
    setErreurListe(null);
    setChargementListe(true);
    try {
      const l = await api<Communaute[]>("/communautes");
      setListe(l);
      if (selection) {
        const maj = l.find((c) => c.id === selection.id);
        if (maj) {
          void selectionner(maj);
        }
      }
    } catch (error) {
      setErreurListe(
        error instanceof Error
          ? error.message
          : "Impossible de charger les communautes."
      );
    } finally {
      setChargementListe(false);
    }
  };
  useEffect(() => {
    void charger();
  }, []);

  const creer = async (e: FormEvent) => {
    e.preventDefault();
    setErreurCreation(null);

    try {
      await api("/communautes", {
        method: "POST",
        body: {
          nom,
          description: description || undefined,
          domaine: domaine || undefined,
        },
      });

      setNom("");
      setDescription("");
      setDomaine("");
      charger();
    } catch (error) {
      setErreurCreation(
        error instanceof Error
          ? error.message
          : "Impossible de creer cette communaute."
      );
    }
  };

  const rejoindre = async (id: number) => {
    const numeroRequete = requeteDetail.current;

    try {
      await api(`/communautes/${id}/rejoindre`, { method: "POST" });

      if (numeroRequete !== requeteDetail.current) return;

      const communaute = liste.find((c) => c.id === id);

      if (communaute && selection?.id === id) {
        setListe((actuelle) =>
          actuelle.map((c) =>
            c.id === id
              ? {
                  ...c,
                  _count: {
                    ...c._count,
                    membres: c._count.membres + 1,
                  },
                }
              : c
          )
        );

        await selectionner(communaute);
      }
    } catch (error) {
      if (
        numeroRequete !== requeteDetail.current ||
        selection?.id !== id
      ) {
        return;
      }

      setErreurDetail(
        error instanceof Error
          ? error.message
          : "Impossible de rejoindre cette communaute."
      );
    }
  };

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    if (!selection || !estMembre || !message.trim()) return;

    try {
      await api(`/communautes/${selection.id}/messages`, {
        method: "POST",
        body: { contenu: message },
      });
      setMessage("");
      charger();
    } catch (error) {
      setErreurDetail(
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer le message."
      );
    }
  };

  return (
    <section>
      <h2>{t("comm.title")}</h2>
      <div className="conv-layout">
        <div>
          <form className="card" onSubmit={creer} style={{ display: "grid", gap: ".3rem", marginBottom: "1rem" }}>
            <strong>{t("comm.new")}</strong>
            <input required placeholder={t("comm.name")} value={nom} onChange={(e) => setNom(e.target.value)} />
            <input placeholder={t("comm.domain")} value={domaine} onChange={(e) => setDomaine(e.target.value)} />
            <input placeholder={t("comm.description")} value={description} onChange={(e) => setDescription(e.target.value)} />
            <div><button type="submit">{t("comm.join")}</button></div>
          </form>
          {erreurCreation && (
            <p className="msg-liste" role="alert">{erreurCreation}</p>
          )}
          <div className="conv-liste">
            {liste.map((c) => (
              <div key={c.id} className={`conv-item ${selection?.id === c.id ? "actif" : ""}`} onClick={() => selectionner(c)}>
                <strong>{c.nom}</strong>
                <div className="muted small">{c._count.membres} {t("comm.members")} {c.filiere ? `\u00B7 ${c.filiere.code}` : ""}</div>
              </div>
            ))}
            {chargementListe && <p className="muted small">Chargement des communautes...</p>}
            {erreurListe && (
              <div>
                <p className="msg-liste" role="alert">{erreurListe}</p>
                <button type="button" className="secondary" onClick={() => void charger()}>Réessayer</button>
              </div>
            )}
            {!chargementListe && !erreurListe && liste.length === 0 && (
              <p className="muted small">{t("common.none")}</p>
            )}
          </div>
        </div>

        <div className="card msg-zone">
          {!selection && <p className="empty">{t("common.none")}</p>}
          {selection && (
            <>
              <div className="actions-bar" style={{ justifyContent: "space-between" }}>
                <div>
                  <strong>{selection.nom}</strong>
                  {selection.description && <p className="muted small" style={{ margin: 0 }}>{selection.description}</p>}
                </div>
                {!estMembre && !chargementDetail && <button className="secondary" onClick={() => rejoindre(selection.id)}>{t("comm.join")}</button>}
              </div>
                            {erreurDetail && (
                <p className="msg-liste" role="alert">{erreurDetail}</p>
              )}
              {chargementDetail && (
                <p className="muted small">Chargement de la communaute...</p>
              )}
              {estMembre ? (
                <>
                  <div className="msg-liste">
                    {selection.messages.map((m) => (
                      <div key={m.id} className="msg-bulle">
                        <span className="qui">{m.auteur.nom} · {new Date(m.envoyeLe).toLocaleString("fr-FR")}</span>
                        {m.contenu}
                      </div>
                    ))}
                    {selection.messages.length === 0 && <p className="muted small">{t("common.none")}</p>}
                  </div>
                  {user && (
                    <form className="msg-form" onSubmit={envoyer}>
                      <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("comm.write")} />
                      <button type="submit">{t("common.send")}</button>
                    </form>
                  )}
                </>
              ) : (
                <div className="msg-liste">
                  <p className="empty">{t("comm.join")}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}