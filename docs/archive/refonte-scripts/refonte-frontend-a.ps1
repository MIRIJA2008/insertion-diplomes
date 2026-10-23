# =============================================================
# REFONTE - PARTIE FRONTEND A : design system, theme, i18n,
# api, routes, composants, layout, pages publiques, auth, offres
# =============================================================
$racine = "F:\insertion-diplomes"
$utf8 = [System.Text.UTF8Encoding]::new($false)

function Ecrire([string]$rel, [string]$contenu) {
  $chemin = Join-Path $racine $rel
  $dossier = Split-Path $chemin -Parent
  if (-not (Test-Path $dossier)) { New-Item -ItemType Directory -Force -Path $dossier | Out-Null }
  [System.IO.File]::WriteAllText($chemin, $contenu, $utf8)
  Write-Host "OK  $rel"
}

# -------------------------------------------------------------
# 1. DESIGN SYSTEM (conserve TOUTES les classes des pages actuelles)
# -------------------------------------------------------------
Ecrire "frontend\src\index.css" @'
:root {
  --accent: #1f6f8b;
  --fond: #f4f6f9;
  --surface: #ffffff;
  --surface-2: #eef2f7;
  --texte: #111827;
  --texte-muet: #6b7280;
  --bord: #d9dee7;
  --bleu: #1f3864;
  --bleu-clair: #eef3fa;
  --gris: #6b7280;
  --rouge: #b91c1c;
  --vert: #166534;
  --orange: #b45309;
  --ombre: 0 6px 18px rgba(16, 42, 67, .08);
  --rayon: 12px;
}
[data-theme="sombre"] {
  --fond: #0b1626;
  --surface: #13233c;
  --surface-2: #1a2f4e;
  --texte: #e6ebf4;
  --texte-muet: #9aa7bd;
  --bord: #274063;
  --bleu: #8dbcf0;
  --bleu-clair: #16293f;
  --gris: #9aa7bd;
  --rouge: #f87171;
  --vert: #4ade80;
  --orange: #fbbf24;
  --ombre: 0 6px 18px rgba(0, 0, 0, .4);
}
* { box-sizing: border-box; }
html { transition: background-color .25s ease, color .25s ease; }
body { margin: 0; background: var(--fond); color: var(--texte); font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
h1, h2, h3 { color: var(--bleu); }
a { color: var(--accent); }
.muted { color: var(--texte-muet); }
.error { color: var(--rouge); background: rgba(185, 28, 28, .1); padding: .6rem .8rem; border-radius: 8px; }
.success { color: var(--vert); background: rgba(22, 101, 52, .1); padding: .6rem .8rem; border-radius: 8px; }
.warning { background: rgba(180, 83, 9, .12); color: var(--orange); border: 1px solid rgba(180, 83, 9, .35); padding: .7rem .9rem; border-radius: 8px; }
.dim { opacity: .55; }
.small { font-size: .8rem; margin: 0; }

label { font-size: .85rem; font-weight: 600; margin-top: .5rem; display: block; }
input, select, textarea {
  width: 100%; padding: .6rem .7rem; border: 1px solid var(--bord); border-radius: 8px;
  font-size: 1rem; font-family: inherit; background: var(--surface); color: var(--texte);
}
input:focus, select:focus, textarea:focus { outline: 2px solid var(--accent); border-color: var(--accent); }
button {
  padding: .6rem 1rem; border: 0; border-radius: 8px; background: var(--accent);
  color: #fff; font-size: .95rem; cursor: pointer;
}
button:hover { filter: brightness(1.08); }
button:disabled { opacity: .6; cursor: wait; }
button.secondary { background: transparent; border: 1px solid var(--bord); color: var(--texte); }
button.danger { background: var(--rouge); padding: .35rem .7rem; }
button.tab { background: var(--surface); color: var(--accent); border: 1px solid var(--accent); border-radius: 99px; padding: .3rem .8rem; }
button.tab.on { background: var(--accent); color: #fff; }
button.dark { color: var(--bleu); border-color: var(--bleu); }
.link-button { display: inline-block; margin-right: .5rem; padding: .5rem .9rem; border: 1px solid var(--accent); border-radius: 8px; color: var(--accent); text-decoration: none; }

.topbar { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; padding: .75rem 1.25rem; background: var(--surface); color: var(--texte); border-bottom: 1px solid var(--bord); }
.topbar nav { flex: 1; display: flex; gap: 1rem; }
.topbar a { color: var(--texte-muet); text-decoration: none; padding: .25rem .5rem; border-radius: 6px; }
.topbar a.active { color: var(--accent); background: rgba(31, 111, 139, .12); }
.topbar .user { display: flex; align-items: center; gap: .75rem; font-size: .9rem; }
.content { max-width: 1100px; margin: 0 auto; padding: 1.25rem; }

.card { background: var(--surface); border: 1px solid var(--bord); border-radius: var(--rayon); padding: 1.25rem; box-shadow: var(--ombre); }
.card.hoverable { transition: transform .15s ease, box-shadow .15s ease; }
.card.hoverable:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(16, 42, 67, .14); }

.table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--bord); border-radius: var(--rayon); }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: .65rem .8rem; border-bottom: 1px solid var(--bord); }
th { background: var(--surface-2); font-size: .85rem; color: var(--texte); }
td.actions { display: flex; gap: .4rem; justify-content: flex-end; }
.row-selected { background: var(--bleu-clair); }

.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: .8rem; margin: 1rem 0; }
.stat-card { background: var(--surface); border: 1px solid var(--bord); border-radius: var(--rayon); padding: 1rem; display: flex; flex-direction: column; gap: .25rem; box-shadow: var(--ombre); }
.stat-title { font-size: .85rem; color: var(--texte-muet); }
.stat-value { font-size: 1.7rem; color: var(--accent); }
.stat-detail { font-size: .8rem; }
.two-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.two-cols h3 { margin-top: 0; font-size: 1rem; color: var(--bleu); }
.bars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .7rem; }
.bar-head { display: flex; justify-content: space-between; gap: .5rem; font-size: .85rem; margin-bottom: .2rem; }
.bar-track { height: 10px; background: var(--surface-2); border-radius: 99px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--accent); }
.badge { margin-left: .5rem; font-size: .7rem; background: rgba(180, 83, 9, .18); color: var(--orange); padding: .1rem .4rem; border-radius: 99px; }

.statut { display: inline-block; font-size: .75rem; font-weight: 700; padding: .15rem .55rem; border-radius: 99px; }
.statut-BROUILLON { background: var(--surface-2); color: var(--texte-muet); }
.statut-OUVERTE { background: rgba(22, 101, 52, .15); color: var(--vert); }
.statut-CLOTUREE { background: rgba(185, 28, 28, .15); color: var(--rouge); }

