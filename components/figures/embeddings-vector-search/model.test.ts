import { describe, expect, it } from "vitest";
import {
  DOC_VECTORS,
  INDEX,
  K,
  QUERY_VECTORS,
  STEPS,
  THRESHOLD,
  createIndex,
  dot,
  normalize,
  rank,
  search,
  simulate,
  type Vector,
} from "./model";

/*
 * An independent reference: cosine similarity written from scratch, sharing
 * no helper with model.ts, and a brute-force top k that sorts every document.
 */

function referenceCosine(a: readonly number[], b: readonly number[]): number {
  let ab = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < a.length; i++) {
    ab += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return ab / (Math.sqrt(aa) * Math.sqrt(bb));
}

function referenceTopK(docs: readonly (readonly number[])[], query: readonly number[], k: number, threshold: number | null) {
  const scored: { doc: number; score: number }[] = [];
  for (let doc = 0; doc < docs.length; doc++) scored.push({ doc, score: referenceCosine(docs[doc], query) });
  // Selection sort, best first; a later document never passes an earlier one with the same score.
  for (let i = 0; i < scored.length; i++) {
    let best = i;
    for (let j = i + 1; j < scored.length; j++) if (scored[j].score > scored[best].score) best = j;
    const [picked] = scored.splice(best, 1);
    scored.splice(i, 0, picked);
  }
  const top = scored.slice(0, k);
  return threshold === null ? top : top.filter((hit) => hit.score >= threshold);
}

/** A seeded generator, so the random cases are the same on every run. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const random = seeded(20261117);
const randomVector = (dims: number): Vector => Array.from({ length: dims }, () => random() * 2 - 1);

const docsOf = (hits: { doc: number }[]) => hits.map((hit) => hit.doc);

describe("embeddings and vector search model", () => {
  it("ranks the figure's documents like a brute-force cosine search", () => {
    for (const query of QUERY_VECTORS) {
      const model = rank(INDEX, query);
      const reference = referenceTopK(DOC_VECTORS, query, DOC_VECTORS.length, null);
      expect(docsOf(model)).toEqual(docsOf(reference));
      model.forEach((hit, at) => expect(hit.score).toBeCloseTo(reference[at].score, 12));
    }
  });

  it("matches the reference on random indexes, in 2 and in 384 dimensions", () => {
    for (const dims of [2, 384]) {
      for (let run = 0; run < 40; run++) {
        const docs = Array.from({ length: 25 }, () => randomVector(dims));
        const query = randomVector(dims);
        const index = createIndex(docs);
        for (const threshold of [null, 0, 0.1]) {
          const model = search(index, query, { k: 5, threshold });
          const reference = referenceTopK(docs, query, 5, threshold);
          expect(docsOf(model)).toEqual(docsOf(reference));
        }
      }
    }
  });

  it("gives the dot product of normalized vectors as the cosine similarity", () => {
    for (let run = 0; run < 50; run++) {
      const a = randomVector(16);
      const b = randomVector(16);
      expect(dot(normalize(a), normalize(b))).toBeCloseTo(referenceCosine(a, b), 12);
    }
    for (const vector of INDEX.vectors) expect(Math.sqrt(dot(vector, vector))).toBeCloseTo(1, 12);
  });

  it("sorts the top k best first and keeps index order on ties", () => {
    for (const query of QUERY_VECTORS) {
      const top = search(INDEX, query);
      expect(top).toHaveLength(K);
      for (let at = 1; at < top.length; at++) expect(top[at - 1].score).toBeGreaterThanOrEqual(top[at].score);
    }
    // Exact duplicates score exactly the same, so only the tie-break can order them.
    const twin: Vector = [0.3, 0.9];
    const index = createIndex([[1, 0], twin, [0, 1], twin, twin]);
    const hits = search(index, [0.3, 0.9], { k: 3 });
    expect(hits.map((hit) => hit.score)).toEqual([hits[0].score, hits[0].score, hits[0].score]);
    expect(docsOf(hits)).toEqual([1, 3, 4]);
  });

  it("returns the near query's three bread documents, clearly above the threshold", () => {
    const top = search(INDEX, QUERY_VECTORS[0]);
    expect(docsOf(top)).toEqual([1, 2, 0]);
    expect(top[K - 1].score).toBeGreaterThan(THRESHOLD + 0.1);
    expect(docsOf(search(INDEX, QUERY_VECTORS[0], { threshold: THRESHOLD }))).toEqual([1, 2, 0]);
  });

  it("still returns three for the far query, and nothing once the threshold applies", () => {
    const top = search(INDEX, QUERY_VECTORS[1]);
    expect(top).toHaveLength(K);
    expect(top[0].score).toBeLessThan(THRESHOLD - 0.3);
    expect(search(INDEX, QUERY_VECTORS[1], { threshold: THRESHOLD })).toEqual([]);
  });

  it("does not change when a vector is scaled", () => {
    for (const query of QUERY_VECTORS) {
      const before = rank(INDEX, query);
      const scaledDocs = DOC_VECTORS.map((vector, doc) => vector.map((value) => value * (0.2 + doc * 1.7)));
      const after = rank(createIndex(scaledDocs), query.map((value) => value * 42));
      expect(docsOf(after)).toEqual(docsOf(before));
      after.forEach((hit, at) => expect(hit.score).toBeCloseTo(before[at].score, 12));
    }
  });

  it("keeps a real gap after the k-th result, so the figure's sweep stops cleanly", () => {
    for (const query of QUERY_VECTORS) {
      const ranked = rank(INDEX, query);
      expect(ranked[K - 1].score - ranked[K].score).toBeGreaterThan(0.15);
      for (let at = 1; at < ranked.length; at++) expect(ranked[at - 1].score - ranked[at].score).toBeGreaterThan(0.005);
    }
  });

  it("walks the script in order and is deterministic", () => {
    expect(STEPS.map((step) => step.kind)).toEqual(["start", "index", "embed", "rank", "threshold", "embed", "rank", "threshold"]);
    expect(STEPS[0].stored).toBe(0);
    expect(STEPS.at(-1)?.results).toEqual([]);
    expect(simulate()).toEqual(STEPS);
  });

  it("refuses vectors of different lengths and zero vectors", () => {
    expect(() => createIndex([[1, 0], [1, 0, 0]])).toThrow();
    expect(() => normalize([0, 0])).toThrow();
  });
});
