import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftBadge } from "@/components/draft-badge";
import { figures } from "@/components/figures";
import { Glyph } from "@/components/glyph";
import { Inline } from "@/components/inline";
import { discoveredBeasts, getDiscoveredBeast, habitatLabels } from "@/content/beasts";
import { fill, getDictionary } from "@/dictionaries";
import { formatNumber } from "@/lib/beasts";
import { hasLocale, locales } from "@/lib/i18n";
import { pageMetadata } from "@/lib/site";

type Props = PageProps<"/[lang]/beasts/[slug]">;

// Only discovered beasts have a page. Any other slug, locked beasts
// included, is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) => discoveredBeasts.map((beast) => ({ lang, slug: beast.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const beast = getDiscoveredBeast(slug);
  if (!hasLocale(lang) || !beast) return {};
  return pageMetadata({
    lang,
    path: `/beasts/${beast.slug}`,
    title: beast.name[lang],
    description: beast.sheet[lang].tagline,
  });
}

export default async function BeastPage({ params }: Props) {
  const { lang, slug } = await params;
  const beast = getDiscoveredBeast(slug);
  if (!hasLocale(lang) || !beast) notFound();

  const dict = getDictionary(lang);
  const t = dict.beast;
  const sheet = beast.sheet[lang];
  const Figure = figures[beast.slug];
  const dangerText = fill(t.dangerValue, { value: beast.danger });

  return (
    <article className="mx-auto max-w-[82rem] px-5 py-10 sm:px-8 lg:grid lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] lg:gap-x-14 lg:py-14">
      <header className="lg:col-start-1">
        <Link href={`/${lang}`} className="label inline-flex items-center gap-2 transition-colors hover:!text-accent">
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13.4 4H1M4.2 0.8 1 4l3.2 3.2" />
          </svg>
          {t.back}
        </Link>
        <div className="mt-8 flex items-center gap-4">
          <Glyph slug={beast.slug} className="h-12 w-12 flex-none text-ink" />
          <p className="label">
            <span className="text-accent">
              {dict.card.numberPrefix} {formatNumber(beast.number)}
            </span>
            <span aria-hidden="true"> · </span>
            {habitatLabels[beast.habitat][lang]}
          </p>
        </div>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.03] tracking-tight sm:text-6xl">
          {beast.name[lang]}
        </h1>
        <p className="mt-4 text-xl leading-snug text-muted">{sheet.tagline}</p>
      </header>

      <div className="mt-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
        <section aria-label={t.figure} className="figure-sticky">
          {Figure ? <Figure lang={lang} /> : null}
        </section>
      </div>

      <div className="mt-10 lg:col-start-1">
        <section aria-labelledby="stats">
          <h2 id="stats" className="sr-only">
            {t.stats}
          </h2>
          <dl className="grid grid-cols-3 border-y border-ink">
            <div className="py-3 pr-3">
              <dt className="label">{t.habitat}</dt>
              <dd className="mt-1 font-display text-lg">{habitatLabels[beast.habitat][lang]}</dd>
            </div>
            <div className="border-l border-rule px-3 py-3">
              <dt className="label">{t.ecosystem}</dt>
              <dd className="mt-1 font-display text-lg">{beast.ecosystem[lang]}</dd>
            </div>
            <div className="border-l border-rule py-3 pl-3">
              <dt className="label">{t.danger}</dt>
              <dd className="mt-2.5">
                <span className="flex gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span
                      key={level}
                      className={
                        level <= beast.danger
                          ? "h-2.5 w-2.5 rotate-45 border border-accent bg-accent"
                          : "h-2.5 w-2.5 rotate-45 border border-muted"
                      }
                    />
                  ))}
                </span>
                <span className="sr-only">{dangerText}</span>
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-10" aria-labelledby="behavior">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="behavior" className="font-display text-2xl font-semibold">
              {t.behavior}
            </h2>
            {beast.draft ? <DraftBadge label={t.draft} hint={t.draftHint} /> : null}
          </div>
          <div className="prose-sheet mt-3">
            {sheet.behavior.map((paragraph) => (
              <p key={paragraph}>
                <Inline text={paragraph} />
              </p>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="dangers">
          <h2 id="dangers" className="rule-double pt-4 font-display text-2xl font-semibold">
            {t.dangers}
          </h2>
          <ul className="mt-4 space-y-5">
            {sheet.dangers.map((danger) => (
              <li key={danger.title} className="border-l-2 border-accent pl-4">
                <h3 className="font-display text-lg font-semibold leading-snug">
                  <Inline text={danger.title} />
                </h3>
                <p className="mt-1">
                  <Inline text={danger.body} />
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="sightings">
          <h2 id="sightings" className="rule-double pt-4 font-display text-2xl font-semibold">
            {t.sightings}
          </h2>
          {sheet.sightings ? (
            <div className="prose-sheet mt-3">
              {sheet.sightings.map((paragraph) => (
                <p key={paragraph}>
                  <Inline text={paragraph} />
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-3 italic text-muted">{t.sightingsPending}</p>
          )}
        </section>

        <section className="mt-10" aria-labelledby="sources">
          <h2 id="sources" className="rule-double pt-4 font-display text-2xl font-semibold">
            {t.sources}
          </h2>
          <ol className="mt-3 space-y-1.5">
            {beast.sources.map((source, index) => (
              <li key={source.url} className="flex gap-3">
                <span className="label mt-1.5 flex-none" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <a href={source.url} className="text-link" hrefLang="en">
                  {source.title}
                </a>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}
