"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, locales, type Locale } from "@/lib/i18n";

/** "EN / ES" switch. Links to the same page in the other language. */
export function LangSwitch({
  lang,
  label,
  names,
}: {
  lang: Locale;
  label: string;
  names: Record<Locale, string>;
}) {
  const pathname = usePathname() ?? `/${lang}`;
  const rest = pathname.split("/").slice(2).join("/");

  const remember = (locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <nav aria-label={label} className="flex items-center gap-1.5 font-mono text-xs tracking-widest">
      {locales.map((locale, index) => (
        <span key={locale} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden="true" className="text-rule">
              /
            </span>
          ) : null}
          <Link
            href={`/${locale}${rest ? `/${rest}` : ""}`}
            hrefLang={locale}
            lang={locale}
            aria-label={names[locale]}
            aria-current={locale === lang ? "true" : undefined}
            onClick={() => remember(locale)}
            className={
              locale === lang
                ? "border-b border-accent pb-0.5 text-ink"
                : "border-b border-transparent pb-0.5 text-muted transition-colors hover:text-ink"
            }
          >
            {locale.toUpperCase()}
          </Link>
        </span>
      ))}
    </nav>
  );
}
