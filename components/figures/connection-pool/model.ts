/**
 * Pure model of a database connection pool. No DOM, no geometry, no timers:
 * time is a number the caller passes in. Everything the figure shows (motion,
 * readout, panel) is derived from the steps this module produces, and
 * model.test.ts checks it against an independent reference pool.
 */

/** The most connections the pool will ever open. */
export const MAX = 3;
/** Seconds a client may wait for a connection before its acquire fails. */
export const ACQUIRE_TIMEOUT = 30;

/** Clients are numbered in order of arrival, from 1. */
export type Client = number;
/** Connections are numbered in the order the pool opened them, from 0. */
export type Conn = number;

export interface Waiter {
  client: Client;
  /** When the client started to wait. */
  since: number;
}

export interface PoolState {
  max: number;
  timeout: number;
  /** One entry per open connection: the client that holds it, or null when idle. */
  holders: (Client | null)[];
  /** Idle connections, the most recently released last. */
  idle: Conn[];
  /** Waiting clients, the oldest first. */
  waiters: Waiter[];
}

export type Outcome =
  /** No connection was idle and the pool was below its maximum: a new one was opened. */
  | { kind: "created"; at: number; client: Client; conn: Conn }
  /** An idle connection was handed out again. Nothing was opened. */
  | { kind: "reused"; at: number; client: Client; conn: Conn }
  /** Every connection was busy and the pool was full: the client waits. Position 1 is the oldest. */
  | { kind: "queued"; at: number; client: Client; position: number }
  /** A connection came back and nobody was waiting: it stays open, idle. */
  | { kind: "idle"; at: number; client: Client; conn: Conn }
  /** A connection came back and went straight to the oldest waiter. */
  | { kind: "handed"; at: number; client: Client; conn: Conn; to: Client; waited: number }
  /** A waiter reached the acquire timeout and left the queue with an error. */
  | { kind: "timeout"; at: number; client: Client; waited: number };

export interface Pool {
  /** Fails every waiter whose deadline is at or before `now`, oldest first. */
  expire(now: number): Outcome[];
  /** Asks for a connection. Deadlines that have passed are settled first. */
  acquire(client: Client, now: number): Outcome[];
  /** Gives a connection back. Deadlines that have passed are settled first. */
  release(client: Client, now: number): Outcome[];
  state(): PoolState;
}

export function createPool(max = MAX, timeout = ACQUIRE_TIMEOUT): Pool {
  const holders: (Client | null)[] = [];
  const idle: Conn[] = [];
  const waiters: Waiter[] = [];
  let clock = -Infinity;

  const tick = (now: number) => {
    if (now < clock) throw new Error(`time went backwards: ${now} after ${clock}`);
    clock = now;
  };

  const expire = (now: number): Outcome[] => {
    tick(now);
    const failed: Outcome[] = [];
    // The queue is in arrival order and the timeout is the same for everyone,
    // so the waiters whose time is up are always at the front.
    while (waiters.length && waiters[0].since + timeout <= now) {
      const { client, since } = waiters.shift() as Waiter;
      failed.push({ kind: "timeout", at: since + timeout, client, waited: timeout });
    }
    return failed;
  };

  const known = (client: Client) => holders.includes(client) || waiters.some((waiter) => waiter.client === client);

  return {
    expire,

    acquire(client, now) {
      const out = expire(now);
      if (known(client)) throw new Error(`client ${client} already holds or waits for a connection`);
      if (idle.length) {
        // Reuse comes first: nothing is opened while a connection is idle.
        const conn = idle.pop() as Conn;
        holders[conn] = client;
        out.push({ kind: "reused", at: now, client, conn });
      } else if (holders.length < max) {
        // Lazy creation: a connection is only opened when one is needed.
        holders.push(client);
        out.push({ kind: "created", at: now, client, conn: holders.length - 1 });
      } else {
        waiters.push({ client, since: now });
        out.push({ kind: "queued", at: now, client, position: waiters.length });
      }
      return out;
    },

    release(client, now) {
      // A waiter whose time is up at this very instant has already failed:
      // the timeout is settled before the connection changes hands.
      const out = expire(now);
      const conn = holders.indexOf(client);
      if (conn < 0) throw new Error(`client ${client} holds no connection`);
      const next = waiters.shift();
      if (next) {
        holders[conn] = next.client;
        out.push({ kind: "handed", at: now, client, conn, to: next.client, waited: now - next.since });
      } else {
        holders[conn] = null;
        idle.push(conn);
        out.push({ kind: "idle", at: now, client, conn });
      }
      return out;
    },

    state: () => ({
      max,
      timeout,
      holders: [...holders],
      idle: [...idle],
      waiters: waiters.map((waiter) => ({ ...waiter })),
    }),
  };
}

