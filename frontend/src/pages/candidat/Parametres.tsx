import { useI18n } from "../../i18n";
import { useTheme, ACCENTS } from "../../theme";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageSelector from "../../components/LanguageSelector";

export default function CandidatParametres() {
  const { t } = useI18n();
  const { accent, definirAccent } = useTheme();

  return (
    <section style={{ maxWidth: 560 }}>
      <h2>{t("nav.settings")}</h2>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>{t("set.appearance")}</h3>
        <p className="muted small">{t("common.theme")}</p>
        <ThemeToggle />
        <p className="muted small" style={{ marginTop: "1rem" }}>{t("common.language")}</p>
        <LanguageSelector />
      </div>

      <div className="card">
        <h3>{t("set.accent")}</h3>
        <div className="accents">
          {Object.entries(ACCENTS).map(([nom, code]) => (
            <button
              key={nom}
              type="button"
              className={`accent-dot ${accent === nom ? "actif" : ""}`}
              style={{ background: code }}
              title={nom}
              onClick={() => definirAccent(nom)}
            />
          ))}
        </div>
        <p className="muted small" style={{ marginTop: ".75rem" }}>{accent}</p>
      </div>
    </section>
  );
}