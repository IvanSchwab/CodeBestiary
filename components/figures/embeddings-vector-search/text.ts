import type { Locale } from "@/lib/i18n";
import type { LegendKey } from "../../iso/iso-kit";
import { DIMS, DOC_VECTORS, K, THRESHOLD, type Scored, type Step, type Vector } from "./model";

/** Every word of the figure, in both languages. Code in the panel is not translated. */
export interface FigureText {
  fig: string;
  title: string;
  hint: string;
  /** Accessible description of the drawing. */
  label: string;
  /** Accessible name of the stepping control. */
  control: string;
  keys: LegendKey[];
  caption: string;
  prev: string;
  next: string;
  play: string;
  pause: string;
  reset: string;
  queryHead: string;
  resultsHead: string;
  call: string;
  result: string;
  /** Document texts, in index order. */
  docs: string[];
  /** Query texts. */
  queries: string[];
  belowThreshold: string;
  stepOf: (index: number, last: number) => string;
  readout: (step: Step) => string;
  /** The query cell of the panel. */
  queryOf: (step: Step) => string;
  /** One line of the results cell when there are no hits to list. */
  emptyOf: (step: Step) => string;
  callOf: (step: Step) => string;
  resultOf: (step: Step) => string;
  describe: (step: Step) => string;
}

const score = (value: number) => value.toFixed(3);
const vec = (vector: Vector) => `(${vector.map((value) => value.toFixed(2)).join(", ")})`;
const scores = (hits: Scored[]) => hits.map((hit) => score(hit.score)).join(" · ");

const callOf = (queries: string[]) => (step: Step) => {
  if (step.kind === "start") return "const index = []";
  if (step.kind === "index") return `index.push(normalize(embed(doc)))  // × ${DOC_VECTORS.length}`;
  const text = JSON.stringify(queries[step.query as number]);
  if (step.kind === "embed") return `const q = embed(${text})`;
  if (step.kind === "rank") return `search(index, q, { k: ${K} })`;
  return `search(index, q, { k: ${K}, threshold: ${THRESHOLD} })`;
};

