import Link from "next/link";
import { habitatLabels } from "@/content/beasts";
import type { Dictionary } from "@/dictionaries";
import { formatNumber, type Beast } from "@/lib/beasts";
import type { Locale } from "@/lib/i18n";
import { Glyph } from "./glyph";

export function BeastCard({ beast, lang, dict }: { beast: Beast; lang: Locale; dict: Dictionary }) {
  const number = `${dict.card.numberPrefix} ${formatNumber(beast.number)}`;
  const habitat = habitatLabels[beast.habitat][lang];

  if (beast.status === "locked") {
    return (
      <li className="flex min-h-64 flex-col border border-dashed border-rule p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="label">{number}</span>
          <span className="label">{habitat}</span>
        </div>
        <Glyph slug={beast.slug} className="my-6 h-16 w-16 text-rule" />
        <h3 className="mt-auto font-display text-xl leading-tight text-muted">{beast.name[lang]}</h3>
        <p className="label mt-3">
          <span aria-hidden="true">{dict.card.undiscovered}</span>
          <span className="sr-only">{dict.card.undiscoveredHint}</span>
        </p>
      </li>
    );
  }

  return (
    <li className="flex">
      <Link
        href={`/${lang}/beasts/${beast.slug}`}
        className="group flex min-h-64 w-full flex-col border border-ink bg-surface p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--accent)]"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="label !text-accent">{number}</span>
          <span className="label">{habitat}</span>
        </div>
        <Glyph slug={beast.slug} className="my-6 h-16 w-16 text-ink" />
        <h3 className="mt-auto font-display text-xl font-semibold leading-tight text-ink">
          {beast.name[lang]}
        </h3>
        <p className="mt-2 text-[0.95rem] leading-snug text-muted">{beast.sheet[lang].tagline}</p>
      </Link>
    </li>
  );
}
