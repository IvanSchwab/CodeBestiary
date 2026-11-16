import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, hasLocale, localeFromAcceptLanguage, locales } from "./lib/i18n";

/**
 * Adds the locale prefix to URLs that have none (in practice, the root "/").
 * Order: the visitor's saved choice (cookie), then Accept-Language, then the
 * default locale. URLs that already carry /en or /es are never redirected.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasPrefix) return;

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    saved && hasLocale(saved)
      ? saved
      : localeFromAcceptLanguage(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next.js internals and any file with an extension (icons, sitemap, robots).
  matcher: ["/((?!_next|.*\\..*).*)"],
};
