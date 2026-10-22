import { useTheme } from "../theme";

export default function ThemeToggle() {
  const { sombre, basculerTheme } = useTheme();
  return (
    <button type="button" className="theme-btn" onClick={basculerTheme} title={sombre ? "Mode clair" : "Mode sombre"}>
      {sombre ? "Clair" : "Sombre"}
    </button>
  );
}