.inline-form { display: grid; grid-template-columns: 1fr; gap: .6rem; margin-bottom: 1rem; }
.filters { display: grid; grid-template-columns: 1fr; gap: .75rem; margin-bottom: 1rem; }
@media (min-width: 700px) {
  .inline-form { grid-template-columns: 1fr 160px 160px auto; }
  .filters { grid-template-columns: repeat(3, 1fr); }
}
.choice { display: flex; align-items: center; gap: .6rem; padding: .7rem .8rem; border: 1px solid var(--bord); border-radius: 8px; font-weight: 400; margin-top: .25rem; cursor: pointer; background: var(--surface); }
.choice input { width: auto; }
.consent { background: var(--bleu-clair); }
.scale { display: flex; gap: .4rem; }
.scale .choice { flex: 1; justify-content: center; }
.public-page { max-width: 560px; margin: 0 auto; padding: 1rem; }
.public-page .card { display: flex; flex-direction: column; gap: .5rem; }
.public-page h1 { font-size: 1.25rem; margin: 0; }
.notice { background: var(--surface); border: 1px solid var(--bord); border-radius: var(--rayon); padding: 1.25rem; }
.tabs { display: flex; gap: .5rem; margin-top: .5rem; flex-wrap: wrap; }
.pager { display: flex; gap: 1rem; align-items: center; justify-content: center; margin-top: .5rem; }
.qr-box { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; border: 1px solid var(--bord); border-radius: var(--rayon); padding: 1rem; margin-top: .75rem; background: var(--surface); }
.actions-bar { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; }
.actions-bar select { width: auto; min-width: 180px; }
.detail { margin-top: 1.25rem; display: flex; flex-direction: column; gap: .5rem; }
.detail h3 { margin: 0; color: var(--bleu); }
.login-page { min-height: 100vh; display: grid; place-items: center; padding: 1rem; }
.login-card { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: .5rem; }
.login-card h1 { font-size: 1.3rem; margin: 0; }

