import type { Metadata } from "next";
import { defaultLocale, locales, ogLocale, type Locale } from "./i18n";

export const SITE_NAME = "Code Bestiary";
export const REPO_URL = "https://github.com/IvanSchwab/CodeBestiary";
export const AUTHOR_NAME = "Ivan Schwab";
export const AUTHOR_GITHUB = "https://github.com/IvanSchwab";
export const AUTHOR_LINKEDIN = "https://www.linkedin.com/in/ivanschwab/";
export const AUTHOR_PORTFOLIO = "https://ivanschwabdev.vercel.app/";

/**
 * Absolute base URL for metadata, hreflang, Open Graph and the sitemap.
 * Set NEXT_PUBLIC_SITE_URL in production. Falls back to the Vercel
 * production URL when available, then to localhost.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

/** `path` is the part after the locale, e.g. "" or "/about". */
export const localizedPath = (lang: Locale, path = "") => `/${lang}${path}`;

export function pageMetadata({
  lang,
  path = "",
  title,
  description,
}: {
  lang: Locale;
  path?: string;
  title: string;
  description: string;
}): Metadata {
  const languages: Record<string, string> = {};
  for (const locale of locales) languages[locale] = localizedPath(locale, path);
  languages["x-default"] = localizedPath(defaultLocale, path);
  // A page that sets openGraph replaces the image inherited from the layout's
  // opengraph-image file, so it is named here for every page.
  const image = { url: `/${lang}/opengraph-image`, width: 1200, height: 630, alt: SITE_NAME };

  return {
    title,
    description,
    alternates: { canonical: localizedPath(lang, path), languages },
    openGraph: {
      title,
      description,
      url: localizedPath(lang, path),
      siteName: SITE_NAME,
      type: "website",
      locale: ogLocale[lang],
      alternateLocale: locales.filter((l) => l !== lang).map((l) => ogLocale[l]),
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
