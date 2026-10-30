import { useState } from "react";
import { api } from "../api";

export default function SuggestionButton() {
  const [open, setOpen] = useState(false);
  const [categorie, setCategorie] = useState("AMELIORATION");
  const [contenu, setContenu] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/suggestions", { method: "POST", body: { categorie, contenu } });
      setSent(true);
      setTimeout(() => { setOpen(false); setSent(false); setContenu(""); }, 2000);
    } catch (err) {
      alert("Erreur lors de l envoi");
    } finally { setLoading(false); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: "2rem", right: "2rem", zIndex: 90,
          width: "56px", height: "56px", borderRadius: "50%",
          background: "linear-gradient(135deg, var(--fusion-violet), var(--fusion-rose))",
          color: "white", border: "none", cursor: "pointer", fontSize: "1.5rem",
          boxShadow: "0 8px 24px rgba(139, 92, 246, 0.4)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}
        title="Suggérer une amélioration"
      >
        💡
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 100, display: "grid", placeItems: "center", padding: "1rem" }} onClick={() => setOpen(false)}>
          <div className="card" style={{ maxWidth: 480, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Boîte à idées</h2>
            <p className="muted" style={{ marginBottom: "1rem" }}>Aidez-nous à améliorer la plateforme.</p>

            {sent ? (
              <div className="pf-alert pf-alert-success">Merci ! Votre suggestion a bien été envoyée.</div>
            ) : (
              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <label>Catégorie
                  <select value={categorie} onChange={(e) => setCategorie(e.target.value)} style={{ width: "100%", padding: ".6rem", borderRadius: "8px", border: "1px solid var(--bord)", background: "var(--surface-2)" }}>
                    <option value="AMELIORATION">Amélioration de l interface</option>
                    <option value="FONCTIONNALITE">Nouvelle fonctionnalité</option>
                    <option value="BUG">Problème technique</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </label>
                <label>Votre idée
                  <textarea required rows={4} value={contenu} onChange={(e) => setContenu(e.target.value)} placeholder="Décrivez votre suggestion..." style={{ width: "100%", padding: ".6rem", borderRadius: "8px", border: "1px solid var(--bord)", background: "var(--surface-2)", fontFamily: "inherit" }} />
                </label>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: ".5rem" }}>
                  <button type="button" className="pf-btn pf-btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
                  <button type="submit" className="pf-btn pf-btn-primary" disabled={loading}>{loading ? "Envoi..." : "Envoyer"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
