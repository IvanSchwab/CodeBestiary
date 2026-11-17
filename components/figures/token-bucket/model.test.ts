import { describe, expect, it } from "vitest";
import { ARRIVALS, CAPACITY, CONFIG, REFILL_MS, STEPS, UNTIL, simulate, type Config } from "./model";

/**
 * An independent token bucket, written the way production limiters usually
 * are: no clock events, the bucket is topped up lazily when a request shows
 * up. Whole tokens, anchored to the same clock as the model (one token per
 * `refillMs` since t = 0), capped at `capacity`.
 */
function reference(arrivals: readonly number[], { capacity, refillMs }: Config) {
  let tokens = capacity;
  let last = 0;
  let overflow = 0;
  const verdicts: boolean[] = [];
  const levels: number[] = [];
  const topUp = (now: number) => {
    const earned = Math.floor((now - last) / refillMs);
    if (earned <= 0) return;
    const room = capacity - tokens;
    overflow += Math.max(0, earned - room);
    tokens = Math.min(capacity, tokens + earned);
    last += earned * refillMs;
  };
  for (const now of [...arrivals].sort((a, b) => a - b)) {
    topUp(now);
    const pass = tokens >= 1;
    if (pass) tokens -= 1;
    verdicts.push(pass);
    levels.push(tokens);
  }
  return {
    verdicts,
    levels,
    finish(until: number) {
      topUp(until);
      return { tokens, overflow };
    },
  };
}

const requestsOf = (steps: typeof STEPS) => steps.filter((step) => step.kind === "request");

/** Small deterministic generator, so the random cases are the same on every run. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

describe("token bucket model", () => {
  it("matches the reference on the figure's own script: verdicts, levels and discards", () => {
    const real = reference(ARRIVALS, CONFIG);
    const requests = requestsOf(STEPS);
    expect(requests.map((step) => step.outcome === "passed")).toEqual(real.verdicts);
    expect(requests.map((step) => step.tokens)).toEqual(real.levels);
    const end = real.finish(UNTIL);
    expect(STEPS.at(-1)?.tokens).toBe(end.tokens);
    expect(STEPS.at(-1)?.discarded).toBe(end.overflow);
  });

  it("plays the scene the figure describes", () => {
    expect(STEPS.map((step) => step.outcome)).toEqual([
      null,
      "discarded",
      "passed",
      "passed",
      "passed",
      "passed",
      "rejected",
      "added",
      "passed",
      "rejected",
      "added",
      "passed",
      "rejected",
      "added",
      "added",
      "added",
      "added",
    ]);
    // It ends as it began, full, so the tour can loop.
    expect(STEPS[0].tokens).toBe(CAPACITY);
    expect(STEPS.at(-1)?.tokens).toBe(CAPACITY);
  });

  it("matches the reference on random traffic, for several capacities and rates", () => {
    const configs: Config[] = [CONFIG, { capacity: 1, refillMs: 250 }, { capacity: 10, refillMs: 100 }, { capacity: 3, refillMs: 1700 }];
    configs.forEach((config, which) => {
      for (let seed = 1; seed <= 25; seed++) {
        const random = seeded(seed * 97 + which);
        const until = 60 * config.refillMs;
        let now = 0;
        const arrivals: number[] = [];
        while (arrivals.length < 400) {
          // Bursts and lulls; times that fall exactly on a tick are skipped so no tie rule is involved.
          now += Math.floor(random() ** 3 * config.refillMs * 4) + 1;
          if (now >= until) break;
          if (now % config.refillMs !== 0) arrivals.push(now);
        }
        const steps = simulate(arrivals, until, config);
        const real = reference(arrivals, config);
        const requests = requestsOf(steps);
        expect(requests.map((step) => step.outcome === "passed")).toEqual(real.verdicts);
        expect(requests.map((step) => step.tokens)).toEqual(real.levels);
        const end = real.finish(until);
        expect(steps.at(-1)?.tokens).toBe(end.tokens);
        expect(steps.at(-1)?.discarded).toBe(end.overflow);
        // Invariants, at every step.
        steps.forEach((step, index) => {
          expect(step.tokens).toBeGreaterThanOrEqual(0);
          expect(step.tokens).toBeLessThanOrEqual(config.capacity);
          expect(Number.isInteger(step.tokens)).toBe(true);
          // Tokens are conserved: what the bucket had plus what went in, minus what was spent.
          expect(step.tokens).toBe(config.capacity + step.added - step.passed);
          if (index) expect(step.t).toBeGreaterThanOrEqual(steps[index - 1].t);
        });
        const last = steps.at(-1)!;
        expect(last.added + last.discarded).toBe(Math.floor(until / config.refillMs));
        expect(last.passed + last.rejected).toBe(arrivals.length);
      }
    });
  });

  it("lets a burst through up to the capacity, starting from full", () => {
    for (const capacity of [1, 4, 7]) {
      const config = { capacity, refillMs: 1000 };
      // Twenty requests inside one refill period, before the first tick.
      const burst = Array.from({ length: 20 }, (_, index) => 10 + index * 5);
      const steps = requestsOf(simulate(burst, 999, config));
      expect(steps.filter((step) => step.outcome === "passed")).toHaveLength(capacity);
      // The ones that pass are the first ones.
      expect(steps.slice(0, capacity).every((step) => step.outcome === "passed")).toBe(true);
      expect(steps.slice(capacity).every((step) => step.outcome === "rejected")).toBe(true);
    }
  });

  it("settles at the refill rate under sustained load", () => {
    // Ten requests per refill period for 1000 periods.
    const periods = 1000;
    const arrivals: number[] = [];
    for (let now = 37; now < periods * REFILL_MS; now += REFILL_MS / 10) arrivals.push(now);
    const last = simulate(arrivals, periods * REFILL_MS, CONFIG).at(-1)!;
    // Exactly the initial burst plus one request per token minted before the last arrival.
    expect(last.passed).toBe(CAPACITY + (periods - 1));
    const perSecond = last.passed / periods / (REFILL_MS / 1000);
    expect(perSecond).toBeGreaterThan(1);
    expect(perSecond).toBeLessThan(1.01);
    // After the burst, never more than one pass in any refill period.
    const passes = requestsOf(simulate(arrivals, periods * REFILL_MS, CONFIG))
      .filter((step) => step.outcome === "passed")
      .map((step) => step.t)
      .filter((t) => t > REFILL_MS);
    for (let index = 1; index < passes.length; index++) expect(passes[index] - passes[index - 1]).toBeGreaterThanOrEqual(REFILL_MS - 1);
  });

  it("discards every token that arrives at a full bucket", () => {
    const steps = simulate([], 5 * REFILL_MS, CONFIG);
    expect(steps.slice(1).every((step) => step.outcome === "discarded")).toBe(true);
    expect(steps.at(-1)?.discarded).toBe(5);
    expect(steps.at(-1)?.tokens).toBe(CAPACITY);
  });

  it("refills before serving when a tick and a request share an instant", () => {
    const steps = simulate([500, 1000], 1000, { capacity: 1, refillMs: 1000 });
    expect(steps.map((step) => step.outcome)).toEqual([null, "passed", "added", "passed"]);
  });

  it("is deterministic", () => {
    expect(simulate(ARRIVALS, UNTIL)).toEqual(STEPS);
  });
});