/* The scripted scenario the figure walks through. */

export interface Call {
  at: number;
  kind: "acquire" | "release";
  client: Client;
}

/**
 * Six clients against a pool of three. Client 2 never releases: that is the
 * leak. Times are seconds.
 */
export const SCRIPT: Call[] = [
  { at: 0, kind: "acquire", client: 1 },
  { at: 5, kind: "release", client: 1 },
  { at: 10, kind: "acquire", client: 2 },
  { at: 12, kind: "acquire", client: 3 },
  { at: 14, kind: "acquire", client: 4 },
  { at: 20, kind: "acquire", client: 5 },
  { at: 25, kind: "acquire", client: 6 },
  { at: 40, kind: "release", client: 3 },
  { at: 60, kind: "release", client: 4 },
  { at: 70, kind: "release", client: 5 },
];
/** When the scenario stops being watched. */
export const SCRIPT_END = 80;

export const CLIENTS: Client[] = [...new Set(SCRIPT.map((call) => call.client))].sort((a, b) => a - b);

export type StepKind = "start" | Outcome["kind"] | "end";

/** Where a client is at a given step. */
export type Place =
  | { where: "outside" }
  | { where: "waiting"; position: number }
  | { where: "holding"; conn: Conn }
  | { where: "served" }
  | { where: "failed" };

export interface Step extends PoolState {
  kind: StepKind;
  /** Seconds since the start. */
  at: number;
  /** What happened. Null for the first and last steps. */
  outcome: Outcome | null;
  /** Clients that gave their connection back, in order. */
  served: Client[];
  /** Clients whose acquire timed out, in order. */
  failed: Client[];
  /** Clients that still hold a connection when the scenario ends. Only set on the last step. */
  leaked: Client[];
  /** Seconds the oldest waiter has been waiting (0 with an empty queue). */
  oldestWait: number;
}

/** Runs a script against a pool and records every observable moment. */
export function simulate(script: Call[] = SCRIPT, end = SCRIPT_END, max = MAX, timeout = ACQUIRE_TIMEOUT): Step[] {
  const pool = createPool(max, timeout);
  const served: Client[] = [];
  const failed: Client[] = [];
  const steps: Step[] = [];

  const snapshot = (kind: StepKind, at: number, outcome: Outcome | null, leaked: Client[] = []) => {
    const state = pool.state();
    steps.push({
      ...state,
      kind,
      at,
      outcome,
      served: [...served],
      failed: [...failed],
      leaked,
      oldestWait: state.waiters.length ? at - state.waiters[0].since : 0,
    });
  };

  const record = (outcomes: Outcome[]) => {
    for (const outcome of outcomes) {
      if (outcome.kind === "timeout") failed.push(outcome.client);
      if (outcome.kind === "idle" || outcome.kind === "handed") served.push(outcome.client);
      snapshot(outcome.kind, outcome.at, outcome);
    }
  };

  snapshot("start", 0, null);
  for (const call of script) {
    // One timeout at a time, each at its own deadline, so every one is a step
    // that shows the queue as it was at that moment.
    for (;;) {
      const oldest = pool.state().waiters[0];
      if (!oldest || oldest.since + timeout > call.at) break;
      record(pool.expire(oldest.since + timeout));
    }
    record(call.kind === "acquire" ? pool.acquire(call.client, call.at) : pool.release(call.client, call.at));
  }
  for (;;) {
    const oldest = pool.state().waiters[0];
    if (!oldest || oldest.since + timeout > end) break;
    record(pool.expire(oldest.since + timeout));
  }
  snapshot(
    "end",
    end,
    null,
    pool.state().holders.filter((holder): holder is Client => holder !== null),
  );
  return steps;
}

export const STEPS = simulate();
export const LAST_STEP = STEPS.length - 1;

/** Where a client is in a step. */
export function placeOf(client: Client, step: Step): Place {
  const conn = step.holders.indexOf(client);
  if (conn >= 0) return { where: "holding", conn };
  const position = step.waiters.findIndex((waiter) => waiter.client === client);
  if (position >= 0) return { where: "waiting", position: position + 1 };
  if (step.served.includes(client)) return { where: "served" };
  if (step.failed.includes(client)) return { where: "failed" };
  return { where: "outside" };
}

/** Counts for the readout. */
export const countsOf = (step: PoolState) => ({
  open: step.holders.length,
  busy: step.holders.filter((holder) => holder !== null).length,
  idle: step.idle.length,
  waiting: step.waiters.length,
});
