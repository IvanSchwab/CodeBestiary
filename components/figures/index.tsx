import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n";
import { EventLoopFigure } from "./event-loop/figure";

export interface FigureProps {
  lang: Locale;
}

/** Maps a beast slug to its Anatomy figure. Add one entry per beast. */
export const figures: Record<string, ComponentType<FigureProps>> = {
  "event-loop": EventLoopFigure,
};
