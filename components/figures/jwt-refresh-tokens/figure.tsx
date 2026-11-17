import type { Locale } from "@/lib/i18n";
import "../../iso/iso.css";
import "../figures.css";
import { JwtRefreshTokensArt } from "./art";
import "./jwt-refresh-tokens.css";

/** Fig 5: access and refresh tokens as an issuing cabinet, a client tray and a card-reader locker. */
export function JwtRefreshTokensFigure({ lang }: { lang: Locale }) {
  return (
    <div className="iso figure jw">
      <JwtRefreshTokensArt lang={lang} />
    </div>
  );
}
