import type { Locale } from "@/lib/i18n";
import "../../iso/iso.css";
import "../figures.css";
import { ConnectionPoolArt } from "./art";
import "./connection-pool.css";

/** Fig 4: a connection pool as a transfer bench with one shuttered port per connection. */
export function ConnectionPoolFigure({ lang }: { lang: Locale }) {
  return (
    <div className="iso figure cp">
      <ConnectionPoolArt lang={lang} />
    </div>
  );
}
