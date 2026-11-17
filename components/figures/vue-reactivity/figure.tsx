import type { Locale } from "@/lib/i18n";
import "../../iso/iso.css";
import "../figures.css";
import { VueReactivityArt } from "./art";
import "./vue-reactivity.css";

/** Fig 2: Vue reactivity as a trip-rod relay. */
export function VueReactivityFigure({ lang }: { lang: Locale }) {
  return (
    <div className="iso figure vr">
      <VueReactivityArt lang={lang} />
    </div>
  );
}
