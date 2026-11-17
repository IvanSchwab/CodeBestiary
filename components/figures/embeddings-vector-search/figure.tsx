import type { Locale } from "@/lib/i18n";
import "../../iso/iso.css";
import "../figures.css";
import { EmbeddingsVectorSearchArt } from "./art";
import "./embeddings-vector-search.css";

/** Fig 6: vector search as a turntable of stored vectors under a sweep bar. */
export function EmbeddingsVectorSearchFigure({ lang }: { lang: Locale }) {
  return (
    <div className="iso figure vs">
      <EmbeddingsVectorSearchArt lang={lang} />
    </div>
  );
}
