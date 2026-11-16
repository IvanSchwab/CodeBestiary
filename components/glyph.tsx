import type { ReactNode } from "react";

/**
 * One abstract line glyph per beast, drawn on a 48 × 48 grid with
 * currentColor. Locked beasts show the same glyph as a faded silhouette.
 */
const glyphs: Record<string, ReactNode> = {
  // A loop with an arrowhead around a small stack.
  "event-loop": (
    <>
      <path d="M36.2 12.6A16 16 0 1 0 40 24" />
      <path d="M37 5.5v7.6h-7.6" />
      <path d="M18 19.5h12M18 24h12M18 28.5h12" />
    </>
  ),
  // A source node and the dependents that follow it.
  "vue-reactivity": (
    <>
      <circle cx="24" cy="24" r="4.5" />
      <circle cx="9" cy="11" r="3" />
      <circle cx="39" cy="11" r="3" />
      <circle cx="24" cy="42" r="3" />
      <path d="M20.6 21 11.3 13M27.4 21l9.3-8M24 28.5V39" />
    </>
  ),
  // A bucket being refilled with tokens.
  "token-bucket": (
    <>
      <path d="M11 19h26l-3.4 22H14.4Z" />
      <path d="M13 31h22" />
      <circle cx="19" cy="10" r="2.6" />
      <circle cx="29" cy="6.5" r="2.6" />
      <circle cx="21" cy="36" r="2.2" />
      <circle cx="28" cy="36" r="2.2" />
    </>
  ),
  // Several lines sharing one pool.
  "connection-pool": (
    <>
      <ellipse cx="24" cy="34" rx="17" ry="7" />
      <path d="M13 5v24.5M20.3 5v22.2M27.7 5v22.2M35 5v24.5" />
    </>
  ),
  // A three-part token and the arrow that renews it.
  "jwt-refresh-tokens": (
    <>
      <path d="M5 15h10v10H5ZM19 15h10v10H19ZM33 15h10v10H33Z" />
      <path d="M12 33a12.5 7 0 0 0 23 2.2" />
      <path d="M36.6 29.4v6.4h-6.4" />
    </>
  ),
  // Points in space; a query and its nearest neighbours.
  "embeddings-vector-search": (
    <>
      <circle cx="30" cy="20" r="11" strokeDasharray="1.5 3" />
      <circle cx="30" cy="20" r="2.2" />
      <circle cx="35.5" cy="14.5" r="1.6" />
      <circle cx="24.5" cy="24.5" r="1.6" />
      <circle cx="34" cy="25.5" r="1.6" />
      <path d="M31.6 18.4 34.4 15.6M28.4 21.6 25.6 23.4M31.4 21.8 33 24.3" />
      <circle cx="9" cy="10" r="1.6" />
      <circle cx="12" cy="34" r="1.6" />
      <circle cx="20" cy="41" r="1.6" />
      <circle cx="41" cy="40" r="1.6" />
    </>
  ),
};

export function Glyph({ slug, className }: { slug: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {glyphs[slug] ?? <circle cx="24" cy="24" r="14" strokeDasharray="2 4" />}
    </svg>
  );
}
