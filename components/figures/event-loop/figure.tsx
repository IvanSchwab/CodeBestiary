import type { Locale } from "@/lib/i18n";
import "../../iso/iso.css";
import "../figures.css";
import { EventLoopArt } from "./art";
import "./event-loop.css";

/** Fig 1: the event loop as a pick-and-place dispatcher. */
export function EventLoopFigure({ lang }: { lang: Locale }) {
  return (
    <div className="iso figure el">
      <EventLoopArt lang={lang} />
    </div>
  );
}
