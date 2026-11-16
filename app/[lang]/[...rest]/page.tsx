import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n";

// Any unknown URL under a locale renders the localized 404.
export function generateStaticParams() {
  return locales.map((lang) => ({ lang, rest: ["404"] }));
}

export default function CatchAll() {
  notFound();
}
