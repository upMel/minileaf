import Link from "next/link";

/** Friendly "nothing here" box with an optional way onward. */
export default function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="ks-empty">
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && (
        <Link className="ks-btn" href={action.href}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
