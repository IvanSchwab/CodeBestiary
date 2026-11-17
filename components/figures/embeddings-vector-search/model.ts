/**
 * Pure model of embeddings and vector search. No DOM, no geometry, no timers.
 * Everything the figure shows (motion, readout, panel) comes from the steps
 * this module produces, and model.test.ts checks the ranking against an
 * independent brute-force cosine written in the test.
 *
 * The "embedding model" here is a fixed lookup of hand-placed 2D vectors, so
 * the example stays small and honest: texts about the same thing were placed
 * close together. Real models output hundreds or thousands of components.
 */

export type Vector = readonly number[];

/** How many results a search returns at most. */
export const K = 3;
/** The least cosine similarity a result may have when the threshold is on. */
export const THRESHOLD = 0.8;
/** Components per vector. Fixed: every text gets the same length. */
export const DIMS = 2;

export function dot(a: Vector, b: Vector): number {
  if (a.length !== b.length) throw new Error(`dimension mismatch: ${a.length} and ${b.length}`);
  let sum = 0;
  for (let index = 0; index < a.length; index++) sum += a[index] * b[index];
  return sum;
}

export const norm = (a: Vector) => Math.sqrt(dot(a, a));

/** The same direction with length 1. Cosine similarity of unit vectors is their dot product. */
export function normalize(a: Vector): Vector {
  const length = norm(a);
  if (!(length > 0)) throw new Error("cannot normalize a zero vector");
  return a.map((value) => value / length);
}

/** Cosine similarity: the cosine of the angle between two vectors, from -1 to 1. Length does not matter. */
export const cosine = (a: Vector, b: Vector) => dot(a, b) / (norm(a) * norm(b));

export interface Scored {
  /** Position of the document in the index. */
  doc: number;
  /** Cosine similarity to the query. */
  score: number;
}

export interface Index {
  /** Stored vectors, normalized when they were added. */
  vectors: Vector[];
  dims: number;
}

/** Builds an index: every document vector is normalized once and stored. */
export function createIndex(vectors: Vector[]): Index {
  const dims = vectors[0]?.length ?? 0;
  for (const vector of vectors) {
    if (vector.length !== dims) throw new Error("every vector in an index must have the same length");
  }
  return { vectors: vectors.map(normalize), dims };
}

/**
 * Exact search: the query is compared against every stored vector. Higher
 * scores first; equal scores keep index order, so the ranking is stable.
 */
export function rank(index: Index, query: Vector): Scored[] {
  const unit = normalize(query);
  return index.vectors
    .map((vector, doc) => ({ doc, score: dot(vector, unit) }))
    .sort((a, b) => b.score - a.score || a.doc - b.doc);
}

export interface SearchOptions {
  k?: number;
  /** Drop results below this cosine. Null keeps the top k whatever their score. */
  threshold?: number | null;
}

/** The top k by cosine similarity, then (optionally) only those at or above the threshold. */
export function search(index: Index, query: Vector, { k = K, threshold = null }: SearchOptions = {}): Scored[] {
  const top = rank(index, query).slice(0, k);
  return threshold === null ? top : top.filter((hit) => hit.score >= threshold);
}

/* The figure's fixed example. Texts are in text.ts, in both languages. */

/**
 * What the embedding model returns for each document: hand-placed 2D vectors.
 * Three about bread, two about pets, two about bicycles.
 */
export const DOC_VECTORS: Vector[] = [
  [0.94, 0.34],
  [0.81, 0.59],
  [0.62, 0.79],
  [-0.74, 0.67],
  [-0.91, 0.41],
  [-0.85, -0.53],
  [-0.64, -0.77],
];

/** The two queries: one about bread, one about something no document covers. */
export const QUERY_VECTORS: Vector[] = [
  [0.74, 0.67],
  [0.47, -0.88],
];

export const INDEX = createIndex(DOC_VECTORS);

/** Angle of a vector in the plane, in degrees from +x, counter-clockwise. */
export const angleOf = (vector: Vector) => (Math.atan2(vector[1], vector[0]) * 180) / Math.PI;

/* The scripted walk through the figure. */

export type StepKind = "start" | "index" | "embed" | "rank" | "threshold";

export interface Step {
  kind: StepKind;
  /** Documents stored in the index at this step. */
  stored: number;
  /** The query being searched, or null before the first one. */
  query: number | null;
  /** The query's vector as the model returned it, and normalized. */
  raw: Vector | null;
  unit: Vector | null;
  /** Every document scored against the query, best first. Empty without a query. */
  ranked: Scored[];
  /** The top k, without a threshold. */
  top: Scored[];
  /** What the search returns: the top k (rank) or the top k at or above the threshold (threshold). Null before ranking. */
  results: Scored[] | null;
  /** Whether the threshold applies at this step. */
  thresholded: boolean;
}

export function simulate(): Step[] {
  const steps: Step[] = [];
  const blank = { query: null, raw: null, unit: null, ranked: [], top: [], results: null, thresholded: false };
  steps.push({ kind: "start", stored: 0, ...blank });
  steps.push({ kind: "index", stored: DOC_VECTORS.length, ...blank });
  QUERY_VECTORS.forEach((raw, query) => {
    const ranked = rank(INDEX, raw);
    const top = search(INDEX, raw, { k: K });
    const base = { stored: DOC_VECTORS.length, query, raw, unit: normalize(raw), ranked, top };
    steps.push({ kind: "embed", ...base, results: null, thresholded: false });
    steps.push({ kind: "rank", ...base, results: top, thresholded: false });
    steps.push({ kind: "threshold", ...base, results: search(INDEX, raw, { k: K, threshold: THRESHOLD }), thresholded: true });
  });
  return steps;
}

export const STEPS = simulate();
export const LAST_STEP = STEPS.length - 1;
