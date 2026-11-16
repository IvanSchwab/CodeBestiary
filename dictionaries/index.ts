import type { Locale } from "@/lib/i18n";
import { en, type Dictionary } from "./en";
import { es } from "./es";

const dictionaries: Record<Locale, Dictionary> = { en, es };

export const getDictionary = (lang: Locale): Dictionary => dictionaries[lang];

export type { Dictionary };

/** Replaces {name} placeholders in a dictionary string. */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