const en: FigureText = {
  fig: "Fig 6",
  title: "Vector search",
  hint: "Click or ← → to step",
  label: `A search bench that models embeddings and vector search. On the left an encoder takes text cards and sets two sliders, the two components of each text's vector. On the right a turntable holds one pin per stored document, each at its vector's angle. The encoder turns the table so the query's vector points along a rail, and a bar sweeping along the rail raises the pins in order of cosine similarity, until it has ${K} or reaches a stop at the threshold.`,
  control: "Vector search, step by step",
  keys: [
    { mark: "lit", label: "What acts in this step: a card, the sweep bar or the threshold stop" },
    { mark: "raised", label: "Pin: one stored document's vector; a raised pin is a result" },
    { mark: "flat", label: "Card: a text on its way into the encoder" },
  ],
  caption: `Each card is a text. The encoder on the left is the embedding model: it turns any text into the same fixed number of components, ${DIMS} here, set on its two sliders; real models output hundreds or thousands. The vectors in this example are placed by hand, so that texts about the same thing (bread, pets, bicycles) come out close together. Every document went through the encoder once and was stored, normalized, as a pin on the table at its vector's angle. A query goes through the same encoder, which turns the table until the query's vector points along the rail. A pin's distance along the rail, read on the scale from 0 at the center to 1 at the rim, is its cosine similarity to the query (for normalized vectors, the dot product). The bar sweeps from 1 toward the center and raises every pin it passes, so the best come up first, and it stops after ${K}: top k compares the query with every stored vector and always returns ${K}, however far away they are. The stop at ${THRESHOLD} is the threshold: with it up, the bar cannot go lower, and a query far from every document gets nothing.`,
  prev: "Previous step",
  next: "Next step",
  play: "Play",
  pause: "Pause",
  reset: "Restart",
  queryHead: "Query",
  resultsHead: `Results, best first`,
  call: "Call",
  result: "Returns",
  docs: [
    "Sourdough starter for beginners",
    "How to knead bread dough",
    "Why bread dough rises",
    "Teaching a puppy to sit",
    "Why cats purr",
    "Fixing a flat bike tire",
    "Adjusting bicycle brakes",
  ],
  queries: ["easy homemade bread", "freelance tax deadline"],
  belowThreshold: `below ${THRESHOLD}`,
  stepOf: (index, last) => `Step ${index} of ${last}`,
  readout(step) {
    if (step.kind === "start") return `index empty · ${step.stored} vectors`;
    if (step.kind === "index") return `index · ${step.stored} vectors · ${DIMS} dims`;
    if (step.kind === "embed") return `query ${(step.query as number) + 1} → ${vec(step.raw as Vector)}`;
    if (step.kind === "rank") return `top ${K} · ${scores(step.top)}`;
    const count = step.results?.length ?? 0;
    return `≥ ${THRESHOLD} · ${count} ${count === 1 ? "result" : "results"}`;
  },
  queryOf(step) {
    if (step.query === null) return "—";
    return `“${en.queries[step.query]}” → ${vec(step.raw as Vector)}`;
  },
  emptyOf(step) {
    if (step.kind === "start") return `0 of ${DOC_VECTORS.length} documents stored`;
    if (step.kind === "index") return `${step.stored} documents stored`;
    if (step.kind === "embed") return "not searched yet";
    return "nothing";
  },
  callOf: callOf(["easy homemade bread", "freelance tax deadline"]),
  resultOf(step) {
    if (step.kind === "start") return "an empty index";
    if (step.kind === "index") return `${step.stored} unit vectors`;
    if (step.kind === "embed") return `${vec(step.raw as Vector)}, normalized to ${vec(step.unit as Vector)}`;
    const count = step.results?.length ?? 0;
    return count ? `${count} documents` : "[]  (no results)";
  },
  describe(step) {
    if (step.kind === "start") {
      return `The index is empty. ${DOC_VECTORS.length} documents wait to be embedded, and two queries to be searched.`;
    }
    if (step.kind === "index") {
      return `Each document goes through the embedding model once. Its vector, ${DIMS} numbers here, is normalized and stored as a pin at the vector's angle. Texts about the same thing land close together.`;
    }
    const text = en.queries[step.query as number];
    if (step.kind === "embed") {
      return `The query “${text}” goes through the same model and comes out as ${vec(step.raw as Vector)}. The table turns until that vector points along the rail.`;
    }
    const far = step.top[0].score < THRESHOLD;
    if (step.kind === "rank") {
      return far
        ? `No document is about this, but top ${K} still returns ${K}: the bar has to sweep almost to the center, and the best score is only ${score(step.top[0].score)}. Nearest does not mean relevant.`
        : `The bar sweeps from 1 toward the center and raises each pin it passes, best first. It stops after ${K}: the three bread documents, all close to the query.`;
    }
    return far
      ? `With the stop up at the threshold, ${THRESHOLD}, the bar halts before it reaches any pin. The search returns nothing, which is the right answer here.`
      : `With the stop up at the threshold, ${THRESHOLD}, the bar may go no lower. All three results score above it, so all three stay.`;
  },
};

