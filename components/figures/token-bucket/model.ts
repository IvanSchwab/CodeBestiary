/**
 * Pure model of a token bucket rate limiter. No DOM, no geometry.
 * Everything the figure shows (motion, readout, panel, timeline) is derived
 * from the steps this module produces, and model.test.ts checks it against
 * an independent implementation of the same algorithm.
 *
 * The bucket is the classic one: a clock adds one token every `refillMs`,
 * the bucket never holds more than `capacity`, and a token that arrives at a
 * full bucket is discarded. A request passes only by taking one token;
 * with the bucket empty it is rejected at once (it does not wait).
 */

export interface Config {
  /** Most tokens the bucket holds. It also is the largest burst. */
  capacity: number;
  /** Milliseconds between two tokens: the refill rate is 1000 / refillMs per second. */
  refillMs: number;
}

/** The numbers the figure uses: 4 tokens, 1 token per second. */
export const CAPACITY = 4;
export const REFILL_MS = 1000;
export const CONFIG: Config = { capacity: CAPACITY, refillMs: REFILL_MS };

export type StepKind = "idle" | "refill" | "request";
export type Outcome = "added" | "discarded" | "passed" | "rejected";

export interface Step {
  kind: StepKind;
  /** What happened to the token (refill) or to the request. Null only while idle. */
  outcome: Outcome | null;
  /** Time of the event, in milliseconds since the start. */
  t: number;
  /** Tokens in the bucket after the event. */
  tokens: number;
  /** Running totals after the event. */
  added: number;
  discarded: number;
  passed: number;
  rejected: number;
}

/**
 * Runs the bucket from full at t = 0 until `until` (inclusive), with one
 * request at each time in `arrivals` (milliseconds). Every tick of the refill
 * clock and every request becomes a step, in time order. When a tick and a
 * request fall on the same instant, the tick goes first.
 */
export function simulate(arrivals: readonly number[], until: number, config: Config = CONFIG): Step[] {
  const { capacity, refillMs } = config;
  const requests = [...arrivals].sort((a, b) => a - b);
  let tokens = capacity;
  let added = 0;
  let discarded = 0;
  let passed = 0;
  let rejected = 0;
  const steps: Step[] = [];
  const snapshot = (kind: StepKind, outcome: Outcome | null, t: number) =>
    steps.push({ kind, outcome, t, tokens, added, discarded, passed, rejected });

  snapshot("idle", null, 0);

  let tick = refillMs;
  let next = 0;
  for (;;) {
    const request = next < requests.length ? requests[next] : Infinity;
    if (tick > until && request > until) break;
    if (tick <= request) {
      if (tokens < capacity) {
        tokens += 1;
        added += 1;
        snapshot("refill", "added", tick);
      } else {
        discarded += 1;
        snapshot("refill", "discarded", tick);
      }
      tick += refillMs;
    } else {
      if (tokens >= 1) {
        tokens -= 1;
        passed += 1;
        snapshot("request", "passed", request);
      } else {
        rejected += 1;
        snapshot("request", "rejected", request);
      }
      next += 1;
    }
  }
  return steps;
}

/**
 * The scene the figure plays, in milliseconds.
 *  - 1.0 s: the bucket is still full, so the token that arrives is discarded.
 *  - 1.1 to 1.5 s: a burst of five requests. Four pass, the fifth is rejected.
 *  - 2 to 4 s: requests keep coming at two per second; one per second passes.
 *  - 4 to 7 s: no requests. The bucket fills back up to 4.
 */
export const ARRIVALS = [1100, 1200, 1300, 1400, 1500, 2200, 2600, 3200, 3600] as const;
export const UNTIL = 7000;

export const STEPS = simulate(ARRIVALS, UNTIL);
export const LAST_STEP = STEPS.length - 1;
