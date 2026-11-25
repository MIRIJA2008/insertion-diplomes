import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";

interface Conversation {
  id: number;
  membres: { utilisateur: { id: number; nom: string } }[];
  messages: { contenu: string; envoyeLe: string }[];
}
interface Message { id: number; contenu: string; envoyeLe: string; auteur: { id: number; nom: string } }

export default function Messagerie() {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selection, setSelection] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [brouillon, setBrouillon] = useState("");
  const [destinataire, setDestinataire] = useState("");
  const [erreurConversations, setErreurConversations] = useState("");
  const [erreurMessages, setErreurMessages] = useState("");
  const [erreurAction, setErreurAction] = useState("");
  const [chargementConversations, setChargementConversations] = useState(true);
  const [chargementMessages, setChargementMessages] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [creationEnCours, setCreationEnCours] = useState(false);
  const requeteMessages = useRef(0);

  const charger = async () => {
    setErreurConversations("");
    setChargementConversations(true);
    try {
      const donnees = await api<Conversation[]>("/messagerie/conversations");
      setConversations(donnees);
    } catch (error) {
      setErreurConversations(error instanceof Error ? error.message : "Impossible de charger les conversations.");
    } finally {
      setChargementConversations(false);
    }
  };
  useEffect(() => {
    void charger();
  }, []);

  const ouvrir = async (c: Conversation) => {
    const numero = ++requeteMessages.current;
    setSelection(c);
    setMessages([]);
    setErreurMessages("");
    setChargementMessages(true);
    try {
      const donnees = await api<Message[]>(`/messagerie/conversations/${c.id}/messages`);
      if (numero === requeteMessages.current) setMessages(donnees);
    } catch (error) {
      if (numero === requeteMessages.current) {
        setErreurMessages(error instanceof Error ? error.message : "Impossible de charger les messages.");
      }
    } finally {
      if (numero === requeteMessages.current) setChargementMessages(false);
    }
  };

  const nouvelle = async (e: FormEvent) => {
    e.preventDefault();
    const id = Number(destinataire);
    if (!id || creationEnCours) return;
    setErreurAction("");
    setCreationEnCours(true);
    try {
      const c = await api<Conversation>("/messagerie/conversations", {
        method: "POST",
        body: { utilisateurId: id },
      });
      setDestinataire("");
      await charger();
      await ouvrir(c);
    } catch (error) {
      setErreurAction(error instanceof Error ? error.message : "Impossible de creer la conversation.");
    } finally {
      setCreationEnCours(false);
    }
  };

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    if (!selection || !brouillon.trim() || envoiEnCours) return;
    const conversationId = selection.id;
    const contenu = brouillon.trim();
    setErreurAction("");
    setEnvoiEnCours(true);
    try {
      const m = await api<Message>(`/messagerie/conversations/${conversationId}/messages`, {
        method: "POST",
        body: { contenu },
      });
      if (selection?.id === conversationId) {
        setMessages((actuels) => [...actuels, m]);
        setBrouillon("");
      }
      await charger();
    } catch (error) {
      setErreurAction(error instanceof Error ? error.message : "Impossible d'envoyer le message.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <section>
      <h2>{t("msg.title")}</h2>
      <div className="conv-layout">
        <div>
          <form className="card" onSubmit={nouvelle} style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
            <input type="number" min={1} placeholder={t("msg.with")} value={destinataire} onChange={(e) => setDestinataire(e.target.value)} />
            <button type="submit" disabled={creationEnCours || !destinataire.trim()}>{creationEnCours ? "Création..." : t("msg.new")}</button>
          </form>
          {erreurAction && <p role="alert" className="msg-liste">{erreurAction}</p>}
          <div className="conv-liste">
            {conversations.map((c) => {
              const autre = c.membres.map((m) => m.utilisateur.nom).join(", ");
              return (
                <div key={c.id} className={`conv-item ${selection?.id === c.id ? "actif" : ""}`} onClick={() => ouvrir(c)}>
                  <strong>{autre}</strong>
                  {c.messages[0] && <div className="muted small">{c.messages[0].contenu.slice(0, 40)}...</div>}
                </div>
              );
            })}
            {chargementConversations && <p className="muted small">Chargement...</p>}
            {erreurConversations && (
              <div>
                <p role="alert" className="msg-liste">{erreurConversations}</p>
                <button type="button" className="secondary" onClick={() => void charger()}>Réessayer</button>
              </div>
            )}
            {!chargementConversations && !erreurConversations && conversations.length === 0 && <p className="muted small">{t("common.none")}</p>}
          </div>
        </div>

        <div className="card msg-zone">
          {!selection && <p className="empty">{t("msg.empty")}</p>}
          {selection && (
            <>
              <div className="msg-liste">
                {chargementMessages && <p className="muted small">Chargement des messages...</p>}
                {erreurMessages && (
                  <div>
                    <p role="alert" className="msg-liste">{erreurMessages}</p>
                    <button type="button" className="secondary" onClick={() => selection && void ouvrir(selection)}>Réessayer</button>
                  </div>
                )}
                {!chargementMessages && !erreurMessages && messages.map((m) => (
                  <div key={m.id} className="msg-bulle">
                    <span className="qui">{m.auteur.nom} \u00B7 {new Date(m.envoyeLe).toLocaleString("fr-FR")}</span>
                    {m.contenu}
                  </div>
                ))}
                {!chargementMessages && !erreurMessages && messages.length === 0 && <p className="muted small">{t("common.none")}</p>}
              </div>
              {erreurAction && <p role="alert" className="msg-liste">{erreurAction}</p>}
              <form className="msg-form" onSubmit={envoyer}>
                <input value={brouillon} onChange={(e) => setBrouillon(e.target.value)} placeholder={t("msg.write")} />
                <button type="submit" disabled={envoiEnCours || !brouillon.trim()}>{envoiEnCours ? "Envoi..." : t("common.send")}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}