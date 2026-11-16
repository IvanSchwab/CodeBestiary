import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DraftBadge } from "@/components/draft-badge";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { AUTHOR_GITHUB, REPO_URL, pageMetadata } from "@/lib/site";

/** The About copy is a draft until the author rewrites it. */
const ABOUT_IS_DRAFT = true;

/** Contact links shown under "Who I am". */
const links = [{ label: "GitHub", url: AUTHOR_GITHUB }];

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return pageMetadata({
    lang,
    path: "/about",
    title: dict.meta.aboutTitle,
    description: dict.meta.aboutDescription,
  });
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const { about } = dict;

  return (
    <div className="mx-auto max-w-[44rem] px-5 py-14 sm:px-8 sm:py-20">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{about.title}</h1>
        {ABOUT_IS_DRAFT ? <DraftBadge label={dict.beast.draft} hint={dict.beast.draftHint} /> : null}
      </div>

      <section className="mt-12" aria-labelledby="who">
        <h2 id="who" className="rule-double pt-4 font-display text-2xl font-semibold">
          {about.whoTitle}
        </h2>
        <p className="mt-4 italic text-muted">{about.whoPending}</p>
        <h3 className="label mt-6">{about.links}</h3>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
          {links.map((link) => (
            <li key={link.url}>
              <a href={link.url} className="text-link">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="what">
        <h2 id="what" className="rule-double pt-4 font-display text-2xl font-semibold">
          {about.whatTitle}
        </h2>
        <div className="prose-sheet mt-4">
          {about.what.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="how">
        <h2 id="how" className="rule-double pt-4 font-display text-2xl font-semibold">
          {about.howTitle}
        </h2>
        <div className="prose-sheet mt-4">
          {about.how.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-5">
          <a href={REPO_URL} className="text-link">
            {about.repo}
          </a>
        </p>
      </section>
    </div>
  );
}
