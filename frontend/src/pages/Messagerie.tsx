import { useEffect, useState, type FormEvent } from "react";
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

  const charger = () => {
    api<Conversation[]>("/messagerie/conversations").then(setConversations).catch(() => {});
  };
  useEffect(charger, []);

  const ouvrir = async (c: Conversation) => {
    setSelection(c);
    api<Message[]>(`/messagerie/conversations/${c.id}/messages`).then(setMessages).catch(() => setMessages([]));
  };

  const nouvelle = async (e: FormEvent) => {
    e.preventDefault();
    const id = Number(destinataire);
    if (!id) return;
    const c = await api<Conversation>("/messagerie/conversations", { method: "POST", body: { utilisateurId: id } }).catch(() => null);
    setDestinataire("");
    charger();
    if (c) ouvrir(c);
  };

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    if (!selection || !brouillon.trim()) return;
    const m = await api<Message>(`/messagerie/conversations/${selection.id}/messages`, { method: "POST", body: { contenu: brouillon } }).catch(() => null);
    setBrouillon("");
    if (m) setMessages((ms) => [...ms, m]);
    charger();
  };

  return (
    <section>
      <h2>{t("msg.title")}</h2>
      <div className="conv-layout">
        <div>
          <form className="card" onSubmit={nouvelle} style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
            <input type="number" min={1} placeholder={t("msg.with")} value={destinataire} onChange={(e) => setDestinataire(e.target.value)} />
            <button type="submit">{t("msg.new")}</button>
          </form>
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
            {conversations.length === 0 && <p className="muted small">{t("common.none")}</p>}
          </div>
        </div>

        <div className="card msg-zone">
          {!selection && <p className="empty">{t("msg.empty")}</p>}
          {selection && (
            <>
              <div className="msg-liste">
                {messages.map((m) => (
                  <div key={m.id} className="msg-bulle">
                    <span className="qui">{m.auteur.nom} \u00B7 {new Date(m.envoyeLe).toLocaleString("fr-FR")}</span>
                    {m.contenu}
                  </div>
                ))}
                {messages.length === 0 && <p className="muted small">{t("common.none")}</p>}
              </div>
              <form className="msg-form" onSubmit={envoyer}>
                <input value={brouillon} onChange={(e) => setBrouillon(e.target.value)} placeholder={t("msg.write")} />
                <button type="submit">{t("common.send")}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}