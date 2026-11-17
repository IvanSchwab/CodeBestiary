import { describe, expect, it } from "vitest";
import {
  ACQUIRE_TIMEOUT,
  MAX,
  SCRIPT,
  SCRIPT_END,
  STEPS,
  countsOf,
  createPool,
  simulate,
  type Call,
  type Outcome,
} from "./model";

/**
 * An independent, deliberately plain pool to compare the model against. It
 * shares no code with model.ts and keeps its state differently: a list of
 * connection records and a list of tickets, scanned every time.
 */
class ReferencePool {
  private connections: { owner: number | null; freedSeq: number }[] = [];
  private tickets: { who: number; deadline: number; arrived: number }[] = [];
  private seq = 0;

  constructor(
    private size: number,
    private patience: number,
  ) {}

  private lapse(now: number): string[] {
    const log: string[] = [];
    const due = this.tickets.filter((ticket) => ticket.deadline <= now).sort((a, b) => a.arrived - b.arrived);
    for (const ticket of due) {
      this.tickets = this.tickets.filter((other) => other !== ticket);
      log.push(`timeout ${ticket.who} @${ticket.deadline}`);
    }
    return log;
  }

  acquire(who: number, now: number): string[] {
    const log = this.lapse(now);
    const free = this.connections
      .map((connection, index) => ({ connection, index }))
      .filter(({ connection }) => connection.owner === null)
      .sort((a, b) => b.connection.freedSeq - a.connection.freedSeq)[0];
    if (free) {
      free.connection.owner = who;
      log.push(`reused ${who} #${free.index} @${now}`);
    } else if (this.connections.length < this.size) {
      this.connections.push({ owner: who, freedSeq: 0 });
      log.push(`created ${who} #${this.connections.length - 1} @${now}`);
    } else {
      this.tickets.push({ who, deadline: now + this.patience, arrived: now });
      log.push(`queued ${who} pos ${this.tickets.length} @${now}`);
    }
    return log;
  }

  release(who: number, now: number): string[] {
    const log = this.lapse(now);
    const index = this.connections.findIndex((connection) => connection.owner === who);
    const oldest = [...this.tickets].sort((a, b) => a.arrived - b.arrived)[0];
    if (oldest) {
      this.tickets = this.tickets.filter((ticket) => ticket !== oldest);
      this.connections[index].owner = oldest.who;
      log.push(`handed ${who} #${index} to ${oldest.who} @${now}`);
    } else {
      this.connections[index].owner = null;
      this.connections[index].freedSeq = ++this.seq;
      log.push(`idle ${who} #${index} @${now}`);
    }
    return log;
  }

  finish(now: number): string[] {
    return this.lapse(now);
  }

  get open() {
    return this.connections.length;
  }
}

/** The model's outcomes in the reference's log format. */
const lineOf = (outcome: Outcome): string => {
  switch (outcome.kind) {
    case "created":
    case "reused":
    case "idle":
      return `${outcome.kind} ${outcome.client} #${outcome.conn} @${outcome.at}`;
    case "queued":
      return `queued ${outcome.client} pos ${outcome.position} @${outcome.at}`;
    case "handed":
      return `handed ${outcome.client} #${outcome.conn} to ${outcome.to} @${outcome.at}`;
    case "timeout":
      return `timeout ${outcome.client} @${outcome.at}`;
  }
};

function traceOfModel(script: Call[], end: number, max: number, timeout: number): string[] {
  const pool = createPool(max, timeout);
  const lines: string[] = [];
  for (const call of script) {
    const outcomes = call.kind === "acquire" ? pool.acquire(call.client, call.at) : pool.release(call.client, call.at);
    lines.push(...outcomes.map(lineOf));
  }
  lines.push(...pool.expire(end).map(lineOf));
  return lines;
}

function traceOfReference(script: Call[], end: number, max: number, timeout: number): string[] {
  const pool = new ReferencePool(max, timeout);
  const lines: string[] = [];
  for (const call of script) {
    lines.push(...(call.kind === "acquire" ? pool.acquire(call.client, call.at) : pool.release(call.client, call.at)));
  }
  lines.push(...pool.finish(end));
  return lines;
}