/* ===== NOUVEAUX COMPOSANTS ===== */
.shell { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
.sidebar { background: var(--surface); border-right: 1px solid var(--bord); padding: 1rem .75rem; display: flex; flex-direction: column; gap: .25rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.sidebar .logo { font-weight: 800; color: var(--bleu); padding: .5rem .6rem 1rem; font-size: 1.05rem; }
.sidebar a { display: flex; align-items: center; gap: .6rem; padding: .55rem .7rem; border-radius: 8px; color: var(--texte-muet); text-decoration: none; font-size: .93rem; }
.sidebar a:hover { background: var(--surface-2); color: var(--texte); }
.sidebar a.active { background: rgba(31, 111, 139, .14); color: var(--accent); font-weight: 600; }
.sidebar .spacer { flex: 1; }
.main-col { display: flex; flex-direction: column; min-width: 0; }
.toprow { display: flex; align-items: center; gap: .75rem; padding: .7rem 1.25rem; background: var(--surface); border-bottom: 1px solid var(--bord); position: sticky; top: 0; z-index: 5; }
.toprow h1 { font-size: 1.05rem; margin: 0; flex: 1; }
.page { padding: 1.25rem; max-width: 1150px; width: 100%; margin: 0 auto; }
@media (max-width: 860px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; flex-direction: row; flex-wrap: wrap; align-items: center; border-right: 0; border-bottom: 1px solid var(--bord); }
  .sidebar .logo { width: 100%; padding-bottom: .25rem; }
  .sidebar .spacer { display: none; }
}

.public-header { display: flex; align-items: center; gap: 1rem; padding: .8rem 1.5rem; background: var(--surface); border-bottom: 1px solid var(--bord); position: sticky; top: 0; z-index: 10; flex-wrap: wrap; }
.public-header .brand { font-weight: 800; color: var(--bleu); font-size: 1.1rem; text-decoration: none; }
.public-header nav { flex: 1; display: flex; gap: .25rem; flex-wrap: wrap; }
.public-header nav a { color: var(--texte-muet); text-decoration: none; padding: .35rem .7rem; border-radius: 8px; font-size: .93rem; }
.public-header nav a:hover { background: var(--surface-2); color: var(--texte); }
.hero { background: linear-gradient(135deg, #1f3864 0%, var(--accent) 100%); color: #fff; padding: 3.5rem 1.5rem 4.5rem; text-align: center; }
.hero h1 { color: #fff; font-size: clamp(1.6rem, 4vw, 2.6rem); margin: 0 0 .8rem; }
.hero p { max-width: 640px; margin: 0 auto 1.5rem; font-size: 1.08rem; opacity: .95; }
.hero .actions { display: flex; gap: .8rem; justify-content: center; flex-wrap: wrap; }
.hero .link-button { background: #fff; color: #1f3864; border: 0; font-weight: 600; font-size: 1rem; padding: .75rem 1.4rem; border-radius: 10px; }
.hero-search { max-width: 720px; margin: -1.6rem auto 0; padding: 0 1rem; position: relative; z-index: 2; }
.hero-search .boite { display: flex; gap: .5rem; background: var(--surface); border: 1px solid var(--bord); border-radius: 14px; padding: .6rem; box-shadow: var(--ombre); }
.hero-search input { border: 0; flex: 1; background: transparent; color: var(--texte); }
.hero-search input:focus { outline: none; }
.section { max-width: 1150px; margin: 0 auto; padding: 2rem 1.25rem; }
.section h2 { margin-top: 0; }
.grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.offre-card { display: flex; flex-direction: column; gap: .5rem; }
.offre-card h3 { margin: 0; font-size: 1.05rem; color: var(--texte); }
.offre-meta { display: flex; flex-wrap: wrap; gap: .4rem; font-size: .82rem; color: var(--texte-muet); align-items: center; }
.chip { background: var(--surface-2); border-radius: 99px; padding: .15rem .6rem; font-size: .78rem; color: var(--texte-muet); }
.statut-badge { display: inline-flex; align-items: center; gap: .3rem; font-size: .75rem; font-weight: 700; padding: .18rem .6rem; border-radius: 99px; }
.statut-badge.OUVERTE { background: rgba(22, 101, 52, .15); color: var(--vert); }
.statut-badge.EXPIRE_BIENTOT { background: rgba(180, 83, 9, .16); color: var(--orange); }
.statut-badge.CLOTUREE { background: rgba(185, 28, 28, .15); color: var(--rouge); }
.footer { background: var(--surface); border-top: 1px solid var(--bord); margin-top: 3rem; padding: 2rem 1.5rem; }
.footer .colonnes { max-width: 1150px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; font-size: .9rem; color: var(--texte-muet); }
.footer h4 { color: var(--bleu); margin: 0 0 .5rem; }
.footer p { margin: .25rem 0; }
.notif-btn { position: relative; background: transparent; border: 1px solid var(--bord); color: var(--texte); padding: .45rem .6rem; }
.notif-btn .pastille { position: absolute; top: -6px; right: -6px; background: var(--rouge); color: #fff; font-size: .65rem; border-radius: 99px; padding: .05rem .35rem; }
.notif-panel { position: absolute; right: 0; top: 110%; width: 320px; max-height: 380px; overflow-y: auto; background: var(--surface); border: 1px solid var(--bord); border-radius: var(--rayon); box-shadow: var(--ombre); z-index: 50; }
.notif-panel .notif { padding: .6rem .8rem; border-bottom: 1px solid var(--bord); font-size: .85rem; }
.notif-panel .notif.non-lue { background: rgba(31, 111, 139, .08); }
.notif-panel .notif strong { display: block; }
.popover-wrap { position: relative; }
.select-lang { width: auto; padding: .4rem .5rem; font-size: .85rem; border-radius: 8px; background: var(--surface); color: var(--texte); border: 1px solid var(--bord); }
.theme-btn { background: transparent; border: 1px solid var(--bord); color: var(--texte); padding: .45rem .6rem; }
.accents { display: flex; gap: .6rem; flex-wrap: wrap; }
.accent-dot { width: 34px; height: 34px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; }
.accent-dot.actif { border-color: var(--texte); }
.conv-layout { display: grid; grid-template-columns: 280px 1fr; gap: 1rem; min-height: 420px; }
@media (max-width: 760px) { .conv-layout { grid-template-columns: 1fr; } }
.conv-liste { overflow-y: auto; max-height: 60vh; }
.conv-item { padding: .65rem .8rem; border-radius: 8px; cursor: pointer; }
.conv-item:hover { background: var(--surface-2); }
.conv-item.actif { background: rgba(31, 111, 139, .12); }
.msg-zone { display: flex; flex-direction: column; gap: .6rem; }
.msg-liste { flex: 1; overflow-y: auto; max-height: 48vh; display: flex; flex-direction: column; gap: .5rem; padding: .25rem; }
.msg-bulle { max-width: 75%; padding: .55rem .8rem; border-radius: 14px; background: var(--surface-2); font-size: .92rem; }
.msg-bulle.moi { align-self: flex-end; background: var(--accent); color: #fff; }
.msg-bulle .qui { display: block; font-size: .72rem; opacity: .75; margin-bottom: .15rem; }
.msg-form { display: flex; gap: .5rem; }
.msg-form input { flex: 1; }
.empty { text-align: center; color: var(--texte-muet); padding: 2rem 1rem; border: 1px dashed var(--bord); border-radius: var(--rayon); }
'@

# -------------------------------------------------------------
# 2. THEME
# -------------------------------------------------------------
Ecrire "frontend\src\theme.tsx" @'
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

export const ACCENTS: Record<string, string> = {
  bleu: "#1f6f8b",
  vert: "#15803d",
  rouge: "#b91c1c",
  violet: "#7c3aed",
  orange: "#c2410c",
  rose: "#be185d",
};

interface ThemeValue {
  sombre: boolean;
  basculerTheme: () => void;
  accent: string;
  definirAccent: (a: string) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [sombre, setSombre] = useState(() => localStorage.getItem("theme") === "sombre");
  const [accent, setAccent] = useState(() => localStorage.getItem("accent") ?? "bleu");

  useEffect(() => {
    document.documentElement.dataset.theme = sombre ? "sombre" : "clair";
    document.documentElement.style.setProperty("--accent", ACCENTS[accent] ?? ACCENTS.bleu);
    localStorage.setItem("theme", sombre ? "sombre" : "clair");
    localStorage.setItem("accent", accent);
  }, [sombre, accent]);

  const definirAccent = (a: string) => {
    setAccent(a);
    api("/profils/moi/preferences", { method: "PUT", body: { couleurAccent: a } }).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ sombre, basculerTheme: () => setSombre((s) => !s), accent, definirAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit etre utilise dans ThemeProvider");
  return ctx;
}
'@

# -------------------------------------------------------------
# 3. I18N FR / MG
# -------------------------------------------------------------
Ecrire "frontend\src\i18n\fr.ts" @'
export const fr = {
  "nav.home": "Accueil",
  "nav.offers": "Offres d'emploi",
  "nav.login": "Se connecter",
  "nav.register": "Creer un compte",
  "nav.logout": "Deconnexion",
  "nav.dashboard": "Tableau de bord",
  "nav.profile": "Mon profil",
  "nav.applications": "Mes candidatures",
  "nav.favorites": "Mes favoris",
  "nav.settings": "Parametres",
  "nav.messages": "Messages",
  "nav.communities": "Communautes",
  "nav.recruiter": "Espace recruteur",
  "nav.myOffers": "Mes offres",
  "nav.received": "Candidatures recues",
  "nav.organization": "Mon organisme",
  "nav.candidateSpace": "Espace candidat",
  "common.search": "Rechercher",
  "common.loading": "Chargement...",
  "common.error": "Une erreur est survenue",
  "common.save": "Enregistrer",
  "common.cancel": "Annuler",
  "common.back": "Retour",
  "common.all": "Tous",
  "common.none": "Aucun resultat",
  "common.actions": "Actions",
  "common.status": "Statut",
  "common.details": "Voir le detail",
  "common.edit": "Modifier",
  "common.delete": "Supprimer",
  "common.view": "Voir",
  "common.send": "Envoyer",
  "common.close": "Fermer",
  "common.language": "Langue",
  "common.theme": "Theme",
  "home.heroTitle": "Trouvez un emploi adapte a votre diplome",
  "home.heroSubtitle": "La plateforme nationale de suivi de l'insertion professionnelle des diplomes : offres d'emploi, communautes et outils pour les diplomes et les organismes recruteurs.",
  "home.searchPlaceholder": "Rechercher un poste, une competence, une organisation...",
  "home.ctaSearch": "Explorer les offres",
  "home.ctaRegister": "Creer un compte",
  "home.statsGraduates": "Diplomes suivis",
  "home.statsOffers": "Offres actives",
  "home.statsOrganizations": "Organismes verifies",
  "home.statsFields": "Filieres",
  "home.statsCandidates": "Candidats inscrits",
  "home.latestOffers": "Dernieres offres publiees",
  "home.categoriesTitle": "Categories d'organismes",
  "home.categoriesText": "Ministeres, administrations, entreprises privees et organisations partenaires publient leurs offres sur la plateforme.",
  "home.servicesTitle": "Nos services",
  "home.servicesText": "Recherche d'opportunites, candidatures en ligne, recommandations selon votre profil, communautes par filiere et messagerie professionnelle.",
  "home.footerAbout": "Plateforme de suivi de l'insertion professionnelle des diplomes.",
  "offer.deadline": "Date limite",
  "offer.apply": "Postuler",
  "offer.applied": "Candidature envoyee",
  "offer.favorite": "Favori",
  "offer.closedWarning": "Cette offre est cloturee : la candidature est impossible.",
  "offer.recommendations": "Offres recommandees pour votre profil",
  "offer.location": "Lieu",
  "offer.contract": "Contrat",
  "offer.level": "Niveau requis",
  "offer.skills": "Competences recherchees",
  "offer.profile": "Profil recherche",
  "offer.organization": "Organisme",
  "offer.applications": "candidature(s)",
  "offer.filterCity": "Ville",
  "offer.filterContract": "Type de contrat",
  "offer.filterField": "Filiere",
  "statut.OUVERTE": "Ouverte",
  "statut.EXPIRE_BIENTOT": "Expire bientot",
  "statut.CLOTUREE": "Cloturee",
  "auth.loginTitle": "Connexion",
  "auth.loginSubtitle": "Accedez a votre espace personnel",
  "auth.registerTitle": "Creation de compte",
  "auth.registerSubtitle": "Rejoignez la plateforme en quelques secondes",
  "auth.email": "E-mail",
  "auth.password": "Mot de passe",
  "auth.name": "Nom complet",
  "auth.accountType": "Type de compte",
  "auth.candidate": "Candidat (diplome)",
  "auth.recruiter": "Recruteur (organisme)",
  "auth.orgName": "Nom de l'organisme",
  "auth.orgType": "Type d'organisme",
  "auth.orgCity": "Ville",
  "auth.orgDescription": "Description",
  "auth.noAccount": "Pas encore de compte ?",
  "auth.hasAccount": "Deja un compte ?",
  "auth.loginButton": "Se connecter",
  "auth.registerButton": "S'inscrire",
  "cand.myApplications": "Mes candidatures",
  "cand.myFavorites": "Mes favoris",
  "cand.applicationDate": "Envoyee le",
  "cand.status.ENVOYEE": "Envoyee",
  "cand.status.VUE": "Vue",
  "cand.status.ACCEPTEE": "Acceptee",
  "cand.status.REFUSEE": "Refusee",
  "cand.coverLetter": "Lettre de motivation (facultative)",
  "cand.applySuccess": "Votre candidature a bien ete envoyee.",
  "cand.completion": "Profil complete a",
  "cand.welcome": "Bienvenue",
  "profil.level": "Niveau d'etudes",
  "profil.field": "Filiere",
  "profil.institution": "Etablissement",
  "profil.diplomas": "Diplomes (separes par des virgules)",
  "profil.skills": "Competences (separees par des virgules)",
  "profil.experience": "Experience professionnelle (facultative)",
  "profil.cv": "CV (PDF)",
  "profil.uploadCv": "Televerser le CV",
  "profil.viewCv": "Voir mon CV",
  "profil.saved": "Profil enregistre.",
  "recr.myOffers": "Mes offres",
  "recr.newOffer": "Publier une offre",
  "recr.editOffer": "Modifier l'offre",
  "recr.offerTitle": "Titre du poste",
  "recr.description": "Description du poste",
  "recr.requiredLevel": "Niveau d'etudes requis",
  "recr.searchedSkills": "Competences recherchees (virgules)",
  "recr.workLocation": "Lieu de travail",
  "recr.deadlineLabel": "Date limite de candidature (obligatoire)",
  "recr.publish": "Publier",
  "recr.receivedApplications": "Candidatures recues",
  "recr.applicant": "Candidat",
  "recr.markVUE": "Marquer vue",
  "recr.markACCEPTEE": "Accepter",
  "recr.markREFUSEE": "Refuser",
  "recr.orgInfos": "Informations de l'organisme",
  "recr.verified": "Organisme verifie",
  "recr.completeOrg": "Renseignez d'abord les informations de votre organisme.",
  "comm.title": "Communautes",
  "comm.new": "Creer une communaute",
  "comm.name": "Nom de la communaute",
  "comm.description": "Description",
  "comm.domain": "Domaine / centre d'interet",
  "comm.join": "Rejoindre",
  "comm.leave": "Quitter",
  "comm.members": "membre(s)",
  "comm.write": "Ecrire un message...",
  "msg.title": "Messagerie",
  "msg.new": "Nouvelle conversation",
  "msg.with": "Destinataire (identifiant utilisateur)",
  "msg.write": "Votre message...",
  "msg.empty": "Selectionnez une conversation.",
  "set.appearance": "Apparence",
  "set.accent": "Couleur principale de votre espace",
  "set.darkMode": "Mode sombre",
  "notif.title": "Notifications",
  "notif.readAll": "Tout marquer comme lu",
  "role.ADMIN": "Administrateur",
  "role.CONSULTANT": "Consultant",
  "role.CANDIDAT": "Candidat",
  "role.RECRUTEUR": "Recruteur",
} as const;
'@

Ecrire "frontend\src\i18n\mg.ts" @'
export const mg = {
  "nav.home": "Fandraisana",
  "nav.offers": "Asa fonosana",
  "nav.login": "Midira",
  "nav.register": "Misora kaonty",
  "nav.logout": "Miala",
  "nav.dashboard": "Tabilao fitarihana",
  "nav.profile": "Ny momba ahy",
  "nav.applications": "Ny fangatahako",
  "nav.favorites": "Ny tianao",
  "nav.settings": "Fikirana",
  "nav.messages": "Hafatra",
  "nav.communities": "Fiaraha-monina",
  "nav.recruiter": "Toeran'ny mpikapa olona",
  "nav.myOffers": "Ny asa nolazaiko",
  "nav.received": "Fangatahana voaray",
  "nav.organization": "Ny fikambanako",
  "nav.candidateSpace": "Toeran'ny kandida",
  "common.search": "Mitady",
  "common.loading": "Eo am-panatanterahana...",
  "common.error": "Nisy olana nitranga",
  "common.save": "Tehirizo",
  "common.cancel": "Aza ovaina",
  "common.back": "Miverina",
  "common.all": "Rehetra",
  "common.none": "Tsy misy vokany",
  "common.actions": "Hetsika",
  "common.status": "Toerany",
  "common.details": "Hijery antsipiriany",
  "common.edit": "Hanova",
  "common.delete": "Hamafa",
  "common.view": "Hijery",
  "common.send": "Alefaso",
  "common.close": "Akatona",
  "common.language": "Fiteny",
  "common.theme": "Endrika",
  "home.heroTitle": "Mahita asa mifanaraka amin'ny diplaomanao",
  "home.heroSubtitle": "Sehatra fanaraha-maso ny fahatonian'ny diplaoma: asa fonosana, fiaraha-monina ary fitaovana ho an'ny diplaoma sy ny fikambanana mpikapa.",
  "home.searchPlaceholder": "Mitady asa, fahaizana, fikambana...",
  "home.ctaSearch": "Hijery ny asa",
  "home.ctaRegister": "Hamorona kaonty",
  "home.statsGraduates": "Diplaoma arahina",
  "home.statsOffers": "Asa mbola misokatra",
  "home.statsOrganizations": "Fikambanana voamarina",
  "home.statsFields": "Filiera",
  "home.statsCandidates": "Kandida voasoratra",
  "home.latestOffers": "Asa navoakany farany",
  "home.categoriesTitle": "Karazana fikambanana",
  "home.categoriesText": "Minisitera, fanjakana, orinasa tsy miankina ary fikambanana mifandray dia mambara ny asa eo amin'ny sehatra.",
  "home.servicesTitle": "Ny tolotray",
  "home.servicesText": "Fikarohana asa, fangatahana an-tserasera, torohevitra arakaraka ny mombamomba anao, fiaraha-monina isaky ny filiera ary hafatra matihanina.",
  "home.footerAbout": "Sehatra fanaraha-maso ny fahatonian'ny diplaoma.",
  "offer.deadline": "Daty fahataperana",
  "offer.apply": "Handefa fangatahana",
  "offer.applied": "Fangatahana efa alefa",
  "offer.favorite": "Tiana",
  "offer.closedWarning": "Tapitra ity asa ity: tsy afaka mandefa fangatahana intsony.",
  "offer.recommendations": "Asa toloina ho an'ny mombamomba anao",
  "offer.location": "Toerana",
  "offer.contract": "Fifanarahana",
  "offer.level": "Haavony ilaina",
  "offer.skills": "Fahaizana tadiavina",
  "offer.profile": "Endrika tadiavina",
  "offer.organization": "Fikambanana",
  "offer.applications": "fangatahana",
  "offer.filterCity": "Tanana",
  "offer.filterContract": "Karazana fifanarahana",
  "offer.filterField": "Filiera",
  "statut.OUVERTE": "Mbola misokatra",
  "statut.EXPIRE_BIENTOT": "Ho tapitra haingana",
  "statut.CLOTUREE": "Tapitra",
  "auth.loginTitle": "Fidirana",
  "auth.loginSubtitle": "Midira ao amin'ny toeranao manokana",
  "auth.registerTitle": "Famoronana kaonty",
  "auth.registerSubtitle": "Midira ao amin'ny sehatra amin'ny fotoana fohy",
  "auth.email": "Mailaka",
  "auth.password": "Tenimiafina",
  "auth.name": "Anarana feno",
  "auth.accountType": "Karazana kaonty",
  "auth.candidate": "Kandida (diplaoma)",
  "auth.recruiter": "Mpikapa (fikambanana)",
  "auth.orgName": "Anaran'ny fikambanana",
  "auth.orgType": "Karazana fikambanana",
  "auth.orgCity": "Tanana",
  "auth.orgDescription": "Famintinana",
  "auth.noAccount": "Mbola tsy manana kaonty ?",
  "auth.hasAccount": "Efa manana kaonty ?",
  "auth.loginButton": "Midira",
  "auth.registerButton": "Misora anarana",
  "cand.myApplications": "Ny fangatahako",
  "cand.myFavorites": "Ny tianao",
  "cand.applicationDate": "Nalefa ny",
  "cand.status.ENVOYEE": "Nalefa",
  "cand.status.VUE": "Voajery",
  "cand.status.ACCEPTEE": "Voakasika",
  "cand.status.REFUSEE": "Tsy voakasika",
  "cand.coverLetter": "Taratasy fanentanana (tsy voatery)",
  "cand.applySuccess": "Voalema soa aman-tsara ny fangatahanao.",
  "cand.completion": "Fenoina ny mombamomba anao",
  "cand.welcome": "Tongasoa",
  "profil.level": "Haavony fianarana",
  "profil.field": "Filiera",
  "profil.institution": "Sekoly / toeram-pianarana",
  "profil.diplomas": "Diplaoma (sasany amin'ny faingo)",
  "profil.skills": "Fahaizana (sasany amin'ny faingo)",
  "profil.experience": "Traikefa amin'ny asa (tsy voatery)",
  "profil.cv": "CV (PDF)",
  "profil.uploadCv": "Ampidiro ny CV",
  "profil.viewCv": "Hijery ny CV-ko",
  "profil.saved": "Voatahiry ny mombamomba anao.",
  "recr.myOffers": "Ny asa nolazaiko",
  "recr.newOffer": "Hanambara asa",
  "recr.editOffer": "Hanova ny asa",
  "recr.offerTitle": "Lohatenin'ny toerana",
  "recr.description": "Famintin'ny asa",
  "recr.requiredLevel": "Haavony fianarana ilaina",
  "recr.searchedSkills": "Fahaizana tadiavina (faingo)",
  "recr.workLocation": "Toerana iasan'ny asa",
  "recr.deadlineLabel": "Daty fahataperana (tsa maintsy fenoina)",
  "recr.publish": "Hamoaka",
  "recr.receivedApplications": "Fangatahana voaray",
  "recr.applicant": "Kandida",
  "recr.markVUE": "Marihina ho voajery",
  "recr.markACCEPTEE": "Ekena",
  "recr.markREFUSEE": "Lavina",
  "recr.orgInfos": "Momba ny fikambanana",
  "recr.verified": "Fikambanana voamarina",
  "recr.completeOrg": "Fenoy aloha ny momba ny fikambananao.",
  "comm.title": "Fiaraha-monina",
  "comm.new": "Hamorona fiaraha-monina",
  "comm.name": "Anaran'ny fiaraha-monina",
  "comm.description": "Famintinana",
  "comm.domain": "Sehatra / zavatra tiana",
  "comm.join": "Hiditra",
  "comm.leave": "Hiala",
  "comm.members": "mpikambana",
  "comm.write": "Manorata hafatra...",
  "msg.title": "Hafatra",
  "msg.new": "Resaka vaovao",
  "msg.with": "Mpandray (laharan'ny mpampiasa)",
  "msg.write": "Ny hafatrao...",
  "msg.empty": "Misafidiana resaka iray.",
  "set.appearance": "Endrika hita",
  "set.accent": "Loko fototry ny toeranao",
  "set.darkMode": "Endrika maizina",
  "notif.title": "Fampahatsiahivana",
  "notif.readAll": "Marihina ho voajarimaina rehetra",
  "role.ADMIN": "Mpitantana",
  "role.CONSULTANT": "Mpanolo-tsaina",
  "role.CANDIDAT": "Kandida",
  "role.RECRUTEUR": "Mpikapa",
} as const;
'@

Ecrire "frontend\src\i18n\index.tsx" @'
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fr } from "./fr";
import { mg } from "./mg";

export type Langue = "fr" | "mg";

const DICTIONNAIRES: Record<Langue, Record<string, string>> = { fr, mg };

interface I18nValue {
  langue: Langue;
  definirLangue: (l: Langue) => void;
  t: (cle: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>(() =>
    (localStorage.getItem("langue") as Langue) === "mg" ? "mg" : "fr"
  );

  useEffect(() => {
    localStorage.setItem("langue", langue);
    document.documentElement.lang = langue;
  }, [langue]);

  const definirLangue = (l: Langue) => setLangue(l);
  const t = (cle: string) => DICTIONNAIRES[langue][cle] ?? DICTIONNAIRES.fr[cle] ?? cle;

  return <I18nContext.Provider value={{ langue, definirLangue, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit etre utilise dans I18nProvider");
  return ctx;
}
'@

# -------------------------------------------------------------
# 4. api.ts etendu
# -------------------------------------------------------------
Ecrire "frontend\src\api.ts" @'
export type Role = "ADMIN" | "CONSULTANT" | "CANDIDAT" | "RECRUTEUR";

export interface User {
  id: number;
  nom: string;
  email: string;
  role: Role;
  langue?: string;
  couleurAccent?: string;
}

export interface Session {
  token: string;
  user: User;
}

const KEY = "session";

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session | null) {
  if (session) sessionStorage.setItem(KEY, JSON.stringify(session));
  else sessionStorage.removeItem(KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface Options {
  method?: string;
  body?: unknown;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const session = getSession();
  const hasBody = options.body !== undefined;
  const res = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && session) {
      setSession(null);
      window.location.assign("/login");
    }
    const details = Array.isArray(data?.details)
      ? data.details.map((d: { champ: string; message: string }) => `${d.champ} : ${d.message}`).join(" ; ")
      : "";
    throw new ApiError(res.status, [data?.error ?? "Une erreur est survenue", details].filter(Boolean).join(" - "));
  }
  return data as T;
}

export interface Offre {
  id: number;
  titre: string;
  description: string;
  niveauRequis: string | null;
  filiereId: number | null;
  filiere?: { id: number; code: string; intitule: string } | null;
  competencesRecherchees: string[];
  profilRecherche: string | null;
  lieu: string;
  typeContrat: string | null;
  dateLimite: string;
  creeLe: string;
  statut: "OUVERTE" | "EXPIRE_BIENTOT" | "CLOTUREE";
  nbCandidatures: number;
  score?: number;
  organisme: { id: number; nom: string; type: string; ville: string | null; verifie: boolean };
}

export interface Candidature {
  id: number;
  statut: "ENVOYEE" | "VUE" | "ACCEPTEE" | "REFUSEE";
  dateEnvoi: string;
  offre: { id: number; titre: string; dateLimite: string; organisme?: { nom: string } };
  candidat?: { id: number; nom: string; email: string; profilCandidat?: { filiere?: { code: string }; competences: string[]; experience: string | null } | null };
}

export interface Notification {
  id: number;
  titre: string;
  contenu: string;
  lue: boolean;
  creeLe: string;
}
'@

# -------------------------------------------------------------
# 5. main.tsx et App.tsx
# -------------------------------------------------------------
Ecrire "frontend\src\main.tsx" @'
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth";
import { ThemeProvider } from "./theme";
import { I18nProvider } from "./i18n";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
'@

Ecrire "frontend\src\App.tsx" @'
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import AppLayout from "./pages/layout/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Offres from "./pages/Offres";
import OffreDetail from "./pages/OffreDetail";
import Enquete from "./pages/Enquete";
import Dashboard from "./pages/Dashboard";
import Filieres from "./pages/Filieres";
import Campagnes from "./pages/Campagnes";
import CandidatAccueil from "./pages/candidat/Accueil";
import CandidatProfil from "./pages/candidat/Profil";
import CandidatSuivi from "./pages/candidat/Suivi";
import CandidatFavoris from "./pages/candidat/Favoris";
import CandidatParametres from "./pages/candidat/Parametres";
import RecruteurAccueil from "./pages/recruteur/Accueil";
import RecruteurMesOffres from "./pages/recruteur/MesOffres";
import RecruteurRecu from "./pages/recruteur/Recu";
import RecruteurOrganisme from "./pages/recruteur/Organisme";
import Communautes from "./pages/Communautes";
import Messagerie from "./pages/Messagerie";

function AccueilSelonRole() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case "ADMIN":
    case "CONSULTANT":
      return <Navigate to="/tableau-de-bord" replace />;
    case "RECRUTEUR":
      return <Navigate to="/recruteur" replace />;
    default:
      return <Navigate to="/candidat" replace />;
  }
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/offres" element={<Offres />} />
      <Route path="/offres/:id" element={<OffreDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/inscription" element={<Register />} />
      <Route path="/enquete/:jeton" element={<Enquete />} />

      <Route element={<AppLayout />}>
        <Route path="/tableau-de-bord" element={<Dashboard />} />
        <Route path="/filieres" element={<Filieres />} />
        <Route path="/campagnes" element={<Campagnes />} />
        <Route path="/candidat" element={<CandidatAccueil />} />
        <Route path="/candidat/profil" element={<CandidatProfil />} />
        <Route path="/candidat/candidatures" element={<CandidatSuivi />} />
        <Route path="/candidat/favoris" element={<CandidatFavoris />} />
        <Route path="/candidat/parametres" element={<CandidatParametres />} />
        <Route path="/recruteur" element={<RecruteurAccueil />} />
        <Route path="/recruteur/offres" element={<RecruteurMesOffres />} />
        <Route path="/recruteur/candidatures" element={<RecruteurRecu />} />
        <Route path="/recruteur/organisme" element={<RecruteurOrganisme />} />
        <Route path="/communautes" element={<Communautes />} />
        <Route path="/messages" element={<Messagerie />} />
      </Route>

      <Route path="*" element={<AccueilSelonRole />} />
    </Routes>
  );
}
'@

# -------------------------------------------------------------
# 6. Composants reutilisables
# -------------------------------------------------------------
Ecrire "frontend\src\components\ThemeToggle.tsx" @'
import { useTheme } from "../theme";

export default function ThemeToggle() {
  const { sombre, basculerTheme } = useTheme();
  return (
    <button type="button" className="theme-btn" onClick={basculerTheme} title={sombre ? "Mode clair" : "Mode sombre"}>
      {sombre ? "Clair" : "Sombre"}
    </button>
  );
}
'@

Ecrire "frontend\src\components\LanguageSelector.tsx" @'
import { useI18n, type Langue } from "../i18n";
import { api } from "../api";

export default function LanguageSelector() {
  const { langue, definirLangue } = useI18n();
  const changer = (l: Langue) => {
    definirLangue(l);
    api("/profils/moi/preferences", { method: "PUT", body: { langue: l } }).catch(() => {});
  };
  return (
    <select className="select-lang" value={langue} onChange={(e) => changer(e.target.value as Langue)} aria-label="Langue">
      <option value="fr">Fran\u00E7ais</option>
      <option value="mg">Malagasy</option>
    </select>
  );
}
'@

Ecrire "frontend\src\components\StatutBadge.tsx" @'
import { useI18n } from "../i18n";

export default function StatutBadge({ statut }: { statut: string }) {
  const { t } = useI18n();
  return <span className={`statut-badge ${statut}`}>{t(`statut.${statut}`)}</span>;
}
'@

Ecrire "frontend\src\components\OffreCard.tsx" @'
import { Link } from "react-router-dom";
import type { Offre } from "../api";
import { useI18n } from "../i18n";
import StatutBadge from "./StatutBadge";

export default function OffreCard({ offre }: { offre: Offre }) {
  const { t } = useI18n();
  return (
    <div className="card hoverable offre-card">
      <div className="offre-meta">
        <StatutBadge statut={offre.statut} />
        <span className="chip">{offre.typeContrat ?? "-"}</span>
        <span>{offre.lieu}</span>
      </div>
      <h3>{offre.titre}</h3>
      <p className="muted small">
        {offre.organisme?.nom} {offre.organisme?.verifie ? "(verifie)" : ""}
      </p>
      {offre.filiere && <p className="small muted">{offre.filiere.code} - {offre.filiere.intitule}</p>}
      <p className="small muted">
        {t("offer.deadline")} : {new Date(offre.dateLimite).toLocaleDateString("fr-FR")} \u00B7 {offre.nbCandidatures} {t("offer.applications")}
      </p>
      <Link className="link-button" to={`/offres/${offre.id}`}>{t("common.details")}</Link>
    </div>
  );
}
'@

# -------------------------------------------------------------
# 7. Coquille applicative
# -------------------------------------------------------------
Ecrire "frontend\src\pages\layout\AppLayout.tsx" @'
import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";
import { api, type Notification } from "../../api";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageSelector from "../../components/LanguageSelector";

function Contenu() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    api<Notification[]>("/notifications").then(setNotifs).catch(() => {});
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const nonLues = notifs.filter((n) => !n.lue).length;
  const admin = user.role === "ADMIN" || user.role === "CONSULTANT";

  const toutLire = () => {
    api("/notifications/tout-lire", { method: "PATCH" }).then(() =>
      setNotifs((ns) => ns.map((n) => ({ ...n, lue: true })))
    );
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">Insertion diplomes</div>

        {admin && (
          <>
            <NavLink to="/tableau-de-bord">Tableau de bord</NavLink>
            <NavLink to="/filieres">Filieres</NavLink>
            {user.role === "ADMIN" && <NavLink to="/campagnes">Campagnes</NavLink>}
            <NavLink to="/offres">Offres d'emploi</NavLink>
            <NavLink to="/communautes">Communautes</NavLink>
            <NavLink to="/messages">Messages</NavLink>
          </>
        )}

        {user.role === "CANDIDAT" && (
          <>
            <NavLink to="/candidat">{t("nav.candidateSpace")}</NavLink>
            <NavLink to="/offres">{t("nav.offers")}</NavLink>
            <NavLink to="/candidat/profil">{t("nav.profile")}</NavLink>
            <NavLink to="/candidat/candidatures">{t("nav.applications")}</NavLink>
            <NavLink to="/candidat/favoris">{t("nav.favorites")}</NavLink>
            <NavLink to="/communautes">{t("nav.communities")}</NavLink>
            <NavLink to="/messages">{t("nav.messages")}</NavLink>
            <NavLink to="/candidat/parametres">{t("nav.settings")}</NavLink>
          </>
        )}

        {user.role === "RECRUTEUR" && (
          <>
            <NavLink to="/recruteur">{t("nav.recruiter")}</NavLink>
            <NavLink to="/recruteur/organisme">{t("nav.organization")}</NavLink>
            <NavLink to="/recruteur/offres">{t("nav.myOffers")}</NavLink>
            <NavLink to="/recruteur/candidatures">{t("nav.received")}</NavLink>
            <NavLink to="/communautes">{t("nav.communities")}</NavLink>
            <NavLink to="/messages">{t("nav.messages")}</NavLink>
          </>
        )}

        <div className="spacer" />
        <button className="secondary" onClick={logout}>{t("nav.logout")}</button>
      </aside>

      <div className="main-col">
        <div className="toprow">
          <h1>{t(`role.${user.role}`)} \u00B7 {user.nom}</h1>
          <div className="popover-wrap">
            <button type="button" className="notif-btn" onClick={() => setOuvert((o) => !o)}>
              Notifications
              {nonLues > 0 && <span className="pastille">{nonLues}</span>}
            </button>
            {ouvert && (
              <div className="notif-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".5rem .8rem" }}>
                  <strong>{t("notif.title")}</strong>
                  <button className="secondary" style={{ padding: ".2rem .5rem", fontSize: ".78rem" }} onClick={toutLire}>
                    {t("notif.readAll")}
                  </button>
                </div>
                {notifs.length === 0 && <p className="muted small" style={{ padding: ".5rem .8rem" }}>{t("common.none")}</p>}
                {notifs.map((n) => (
                  <div key={n.id} className={`notif ${n.lue ? "" : "non-lue"}`}>
                    <strong>{n.titre}</strong>
                    {n.contenu}
                  </div>
                ))}
              </div>
            )}
          </div>
          <LanguageSelector />
          <ThemeToggle />
        </div>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return <Contenu />;
}
'@

# -------------------------------------------------------------
# 8. Accueil public
# -------------------------------------------------------------
Ecrire "frontend\src\pages\Home.tsx" @'
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Offre } from "../api";
import { useI18n } from "../i18n";
import { useAuth } from "../auth";
import OffreCard from "../components/OffreCard";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";

interface Accueil {
  stats: { diplomes: number; offres: number; organismes: number; filieres: number; candidats: number };
  categories: string[];
  dernieresOffres: Offre[];
}

export default function Home() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donnees, setDonnees] = useState<Accueil | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api<Accueil>("/public/accueil").then(setDonnees).catch(() => {});
  }, []);

  const chercher = (e: FormEvent) => {
    e.preventDefault();
    navigate(q ? `/offres?q=${encodeURIComponent(q)}` : "/offres");
  };

  const stats = donnees
    ? [
        [t("home.statsGraduates"), donnees.stats.diplomes],
        [t("home.statsOffers"), donnees.stats.offres],
        [t("home.statsOrganizations"), donnees.stats.organismes],
        [t("home.statsFields"), donnees.stats.filieres],
        [t("home.statsCandidates"), donnees.stats.candidats],
      ]
    : [];

  return (
    <div>
      <header className="public-header">
        <Link to="/" className="brand">Insertion diplomes</Link>
        <nav>
          <Link to="/">{t("nav.home")}</Link>
          <Link to="/offres">{t("nav.offers")}</Link>
        </nav>
        <LanguageSelector />
        <ThemeToggle />
        {user ? (
          <Link className="link-button" to="/candidat">{t("nav.dashboard")}</Link>
        ) : (
          <>
            <Link className="link-button" to="/login">{t("nav.login")}</Link>
            <Link className="link-button" to="/inscription" style={{ background: "var(--accent)", color: "#fff", border: 0 }}>
              {t("nav.register")}
            </Link>
          </>
        )}
      </header>

      <section className="hero">
        <h1>{t("home.heroTitle")}</h1>
        <p>{t("home.heroSubtitle")}</p>
        <div className="actions">
          <Link className="link-button" to="/offres">{t("home.ctaSearch")}</Link>
          <Link className="link-button" to="/inscription">{t("home.ctaRegister")}</Link>
        </div>
      </section>

      <div className="hero-search">
        <form className="boite" onSubmit={chercher}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("home.searchPlaceholder")} />
          <button type="submit">{t("common.search")}</button>
        </form>
      </div>

      {donnees && (
        <section className="section">
          <div className="stat-grid">
            {stats.map(([titre, valeur]) => (
              <div key={titre} className="stat-card">
                <span className="stat-title">{titre}</span>
                <strong className="stat-value">{valeur}</strong>
              </div>
            ))}
          </div>

          <h2>{t("home.servicesTitle")}</h2>
          <div className="card"><p>{t("home.servicesText")}</p></div>

          <h2>{t("home.categoriesTitle")}</h2>
          <p className="muted">{t("home.categoriesText")}</p>
          <div className="actions-bar" style={{ marginBottom: "1rem" }}>
            {donnees.categories.map((c) => <span key={c} className="chip">{c.replace(/_/g, " ")}</span>)}
          </div>

          <h2>{t("home.latestOffers")}</h2>
          {donnees.dernieresOffres.length === 0 ? (
            <p className="empty">{t("common.none")}</p>
          ) : (
            <div className="grille">
              {donnees.dernieresOffres.map((o) => <OffreCard key={o.id} offre={o} />)}
            </div>
          )}
        </section>
      )}

      <footer className="footer">
        <div className="colonnes">
          <div>
            <h4>Insertion diplomes</h4>
            <p>{t("home.footerAbout")}</p>
          </div>
          <div>
            <h4>{t("nav.offers")}</h4>
            <p><Link to="/offres">{t("home.ctaSearch")}</Link></p>
            <p><Link to="/inscription">{t("home.ctaRegister")}</Link></p>
          </div>
          <div>
            <h4>{t("common.language")}</h4>
            <p>Fran\u00E7ais \u00B7 Malagasy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
'@

# -------------------------------------------------------------
# 9. Login / Inscription / Offres
# -------------------------------------------------------------
Ecrire "frontend\src\pages\Login.tsx" @'
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";

export default function Login() {
  const { user, login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await login(email, motDePasse);
      navigate("/", { replace: true });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" className="muted small">&larr; {t("nav.home")}</Link>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
        <h1>{t("auth.loginTitle")}</h1>
        <p className="muted">{t("auth.loginSubtitle")}</p>

        <form onSubmit={soumettre} style={{ display: "flex", flexDirection: "column", gap: ".25rem" }}>
          <label htmlFor="email">{t("auth.email")}</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor="mdp">{t("auth.password")}</label>
          <input id="mdp" type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />

          {erreur && <p className="error" role="alert">{erreur}</p>}
          <button type="submit" disabled={chargement}>{chargement ? "..." : t("auth.loginButton")}</button>
        </form>

        <p className="muted small">
          {t("auth.noAccount")} <Link to="/inscription">{t("nav.register")}</Link>
        </p>
      </div>
    </div>
  );
}
'@

Ecrire "frontend\src\pages\Register.tsx" @'
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useI18n } from "../i18n";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";

export default function Register() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [role, setRole] = useState<"CANDIDAT" | "RECRUTEUR">("CANDIDAT");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [orgNom, setOrgNom] = useState("");
  const [orgType, setOrgType] = useState("ENTREPRISE_PRIVEE");
  const [orgVille, setOrgVille] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await api("/inscription", {
        method: "POST",
        body: {
          nom, email, motDePasse, role,
          ...(role === "RECRUTEUR"
            ? { organisme: { nom: orgNom, type: orgType, ville: orgVille || undefined, description: orgDescription || undefined } }
            : {}),
        },
      });
      navigate("/login");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Inscription impossible");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card login-card" style={{ maxWidth: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" className="muted small">&larr; {t("nav.home")}</Link>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
        <h1>{t("auth.registerTitle")}</h1>
        <p className="muted">{t("auth.registerSubtitle")}</p>

        <form onSubmit={soumettre} style={{ display: "flex", flexDirection: "column", gap: ".25rem" }}>
          <label>{t("auth.accountType")}</label>
          <div className="choice">
            <input type="radio" id="r-cand" checked={role === "CANDIDAT"} onChange={() => setRole("CANDIDAT")} />
            <label htmlFor="r-cand" style={{ margin: 0, fontWeight: 400 }}>{t("auth.candidate")}</label>
          </div>
          <div className="choice">
            <input type="radio" id="r-recr" checked={role === "RECRUTEUR"} onChange={() => setRole("RECRUTEUR")} />
            <label htmlFor="r-recr" style={{ margin: 0, fontWeight: 400 }}>{t("auth.recruiter")}</label>
          </div>

          <label htmlFor="nom">{t("auth.name")}</label>
          <input id="nom" required value={nom} onChange={(e) => setNom(e.target.value)} />

          <label htmlFor="email">{t("auth.email")}</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor="mdp">{t("auth.password")} (min. 8)</label>
          <input id="mdp" type="password" minLength={8} required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />

          {role === "RECRUTEUR" && (
            <>
              <label htmlFor="org-nom">{t("auth.orgName")}</label>
              <input id="org-nom" required value={orgNom} onChange={(e) => setOrgNom(e.target.value)} />
              <label htmlFor="org-type">{t("auth.orgType")}</label>
              <select id="org-type" value={orgType} onChange={(e) => setOrgType(e.target.value)}>
                <option value="MINISTERE">Ministere</option>
                <option value="ADMINISTRATION">Administration publique</option>
                <option value="ENTREPRISE_PRIVEE">Entreprise privee</option>
                <option value="ONG">ONG / association</option>
                <option value="AUTRE">Autre</option>
              </select>
              <label htmlFor="org-ville">{t("auth.orgCity")}</label>
              <input id="org-ville" value={orgVille} onChange={(e) => setOrgVille(e.target.value)} />
              <label htmlFor="org-desc">{t("auth.orgDescription")}</label>
              <textarea id="org-desc" rows={2} value={orgDescription} onChange={(e) => setOrgDescription(e.target.value)} />
            </>
          )}

          {erreur && <p className="error" role="alert">{erreur}</p>}
          <button type="submit" disabled={chargement}>{chargement ? "..." : t("auth.registerButton")}</button>
        </form>

        <p className="muted small">
          {t("auth.hasAccount")} <Link to="/login">{t("auth.loginTitle")}</Link>
        </p>
      </div>
    </div>
  );
}
'@

Ecrire "frontend\src\pages\Offres.tsx" @'
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api, type Offre } from "../api";
import { useI18n } from "../i18n";
import OffreCard from "../components/OffreCard";

interface Filiere { id: number; code: string; intitule: string }

export default function Offres() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [offres, setOffres] = useState<Offre[] | null>(null);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [ville, setVille] = useState(params.get("ville") ?? "");
  const [typeContrat, setTypeContrat] = useState(params.get("typeContrat") ?? "");
  const [filiereId, setFiliereId] = useState(params.get("filiereId") ?? "");

  useEffect(() => {
    api<Filiere[]>("/filieres").then(setFilieres).catch(() => {});
  }, []);

  const charger = () => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (ville) p.set("ville", ville);
    if (typeContrat) p.set("typeContrat", typeContrat);
    if (filiereId) p.set("filiereId", filiereId);
    setParams(p);
    setOffres(null);
    api<Offre[]>(`/offres?${p.toString()}`).then(setOffres).catch(() => setOffres([]));
  };

  useEffect(charger, []);

  const filtrer = (e: FormEvent) => {
    e.preventDefault();
    charger();
  };

  return (
    <section>
      <h2>{t("nav.offers")}</h2>
      <form className="card filters" onSubmit={filtrer} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div>
          <label>{t("common.search")}</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("home.searchPlaceholder")} />
        </div>
        <div>
          <label>{t("offer.filterCity")}</label>
          <input value={ville} onChange={(e) => setVille(e.target.value)} />
        </div>
        <div>
          <label>{t("offer.filterContract")}</label>
          <select value={typeContrat} onChange={(e) => setTypeContrat(e.target.value)}>
            <option value="">{t("common.all")}</option>
            {["CDI", "CDD", "STAGE", "INDEPENDANT", "OCCASIONNEL"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>{t("offer.filterField")}</label>
          <select value={filiereId} onChange={(e) => setFiliereId(e.target.value)}>
            <option value="">{t("common.all")}</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} - {f.intitule}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button type="submit">{t("common.search")}</button>
        </div>
      </form>

      {offres === null && <p className="muted">{t("common.loading")}</p>}
      {offres !== null && offres.length === 0 && <p className="empty">{t("common.none")}</p>}
      {offres !== null && offres.length > 0 && (
        <div className="grille">
          {offres.map((o) => <OffreCard key={o.id} offre={o} />)}
        </div>
      )}
    </section>
  );
}
'@

