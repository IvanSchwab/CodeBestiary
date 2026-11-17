import type { Locale } from "@/lib/i18n";
import "../../iso/iso.css";
import "../figures.css";
import { TokenBucketArt } from "./art";
import "./token-bucket.css";

/** Fig 3: the token bucket as a token dispenser on a request track. */
export function TokenBucketFigure({ lang }: { lang: Locale }) {
  return (
    <div className="iso figure tk">
      <TokenBucketArt lang={lang} />
    </div>
  );
}
