import { ImageResponse } from "next/og";
import { beasts, discoveredBeasts } from "@/content/beasts";
import { fill, getDictionary } from "@/dictionaries";
import { defaultLocale, hasLocale, locales } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/** Social card in the light theme, with the tagline in the page's language. */
export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: value } = await params;
  const lang = hasLocale(value) ? value : defaultLocale;
  const dict = getDictionary(lang);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f4efe4",
          color: "#1f1b16",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, textTransform: "uppercase", color: "#a6402a" }}>
          {dict.home.eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 132, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
            {SITE_NAME}
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 36, lineHeight: 1.35, color: "#6b6257", maxWidth: 940 }}>
            {dict.meta.description}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "2px solid #1f1b16",
            paddingTop: 24,
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#6b6257",
          }}
        >
          <div style={{ display: "flex" }}>
            {fill(dict.home.progress, { discovered: discoveredBeasts.length, total: beasts.length })}
          </div>
          <div style={{ display: "flex" }}>EN / ES</div>
        </div>
      </div>
    ),
    size,
  );
}