/** A small seeded generator, so the random scripts are the same on every run. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/** A valid random script: clients only release what they hold, and some never do. */
function randomScript(seed: number, max: number, timeout: number, calls = 60): Call[] {
  const random = seeded(seed);
  const shadow = new ReferencePool(max, timeout);
  const holding = new Set<number>();
  const waiting = new Set<number>();
  const script: Call[] = [];
  let now = 0;
  let nextClient = 1;
  const settle = (log: string[]) => {
    for (const line of log) {
      const [kind, who, , , target] = line.split(" ");
      if (kind === "created" || kind === "reused") holding.add(Number(who));
      if (kind === "queued") waiting.add(Number(who));
      if (kind === "timeout") waiting.delete(Number(who));
      if (kind === "idle") holding.delete(Number(who));
      if (kind === "handed") {
        holding.delete(Number(who));
        waiting.delete(Number(target));
        holding.add(Number(target));
      }
    }
  };
  for (let index = 0; index < calls; index++) {
    now += Math.floor(random() * 14);
    const holders = [...holding];
    if (holders.length && random() < 0.45) {
      const client = holders[Math.floor(random() * holders.length)];
      script.push({ at: now, kind: "release", client });
      settle(shadow.release(client, now));
    } else {
      const client = nextClient++;
      script.push({ at: now, kind: "acquire", client });
      settle(shadow.acquire(client, now));
    }
  }
  return script;
}

