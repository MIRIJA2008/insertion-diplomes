import { useI18n } from "../i18n";

export default function StatutBadge({ statut }: { statut: string }) {
  const { t } = useI18n();
  return <span className={`statut-badge ${statut}`}>{t(`statut.${statut}`)}</span>;
}