import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api";

interface Organisme {
  id?: number; nom: string; type: string; description: string | null;
  ville: string | null; verifie?: boolean;
}

const TYPES = [
  { v: "MINISTERE", l: "Ministere" }, { v: "ADMINISTRATION", l: "Administration" },
  { v: "ENTREPRISE_PRIVEE", l: "Entreprise privee" }, { v: "ONG", l: "ONG" },
  { v: "AUTRE", l: "Autre" },
];

export default function RecruteurOrganisme() {
  const [data, setData] = useState<Organisme | null>(null);
  const [form, setForm] = useState<Organisme>({ nom: "", type: "ENTREPRISE_PRIVEE", description: "", ville: "" });
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Organisme>("/recruteurs/moi/organisme").then((o) => {
      setData(o); setForm({ ...o, description: o.description ?? "", ville: o.ville ?? "" });
    }).catch(() => setData(null));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault(); setMessage(""); setErreur(""); setSaving(true);
    try {
      const payload = {
        nom: form.nom, type: form.type,
        description: form.description || undefined,
        ville: form.ville || undefined,
      };
      const updated = await api<Organisme>("/recruteurs/moi/organisme", { method: "PUT", body: payload });
      setData(updated);
      setMessage("Organisme mis a jour");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="pf-header">
        <div className="pf-header-copy">
          <h1>Mon organisme</h1>
          <p>Ces informations apparaitront sur toutes vos offres publiees.</p>
        </div>
      </div>

      {data && (
        <div className="rec-profile-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: ".75rem", alignItems: "center", marginBottom: ".5rem" }}>
            <div className="rec-avatar">{data.nom.slice(0, 2).toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 750 }}>{data.nom}</div>
              <div style={{ color: "var(--texte-muet)", fontSize: ".85rem" }}>
                {TYPES.find((t) => t.v === data.type)?.l ?? data.type}
                {data.verifie ? " - Verifie" : " - En attente de verification"}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={save} className="rec-profile-card" style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
        <label>Nom de l organisme*
          <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        </label>
        <label>Type
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </label>
        <label>Description
          <textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label>Ville
          <input value={form.ville ?? ""} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
        </label>
        {message && <div className="pf-alert pf-alert-success">{message}</div>}
        {erreur && <div className="pf-alert pf-alert-error">{erreur}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="pf-btn pf-btn-primary" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
        </div>
      </form>
    </div>
  );
}