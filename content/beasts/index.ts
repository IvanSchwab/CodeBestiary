import type { Beast, DiscoveredBeast, Habitat, Localized } from "@/lib/beasts";
import { connectionPool } from "./connection-pool";
import { embeddingsVectorSearch } from "./embeddings-vector-search";
import { eventLoop } from "./event-loop";
import { jwtRefreshTokens } from "./jwt-refresh-tokens";
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
  jwtRefreshTokens,
  embeddingsVectorSearch,
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
