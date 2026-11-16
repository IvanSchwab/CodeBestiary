import Link from "next/link";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import { LangSwitch } from "./lang-switch";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-[82rem] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href={`/${lang}`}
          aria-label={dict.nav.home}
          className="font-display text-lg font-semibold tracking-tight text-ink"
        >
          {SITE_NAME}
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <nav aria-label={dict.nav.main}>
            <Link href={`/${lang}/about`} className="label !text-ink transition-colors hover:!text-accent">
              {dict.nav.about}
            </Link>
          </nav>
          <LangSwitch lang={lang} label={dict.nav.language} names={dict.nav.languageNames} />
          <ThemeToggle label={dict.nav.toggleTheme} />
        </div>
      </div>
    </header>
  );
}
