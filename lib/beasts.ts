import type { Locale } from "./i18n";

export type Habitat = "runtime" | "frontend" | "networking" | "data" | "auth" | "ai";

export type Localized<T = string> = Record<Locale, T>;

export interface BeastSource {
  title: string;
  url: string;
}

/** The written sheet of a discovered beast, in one language. */
export interface BeastSheet {
  /** One line, also shown on the home card. */
  tagline: string;
  /** 2 to 4 paragraphs. Backticks mark inline code. */
  behavior: string[];
  dangers: { title: string; body: string }[];
  /** Where the author met the concept in practice. `null` renders the placeholder. */
  sightings: string[] | null;
}

interface BeastBase {
  slug: string;
  /** Specimen number, shown as No. 001. Also the grid order. */
  number: number;
  name: Localized;
  habitat: Habitat;
}

export interface LockedBeast extends BeastBase {
  status: "locked";
}

export interface DiscoveredBeast extends BeastBase {
  status: "discovered";
  ecosystem: Localized;
  /** How easy it is to get the concept wrong, 1 to 5. */
  danger: 1 | 2 | 3 | 4 | 5;
  /** True while the sheet is a draft the author has not rewritten yet. */
  draft: boolean;
  sheet: Localized<BeastSheet>;
  sources: BeastSource[];
}

export type Beast = LockedBeast | DiscoveredBeast;

export const formatNumber = (n: number) => String(n).padStart(3, "0");
