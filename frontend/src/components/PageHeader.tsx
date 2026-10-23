import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  backTo,
  backLabel = "Retour",
  actions,
}: PageHeaderProps) {
  return (
    <>
      {backTo && (
        <Link to={backTo} className="pf-back">
          <span className="pf-back-icon">&larr;</span>
          {backLabel}
        </Link>
      )}
      <div className="pf-header">
        <div className="pf-header-copy">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="pf-header-actions">{actions}</div>}
      </div>
    </>
  );
}