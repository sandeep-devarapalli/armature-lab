import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";

export function PageHeader({
  title,
  description,
  meta,
  actions,
  children
}: PropsWithChildren<{
  title: string;
  description: string;
  meta?: string;
  actions?: ReactNode;
}>) {
  return (
    <header className="page-hero">
      <div className="wrap">
        {meta && <div className="eyebrow mono">{meta}</div>}
        <h1>{title}</h1>
        <p className="hero-copy">{description}</p>
        {actions && <div className="button-row">{actions}</div>}
        {children}
      </div>
    </header>
  );
}

export function Section({
  number,
  title,
  lede,
  children,
  dark = false,
  id
}: PropsWithChildren<{
  number: string;
  title: string;
  lede?: string;
  dark?: boolean;
  id?: string;
}>) {
  return (
    <section className={dark ? "section ink-surface" : "section"} id={id}>
      <div className="wrap">
        <div className="section-heading">
          <span className="section-number mono">{number}</span>
          <h2>{title}</h2>
        </div>
        {lede && <p className="lede">{lede}</p>}
        {children}
      </div>
    </section>
  );
}

export function Status({
  tone = "neutral",
  children
}: PropsWithChildren<{ tone?: "neutral" | "good" | "warn" | "bad" | "accent" }>) {
  return <span className={`status status-${tone}`}>{children}</span>;
}

export function EmptyState({
  title,
  children
}: PropsWithChildren<{ title: string }>) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function Metric({
  label,
  value,
  note
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <div className="metric">
      <span className="mono">{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  ...props
}: PropsWithChildren<
  { label: string; hint?: string } & HTMLAttributes<HTMLLabelElement>
>) {
  return (
    <label className="field" {...props}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
