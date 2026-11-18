import { status } from "@/lib/stats";
import type { Visit } from "@/lib/types";

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ visit, now }: { visit: Visit; now: string }) {
  const label = status(visit, now);
  return (
    <span
      className={`status status-${label === "館内" ? "inside" : label === "遅れ" ? "late" : label === "退館済み" ? "done" : "planned"}`}
    >
      <span />
      {label}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
