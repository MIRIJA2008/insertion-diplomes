import { useEffect, useState } from "react";
import { api } from "../api";
import BackButton from "../components/BackButton";

interface Log { id: number; utilisateurId: number | null; action: string; details: string; creeLe: string; }

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[] | null>(null);
  useEffect(() => {
    api<Log[]>("/admin/audit").then(setLogs).catch(() => setLogs([]));
  }, []);

  return (
    <div>
      <BackButton />
      <div className="pf-header"><div className="pf-header-copy"><h1>Journal d audit</h1><p>Historique des actions sur la plateforme.</p></div></div>
      {logs === null && <p className="muted">Chargement...</p>}
      {logs !== null && logs.length === 0 && <p className="empty">Aucune activite enregistree.</p>}
      {logs !== null && logs.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "var(--surface-2)", textAlign: "left" }}><th style={{ padding: "1rem" }}>Date</th><th style={{ padding: "1rem" }}>Action</th><th style={{ padding: "1rem" }}>Details</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={{ borderTop: "1px solid var(--bord)" }}>
                  <td style={{ padding: "1rem", fontSize: ".85rem" }}>{new Date(l.creeLe).toLocaleString("fr-FR")}</td>
                  <td style={{ padding: "1rem" }}><span className="pf-chip pf-chip-violet">{l.action}</span></td>
                  <td style={{ padding: "1rem", fontSize: ".9rem" }}>{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
