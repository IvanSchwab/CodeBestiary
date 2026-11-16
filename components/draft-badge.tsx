export function DraftBadge({ label, hint }: { label: string; hint: string }) {
  return (
    <span
      title={hint}
      className="label inline-block rounded-sm border border-dashed border-muted px-1.5 py-0.5 align-middle"
    >
      {label}
      <span className="sr-only">. {hint}</span>
    </span>
  );
}
