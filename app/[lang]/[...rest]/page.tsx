import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n";

// This route only ever renders the 404, so there is nothing to validate.
export const instant = false;

// Any unknown URL under a locale renders the localized 404.
export function generateStaticParams() {
  return locales.map((lang) => ({ lang, rest: ["404"] }));
}

export default function CatchAll() {
  notFound();
}
