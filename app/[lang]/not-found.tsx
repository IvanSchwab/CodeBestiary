import Link from "next/link";
import { lang as rootLang } from "next/root-params";
import { getDictionary } from "@/dictionaries";
import { defaultLocale, hasLocale } from "@/lib/i18n";

export default async function NotFound() {
  const value = await rootLang();
  const lang = value && hasLocale(value) ? value : defaultLocale;
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-[44rem] px-5 py-24 sm:px-8">
      <p className="label">404</p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {dict.notFound.title}
      </h1>
      <p className="mt-4 text-lg text-muted">{dict.notFound.body}</p>
      <p className="mt-8">
        <Link href={`/${lang}`} className="text-link">
          {dict.notFound.back}
        </Link>
      </p>
    </div>
  );
}
