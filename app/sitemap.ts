import type { MetadataRoute } from "next";
import { discoveredBeasts } from "@/content/beasts";
import { defaultLocale, locales } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/about", ...discoveredBeasts.map((beast) => `/beasts/${beast.slug}`)];
  return paths.flatMap((path) =>
    locales.map((lang) => ({
      url: `${siteUrl}/${lang}${path}`,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`])),
          "x-default": `${siteUrl}/${defaultLocale}${path}`,
        },
      },
    })),
  );
}