const es: FigureText = {
  fig: "Fig 6",
  title: "Búsqueda vectorial",
  hint: "Clic o ← → para avanzar",
  label: `Un banco de búsqueda que modela embeddings y búsqueda vectorial. A la izquierda, un codificador recibe tarjetas de texto y fija dos cursores, los dos componentes del vector de cada texto. A la derecha, una mesa giratoria tiene una clavija por cada documento guardado, en el ángulo de su vector. El codificador gira la mesa hasta que el vector de la consulta apunta a lo largo de un riel, y una barra que recorre el riel levanta las clavijas en orden de cosine similarity, hasta tener ${K} o llegar a un tope en el threshold.`,
  control: "Búsqueda vectorial, paso a paso",
  keys: [
    { mark: "lit", label: "Lo que actúa en el paso: una tarjeta, la barra o el tope del threshold" },
    { mark: "raised", label: "Clavija: el vector de un documento guardado; levantada, es un resultado" },
    { mark: "flat", label: "Tarjeta: un texto que entra en el codificador" },
  ],
  caption: `Cada tarjeta es un texto. El codificador de la izquierda es el modelo de embedding: convierte cualquier texto en la misma cantidad fija de componentes, ${DIMS} en este caso, que marcan sus dos cursores; los modelos reales producen cientos o miles. Los vectores de este ejemplo están puestos a mano, de modo que los textos sobre lo mismo (pan, mascotas, bicicletas) queden cerca. Cada documento pasó una sola vez por el codificador y quedó guardado, normalizado, como una clavija en la mesa, en el ángulo de su vector. Una consulta pasa por el mismo codificador, que gira la mesa hasta que el vector de la consulta apunta a lo largo del riel. La distancia de una clavija a lo largo del riel, leída en la escala que va de 0 en el centro a 1 en el borde, es su cosine similarity con la consulta (con vectores normalizados, el producto escalar). La barra avanza desde 1 hacia el centro y levanta cada clavija que deja atrás, así que las mejores suben primero, y se detiene después de ${K}: top k compara la consulta con todos los vectores guardados y siempre devuelve ${K}, por lejos que estén. El tope en ${THRESHOLD} es el threshold: levantado, la barra no puede bajar más, y una consulta lejos de todos los documentos no obtiene nada.`,
  prev: "Paso anterior",
  next: "Paso siguiente",
  play: "Reproducir",
  pause: "Pausar",
  reset: "Reiniciar",
  queryHead: "Consulta",
  resultsHead: "Resultados, del mejor al peor",
  call: "Llamada",
  result: "Devuelve",
  docs: [
    "Masa madre para principiantes",
    "Cómo amasar pan",
    "Por qué leva la masa de pan",
    "Enseñar a sentarse a un cachorro",
    "Por qué ronronean los gatos",
    "Arreglar una rueda pinchada",
    "Ajustar los frenos de la bicicleta",
  ],
  queries: ["pan casero fácil", "plazo de impuestos para freelancers"],
  belowThreshold: `menos de ${THRESHOLD}`,
  stepOf: (index, last) => `Paso ${index} de ${last}`,
  readout(step) {
    if (step.kind === "start") return `índice vacío · ${step.stored} vectores`;
    if (step.kind === "index") return `índice · ${step.stored} vectores · ${DIMS} dims`;
    if (step.kind === "embed") return `consulta ${(step.query as number) + 1} → ${vec(step.raw as Vector)}`;
    if (step.kind === "rank") return `top ${K} · ${scores(step.top)}`;
    const count = step.results?.length ?? 0;
    return `≥ ${THRESHOLD} · ${count} ${count === 1 ? "resultado" : "resultados"}`;
  },
  queryOf(step) {
    if (step.query === null) return "—";
    return `“${es.queries[step.query]}” → ${vec(step.raw as Vector)}`;
  },
  emptyOf(step) {
    if (step.kind === "start") return `0 de ${DOC_VECTORS.length} documentos guardados`;
    if (step.kind === "index") return `${step.stored} documentos guardados`;
    if (step.kind === "embed") return "todavía sin buscar";
    return "nada";
  },
  callOf: callOf(["pan casero fácil", "plazo de impuestos para freelancers"]),
  resultOf(step) {
    if (step.kind === "start") return "un índice vacío";
    if (step.kind === "index") return `${step.stored} vectores unitarios`;
    if (step.kind === "embed") return `${vec(step.raw as Vector)}, normalizado a ${vec(step.unit as Vector)}`;
    const count = step.results?.length ?? 0;
    return count ? `${count} documentos` : "[]  (sin resultados)";
  },
  describe(step) {
    if (step.kind === "start") {
      return `El índice está vacío. ${DOC_VECTORS.length} documentos esperan su embedding, y dos consultas esperan la búsqueda.`;
    }
    if (step.kind === "index") {
      return `Cada documento pasa una sola vez por el modelo de embedding. Su vector, ${DIMS} números en este caso, se normaliza y se guarda como una clavija en el ángulo del vector. Los textos sobre lo mismo quedan cerca.`;
    }
    const text = es.queries[step.query as number];
    if (step.kind === "embed") {
      return `La consulta “${text}” pasa por el mismo modelo y sale como ${vec(step.raw as Vector)}. La mesa gira hasta que ese vector apunta a lo largo del riel.`;
    }
    const far = step.top[0].score < THRESHOLD;
    if (step.kind === "rank") {
      return far
        ? `Ningún documento trata de esto, pero top ${K} igual devuelve ${K}: la barra tiene que llegar casi al centro, y el mejor puntaje es apenas ${score(step.top[0].score)}. Lo más cercano no es lo relevante.`
        : `La barra avanza desde 1 hacia el centro y levanta cada clavija que deja atrás, de la mejor a la peor. Se detiene después de ${K}: los tres documentos sobre pan, todos cerca de la consulta.`;
    }
    return far
      ? `Con el tope levantado en el threshold, ${THRESHOLD}, la barra se detiene antes de llegar a cualquier clavija. La búsqueda no devuelve nada, que es la respuesta correcta en este caso.`
      : `Con el tope levantado en el threshold, ${THRESHOLD}, la barra no puede bajar más. Los tres resultados están por encima, así que quedan los tres.`;
  },
};

export const figureText: Record<Locale, FigureText> = { en, es };
