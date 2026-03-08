import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <div className="split">
        <div>
          <h2>{title}</h2>
          {description ? <p className="section-copy">{description}</p> : null}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger" | "warning" | "success";
}) {
  return (
    <article className="card">
      <p className="muted">{label}</p>
      <p className={cn("stat-value", tone === "danger" && "danger")}>{value}</p>
    </article>
  );
}

export function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "danger" | "warning" | "success";
}) {
  return <span className={cn("pill", tone)}>{children}</span>;
}

export function EmptyState({
  title,
  copy,
  href,
  cta,
}: {
  title: string;
  copy: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="section-copy">{copy}</p>
      {href && cta ? (
        <Link href={href} className="button secondary">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
