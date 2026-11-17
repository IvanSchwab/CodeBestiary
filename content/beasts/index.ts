import type { Beast, DiscoveredBeast, Habitat, Localized } from "@/lib/beasts";
import { connectionPool } from "./connection-pool";
import { eventLoop } from "./event-loop";
import { tokenBucket } from "./token-bucket";
import { vueReactivity } from "./vue-reactivity";

/**
 * The bestiary, in specimen order. To discover a locked beast, replace its
 * entry with a DiscoveredBeast defined in its own file (see event-loop.ts).
 */
export const beasts: Beast[] = [
  eventLoop,
  vueReactivity,
  tokenBucket,
  connectionPool,
  {
    slug: "jwt-refresh-tokens",
    number: 5,
    status: "locked",
    name: { en: "JWT with Refresh Tokens", es: "JWT con refresh tokens" },
    habitat: "auth",
  },
  {
    slug: "embeddings-vector-search",
    number: 6,
    status: "locked",
    name: { en: "Embeddings & Vector Search", es: "Embeddings y búsqueda vectorial" },
    habitat: "ai",
  },
].sort((a, b) => a.number - b.number) as Beast[];

export const habitatLabels: Record<Habitat, Localized> = {
  runtime: { en: "Runtime", es: "Runtime" },
  frontend: { en: "Frontend", es: "Frontend" },
  networking: { en: "Networking", es: "Redes" },
  data: { en: "Data", es: "Datos" },
  auth: { en: "Auth", es: "Auth" },
  ai: { en: "AI", es: "IA" },
};

export const discoveredBeasts = beasts.filter(
  (beast): beast is DiscoveredBeast => beast.status === "discovered",
);

export const getDiscoveredBeast = (slug: string) =>
  discoveredBeasts.find((beast) => beast.slug === slug);
