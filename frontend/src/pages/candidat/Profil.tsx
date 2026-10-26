import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../../api";

interface Filiere { id: number; code: string; intitule: string }

interface ProfilMoi {
  utilisateur: { id: number; nom: string; email: string };
  profil: {
    niveauEtudes: string | null;
    filiereId: number | null;
    filiere: Filiere | null;
    etablissement: string | null;
    diplomes: string[];
    competences: string[];
    experience: string | null;
    aCv: boolean;
    cvNom: string | null;
    aPhoto: boolean;
  } | null;
}

function formatTaille(octets: number) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1048576) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / 1048576).toFixed(2)} Mo`;
}

export default function CandidatProfil() {
  const [data, setData] = useState<ProfilMoi | null>(null);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [form, setForm] = useState({
    niveauEtudes: "",
    filiereId: "",
    etablissement: "",
    diplomes: "",
    competences: "",
    experience: "",
  });
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [saving, setSaving] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvMessage, setCvMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charger = () => {
    api<ProfilMoi>("/profils/moi").then((d) => {
      setData(d);
      if (d.profil) {
        setForm({
          niveauEtudes: d.profil.niveauEtudes ?? "",
          filiereId: d.profil.filiereId ? String(d.profil.filiereId) : "",
          etablissement: d.profil.etablissement ?? "",
          diplomes: d.profil.diplomes.join(", "),
          competences: d.profil.competences.join(", "),
          experience: d.profil.experience ?? "",
        });
      }
    }).catch((e) => setErreur(e.message));
  };

  useEffect(() => {
    charger();
    api<Filiere[]>("/filieres").then(setFilieres).catch(() => {});
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(""); setErreur(""); setSaving(true);
    try {
      await api("/profils/moi", {
        method: "PUT",
        body: {
          niveauEtudes: form.niveauEtudes || undefined,
          filiereId: form.filiereId ? Number(form.filiereId) : undefined,
          etablissement: form.etablissement || undefined,
          diplomes: form.diplomes.split(",").map((s) => s.trim()).filter(Boolean),
          competences: form.competences.split(",").map((s) => s.trim()).filter(Boolean),
          experience: form.experience || undefined,
        },
      });
      setMessage("Profil enregistre avec succes");
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const uploadCv = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setCvMessage("Fichier trop volumineux (max 10 Mo)");
      return;
    }
    if (file.type !== "application/pdf") {
      setCvMessage("Seuls les fichiers PDF sont acceptes");
      return;
    }
    setCvUploading(true);
    setCvMessage("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] ?? result);
        };
        reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
        reader.readAsDataURL(file);
      });
      await api("/profils/moi/cv", { method: "POST", body: { cvPdf: base64, cvNom: file.name } });
      setCvMessage(`CV "${file.name}" envoye avec succes`);
      setCvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      charger();
    } catch (e) {
      setCvMessage(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setCvUploading(false);
    }
  };

  const surFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setCvFile(f);
      uploadCv(f);
    }
  };

  const surDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setCvFile(f);
      uploadCv(f);
    }
  };

  if (!data && !erreur) return <p className="muted">Chargement...</p>;

  return (
    <div>
      <div className="pf-header">
        <div className="pf-header-copy">
          <h1>Mon profil</h1>
          <p>Renseignez vos informations pour ameliorer vos recommandations.</p>
        </div>
      </div>

      {erreur && <div className="pf-alert pf-alert-error" style={{ marginBottom: "1rem" }}>{erreur}</div>}

      {/* CV upload */}
      <div className="cand-profil-card">
        <h3>Mon CV</h3>
        {data?.profil?.aCv && !cvFile ? (
          <div className="cand-cv-file">
            <div className="cand-cv-file-icon">📄</div>
            <div className="cand-cv-file-info">
              <div className="cand-cv-file-name">{data.profil.cvNom ?? "CV.pdf"}</div>
              <div className="cand-cv-file-size">CV uploade</div>
            </div>
            <div style={{ display: "flex", gap: ".4rem" }}>
              <a
                href="/api/profils/moi/cv"
                target="_blank"
                rel="noopener noreferrer"
                className="pf-btn"
                style={{ padding: ".4rem .75rem", fontSize: ".8rem" }}
              >
                Telecharger
              </a>
              <button
                type="button"
                className="pf-btn pf-btn-ghost"
                style={{ padding: ".4rem .75rem", fontSize: ".8rem" }}
                onClick={() => fileInputRef.current?.click()}
              >
                Remplacer
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`cand-cv-zone ${dragOver ? "dragging" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={surDrop}
          >
            <div className="cand-cv-icon">📄</div>
            <div className="cand-cv-title">
              {cvUploading ? "Envoi en cours..." : "Cliquez ou glissez votre CV"}
            </div>
            <div className="cand-cv-hint">PDF uniquement - max 10 Mo</div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: "none" }}
          onChange={surFichier}
        />
        {cvMessage && (
          <div className={`pf-alert ${cvMessage.includes("succes") ? "pf-alert-success" : "pf-alert-error"}`} style={{ marginTop: ".75rem" }}>
            {cvMessage}
          </div>
        )}
      </div>

      {/* Formulaire profil */}
      <form onSubmit={save}>
        <div className="cand-profil-card">
          <h3>Formation</h3>
          <label>
            Niveau d etudes
            <input
              value={form.niveauEtudes}
              onChange={(e) => setForm({ ...form, niveauEtudes: e.target.value })}
              placeholder="Licence 3, Master 1..."
            />
          </label>
          <label>
            Filiere
            <select value={form.filiereId} onChange={(e) => setForm({ ...form, filiereId: e.target.value })}>
              <option value="">-</option>
              {filieres.map((f) => (
                <option key={f.id} value={f.id}>{f.code} - {f.intitule}</option>
              ))}
            </select>
          </label>
          <label>
            Etablissement
            <input
              value={form.etablissement}
              onChange={(e) => setForm({ ...form, etablissement: e.target.value })}
              placeholder="INSI, Universite d Antananarivo..."
            />
          </label>
          <label>
            Diplomes (separes par virgule)
            <input
              value={form.diplomes}
              onChange={(e) => setForm({ ...form, diplomes: e.target.value })}
              placeholder="Licence Informatique 2025, Baccalaureat 2022"
            />
          </label>
        </div>

        <div className="cand-profil-card">
          <h3>Competences et experience</h3>
          <label>
            Competences (separes par virgule)
            <input
              value={form.competences}
              onChange={(e) => setForm({ ...form, competences: e.target.value })}
              placeholder="React, Node.js, PostgreSQL, Git"
            />
          </label>
          <label>
            Experience
            <textarea
              rows={4}
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              placeholder="Stages, projets, emplois precedents..."
            />
          </label>
        </div>

        {message && <div className="pf-alert pf-alert-success">{message}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button type="submit" className="pf-btn pf-btn-primary" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer mon profil"}
          </button>
        </div>
      </form>
    </div>
  );
}