describe("connection pool model", () => {
  it("follows the same trace as the reference pool for the figure's script", () => {
    const expected = traceOfReference(SCRIPT, SCRIPT_END, MAX, ACQUIRE_TIMEOUT);
    expect(traceOfModel(SCRIPT, SCRIPT_END, MAX, ACQUIRE_TIMEOUT)).toEqual(expected);
    expect(expected).toEqual([
      "created 1 #0 @0",
      "idle 1 #0 @5",
      "reused 2 #0 @10",
      "created 3 #1 @12",
      "created 4 #2 @14",
      "queued 5 pos 1 @20",
      "queued 6 pos 2 @25",
      "handed 3 #1 to 5 @40",
      "timeout 6 @55",
      "idle 4 #2 @60",
      "idle 5 #1 @70",
    ]);
  });

  it("produces one step per outcome, between a start and an end", () => {
    expect(STEPS.map((step) => step.kind)).toEqual([
      "start",
      "created",
      "idle",
      "reused",
      "created",
      "created",
      "queued",
      "queued",
      "handed",
      "timeout",
      "idle",
      "idle",
      "end",
    ]);
    expect(STEPS.slice(1, -1).map((step) => lineOf(step.outcome as Outcome))).toEqual(
      traceOfReference(SCRIPT, SCRIPT_END, MAX, ACQUIRE_TIMEOUT),
    );
  });

  it("follows the reference pool on random scripts, for several pool sizes and timeouts", () => {
    for (const [max, timeout] of [
      [1, 10],
      [2, 25],
      [3, 30],
      [5, 8],
    ]) {
      for (let seed = 1; seed <= 40; seed++) {
        const script = randomScript(seed * 7919 + max, max, timeout);
        const end = (script.at(-1)?.at ?? 0) + timeout + 1;
        expect(traceOfModel(script, end, max, timeout)).toEqual(traceOfReference(script, end, max, timeout));
      }
    }
  });

  it("never holds more connections than the maximum, in any step", () => {
    const check = (steps: typeof STEPS, max: number) => {
      for (const step of steps) {
        const { open, busy, idle } = countsOf(step);
        expect(busy + idle).toBe(open);
        expect(open).toBeLessThanOrEqual(max);
        // The idle list and the holders agree.
        expect([...step.idle].sort()).toEqual(step.holders.flatMap((holder, conn) => (holder === null ? [conn] : [])));
      }
    };
    check(STEPS, MAX);
    for (let seed = 1; seed <= 20; seed++) {
      const script = randomScript(seed, 2, 20);
      check(simulate(script, (script.at(-1)?.at ?? 0) + 21, 2, 20), 2);
    }
  });

  it("never opens a connection while one is idle, and never waits while one could be had", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const script = randomScript(seed + 100, 3, 30);
      const steps = simulate(script, (script.at(-1)?.at ?? 0) + 31, 3, 30);
      steps.forEach((step, index) => {
        if (index === 0) return;
        const before = steps[index - 1];
        if (step.kind === "created") expect(before.idle).toEqual([]);
        if (step.kind === "reused") expect(step.holders.length).toBe(before.holders.length);
        if (step.kind === "queued") {
          expect(before.idle).toEqual([]);
          expect(before.holders.length).toBe(3);
        }
        // Connections are never closed in this model: the count only grows.
        expect(step.holders.length).toBeGreaterThanOrEqual(before.holders.length);
        // Nobody waits while a connection is idle.
        if (step.waiters.length) expect(step.idle).toEqual([]);
      });
    }
  });

  it("hands a released connection to the oldest waiter", () => {
    const handed = STEPS.findIndex((step) => step.kind === "handed");
    const before = STEPS[handed - 1];
    const step = STEPS[handed];
    expect(before.waiters.map((waiter) => waiter.client)).toEqual([5, 6]);
    expect(step.outcome).toMatchObject({ client: 3, conn: 1, to: 5, waited: 20 });
    expect(step.holders[1]).toBe(5);
    expect(step.waiters.map((waiter) => waiter.client)).toEqual([6]);
    // The connection went from hand to hand: it was never idle.
    expect(step.idle).toEqual([]);

    for (let seed = 1; seed <= 20; seed++) {
      const script = randomScript(seed + 200, 2, 40);
      const steps = simulate(script, (script.at(-1)?.at ?? 0) + 41, 2, 40);
      steps.forEach((current, index) => {
        if (current.outcome?.kind !== "handed") return;
        expect(current.outcome.to).toBe(steps[index - 1].waiters[0].client);
      });
    }
  });

  it("fails a waiter at the acquire timeout and removes it from the queue", () => {
    const index = STEPS.findIndex((step) => step.kind === "timeout");
    const step = STEPS[index];
    expect(step.at).toBe(25 + ACQUIRE_TIMEOUT);
    expect(step.outcome).toMatchObject({ client: 6, waited: ACQUIRE_TIMEOUT });
    expect(STEPS[index - 1].waiters.map((waiter) => waiter.client)).toEqual([6]);
    expect(step.waiters).toEqual([]);
    expect(step.failed).toEqual([6]);
    // A client that timed out never gets a connection afterwards.
    for (const later of STEPS.slice(index)) expect(later.holders).not.toContain(6);
  });

  it("settles a timeout before a release that happens at the same instant", () => {
    const pool = createPool(1, 30);
    pool.acquire(1, 0);
    pool.acquire(2, 10);
    const outcomes = pool.release(1, 40);
    expect(outcomes.map((outcome) => outcome.kind)).toEqual(["timeout", "idle"]);
    expect(pool.state().holders).toEqual([null]);
  });

  it("hands over one instant before the deadline", () => {
    const pool = createPool(1, 30);
    pool.acquire(1, 0);
    pool.acquire(2, 10);
    expect(pool.release(1, 39).map((outcome) => outcome.kind)).toEqual(["handed"]);
    expect(pool.state().holders).toEqual([2]);
  });

  it("ends with the leaked connection still held", () => {
    const last = STEPS.at(-1);
    expect(last?.kind).toBe("end");
    expect(last?.leaked).toEqual([2]);
    expect(last?.holders).toEqual([2, null, null]);
    expect(last?.served).toEqual([1, 3, 4, 5]);
    expect(last?.failed).toEqual([6]);
  });

  it("rejects calls that make no sense", () => {
    const pool = createPool(1, 30);
    pool.acquire(1, 0);
    expect(() => pool.acquire(1, 1)).toThrow();
    expect(() => pool.release(9, 1)).toThrow();
    expect(() => pool.release(1, 0.5)).toThrow();
  });

  it("is deterministic", () => {
    expect(simulate()).toEqual(STEPS);
  });
});
