import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BeastCard } from "@/components/beast-card";
import { beasts, discoveredBeasts } from "@/content/beasts";
import { fill, getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return pageMetadata({
    lang,
    title: dict.meta.homeTitle,
    description: dict.meta.description,
  });
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-[70rem] px-5 sm:px-8">
      <section className="py-16 sm:py-24">
        <p className="label">{dict.home.eyebrow}</p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
          {dict.home.title}
        </h1>
        <p className="mt-6 max-w-[38rem] text-lg leading-relaxed text-muted sm:text-xl">
          {dict.home.lead}
        </p>
        <Link
          href={`/${lang}/beasts/event-loop`}
          className="mt-9 inline-flex items-center gap-3 border border-ink bg-ink px-5 py-3 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
        >
          {dict.home.cta}
          <svg width="18" height="8" viewBox="0 0 18 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M0.6 4h16M13.4 0.8 16.6 4l-3.2 3.2" />
          </svg>
        </Link>
      </section>

      <section aria-labelledby="specimens">
        <div className="rule-double flex flex-wrap items-baseline justify-between gap-2 pt-5">
          <h2 id="specimens" className="font-display text-2xl font-semibold">
            {dict.home.gridTitle}
          </h2>
          <p className="label">
            {fill(dict.home.progress, {
              discovered: discoveredBeasts.length,
              total: beasts.length,
            })}
          </p>
        </div>
        <ul className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {beasts.map((beast) => (
            <BeastCard key={beast.slug} beast={beast} lang={lang} dict={dict} />
          ))}
        </ul>
      </section>
    </div>
  );
}