Ecrire "frontend\src\pages\OffreDetail.tsx" @'
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Offre } from "../api";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";
import StatutBadge from "../components/StatutBadge";

export default function OffreDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const [offre, setOffre] = useState<Offre | null>(null);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [lettre, setLettre] = useState("");
  const [favori, setFavori] = useState(false);

  const charger = () => {
    api<Offre>(`/offres/${id}`).then(setOffre).catch((e) => setErreur(e.message));
  };
  useEffect(charger, [id]);

  if (erreur) return <p className="error">{erreur}</p>;
  if (!offre) return <p className="muted">{t("common.loading")}</p>;

  const postuler = async () => {
    setErreur("");
    setMessage("");
    try {
      await api(`/offres/${offre.id}/postuler`, { method: "POST", body: { lettre: lettre || undefined } });
      setMessage(t("cand.applySuccess"));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    }
  };

  const basculerFavori = async () => {
    const r = await api<{ favori: boolean }>(`/offres/${offre.id}/favori`, { method: "PUT" });
    setFavori(r.favori);
  };

  return (
    <section>
      <Link to="/offres" className="muted small">&larr; {t("common.back")}</Link>
      <div className="card" style={{ marginTop: ".75rem" }}>
        <div className="offre-meta">
          <StatutBadge statut={offre.statut} />
          <span className="chip">{offre.typeContrat ?? "-"}</span>
          <span>{offre.lieu}</span>
        </div>
        <h2>{offre.titre}</h2>
        <p className="muted">
          {offre.organisme.nom} {offre.organisme.verifie ? "(verifie)" : ""} \u00B7 {offre.organisme.ville ?? ""}
        </p>
        <p className="muted">{t("offer.deadline")} : <strong>{new Date(offre.dateLimite).toLocaleDateString("fr-FR")}</strong> \u00B7 {offre.nbCandidatures} {t("offer.applications")}</p>
        <hr style={{ border: 0, borderTop: "1px solid var(--bord)" }} />
        <p style={{ whiteSpace: "pre-line" }}>{offre.description}</p>
        {offre.niveauRequis && <p><strong>{t("offer.level")} :</strong> {offre.niveauRequis}</p>}
        {offre.filiere && <p><strong>{t("offer.filterField")} :</strong> {offre.filiere.code} - {offre.filiere.intitule}</p>}
        {offre.competencesRecherchees?.length > 0 && (
          <p><strong>{t("offer.skills")} :</strong> {offre.competencesRecherchees.join(", ")}</p>
        )}
        {offre.profilRecherche && <p><strong>{t("offer.profile")} :</strong> {offre.profilRecherche}</p>}

        {user && (
          <div className="actions-bar" style={{ marginTop: "1rem" }}>
            {(user.role === "CANDIDAT" || user.role === "ADMIN") &&
              (offre.statut === "CLOTUREE" ? (
                <p className="warning">{t("offer.closedWarning")}</p>
              ) : (
                <>
                  <textarea rows={3} style={{ maxWidth: 420 }} placeholder={t("cand.coverLetter")} value={lettre} onChange={(e) => setLettre(e.target.value)} />
                  <button onClick={postuler}>{t("offer.apply")}</button>
                </>
              ))}
            <button className="secondary" onClick={basculerFavori}>
              {favori ? "[x]" : "[ ]"} {t("offer.favorite")}
            </button>
          </div>
        )}
        {message && <p className="success" style={{ marginTop: ".75rem" }}>{message}</p>}
        {erreur && <p className="error" style={{ marginTop: ".75rem" }}>{erreur}</p>}
      </div>
    </section>
  );
}
'@

Write-Host "`nPartie frontend A terminee. Lance ensuite refonte-frontend-b.ps1"
