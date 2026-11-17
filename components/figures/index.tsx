import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n";
import { ConnectionPoolFigure } from "./connection-pool/figure";
import { EmbeddingsVectorSearchFigure } from "./embeddings-vector-search/figure";
import { EventLoopFigure } from "./event-loop/figure";
import { JwtRefreshTokensFigure } from "./jwt-refresh-tokens/figure";
import { TokenBucketFigure } from "./token-bucket/figure";
import { VueReactivityFigure } from "./vue-reactivity/figure";

export interface FigureProps {
  lang: Locale;
}

/** Maps a beast slug to its Anatomy figure. Add one entry per beast. */
export const figures: Record<string, ComponentType<FigureProps>> = {
  "event-loop": EventLoopFigure,
  "vue-reactivity": VueReactivityFigure,
  "token-bucket": TokenBucketFigure,
  "connection-pool": ConnectionPoolFigure,
  "jwt-refresh-tokens": JwtRefreshTokensFigure,
  "embeddings-vector-search": EmbeddingsVectorSearchFigure,
};
