import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
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
  const [selection, setSelection] = useState<Communaute | null>(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [domaine, setDomaine] = useState("");
  const [message, setMessage] = useState("");

  const charger = () => {
    api<Communaute[]>("/communautes").then((l) => {
      setListe(l);
      if (selection) {
        const maj = l.find((c) => c.id === selection.id);
        if (maj) {
          api<Communaute>(`/communautes/${maj.id}`).then(setSelection).catch(() => setSelection(maj));
        }
      }
    }).catch(() => {});
  };
  useEffect(charger, []);

  const creer = async (e: FormEvent) => {
    e.preventDefault();
    await api("/communautes", { method: "POST", body: { nom, description: description || undefined, domaine: domaine || undefined } }).catch(() => {});
    setNom(""); setDescription(""); setDomaine("");
    charger();
  };

  const rejoindre = async (id: number) => {
    await api(`/communautes/${id}/rejoindre`, { method: "POST" }).catch(() => {});
    charger();
  };

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    if (!selection || !message.trim()) return;
    await api(`/communautes/${selection.id}/messages`, { method: "POST", body: { contenu: message } }).catch(() => {});
    setMessage("");
    charger();
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
          <div className="conv-liste">
            {liste.map((c) => (
              <div key={c.id} className={`conv-item ${selection?.id === c.id ? "actif" : ""}`} onClick={() => setSelection(c)}>
                <strong>{c.nom}</strong>
                <div className="muted small">{c._count.membres} {t("comm.members")} {c.filiere ? `\u00B7 ${c.filiere.code}` : ""}</div>
              </div>
            ))}
            {liste.length === 0 && <p className="muted small">{t("common.none")}</p>}
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
                <button className="secondary" onClick={() => rejoindre(selection.id)}>{t("comm.join")}</button>
              </div>
              <div className="msg-liste">
                {selection.messages.map((m) => (
                  <div key={m.id} className="msg-bulle">
                    <span className="qui">{m.auteur.nom} \u00B7 {new Date(m.envoyeLe).toLocaleString("fr-FR")}</span>
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
          )}
        </div>
      </div>
    </section>
  );
}