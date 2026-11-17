import { computed, effect, ref, type DebuggerEvent } from "@vue/reactivity";
import { describe, expect, it } from "vitest";
import { EFFECT_LINE, SETUP, SNIPPET, STEPS, WRITES, eventsByLine, lineOf, simulate, subscribersOf, type Write } from "./model";

interface Real {
  /** What the library did, grouped by the line of the script that caused it. */
  events: string[][];
  output: string[];
  /** How many links the effect held as "to be confirmed" when each of its runs started. */
  pendingAtRunStart: number[];
}

/**
 * Runs the script, as text, against the real @vue/reactivity. ref, computed
 * and effect are the library's own; they are only wrapped to listen: the
 * library's debug hooks report every track and trigger, and the getter, the
 * effect and console.log report when they run.
 */
function runInVue(lines: string[]): Real {
  const events: string[][] = lines.map(() => []);
  const output: string[] = [];
  const pendingAtRunStart: number[] = [];
  const names = new Map<object, string>();
  let line = 0;

  const say = (event: string) => events[line].push(event);
  const nameOfLine = () => /const (\w+)/.exec(lines[line])?.[1] ?? "?";
  const hooks = (who: string) => ({
    onTrack: (event: DebuggerEvent) => say(`track ${who} ${names.get(event.target)}`),
    onTrigger: () => say(`trigger ${who}`),
  });

  const api = {
    mark: (index: number) => {
      line = index;
    },
    ref: (value: unknown) => {
      const made = ref(value);
      names.set(made, nameOfLine());
      return made;
    },
    computed: (getter: () => unknown) => {
      const who = nameOfLine();
      const made = computed(() => {
        say(`compute ${who}`);
        return getter();
      }, hooks(who));
      names.set(made, who);
      return made;
    },
    effect: (fn: () => void) => {
      // Vue keeps a subscriber's links in a list and marks each one with
      // version -1 when a run starts, until the run reads it again.
      type Link = { version: number; nextDep?: Link };
      const holder: { runner?: { effect: { deps?: Link } } } = {};
      holder.runner = effect(() => {
        say("run effect");
        let pending = 0;
        for (let link = holder.runner?.effect.deps; link; link = link.nextDep) if (link.version === -1) pending++;
        pendingAtRunStart.push(pending);
        fn();
      }, hooks("effect")) as unknown as typeof holder.runner;
    },
    console: {
      log: (value: unknown) => {
        say(`log ${value}`);
        output.push(String(value));
      },
    },
  };

  const body = lines.map((text, index) => `mark(${index});\n${text}`).join("\n");
  new Function(...Object.keys(api), body)(...Object.values(api));
  return { events, output, pendingAtRunStart };
}

const scriptOf = (writes: Write[]) => [...SETUP, ...writes.map(lineOf)];

/** The model and the library, side by side, for a list of writes. */
function compare(writes: Write[]) {
  const lines = scriptOf(writes);
  const steps = simulate(writes);
  return { steps, model: eventsByLine(steps, lines.length), real: runInVue(lines) };
}

describe("vue reactivity model", () => {
  it("does what @vue/reactivity does, in the same order, for the figure's script", () => {
    const real = runInVue(SNIPPET);
    expect(eventsByLine(STEPS, SNIPPET.length)).toEqual(real.events);
    expect(STEPS.at(-1)?.output).toEqual(real.output);
    expect(real.output).toEqual(["2", "4", "off"]);
  });

  it("tracks on read: the effect links to show and double, and double to count", () => {
    const real = runInVue(SNIPPET);
    expect(real.events[EFFECT_LINE]).toEqual([
      "run effect",
      "track effect show",
      "track effect double",
      "compute double",
      "track double count",
      "log 2",
    ]);
    const after = STEPS.filter((step) => step.line === EFFECT_LINE).at(-1);
    expect(after?.links).toEqual({ "double:count": "on", "effect:show": "on", "effect:double": "on" });
  });

  it("is lazy: the computed's getter does not run until something reads it", () => {
    const real = runInVue(SNIPPET);
    for (const index of [0, 1, 2]) expect(real.events[index]).toEqual([]);
    expect(STEPS[0].double).toBeNull();
    expect(STEPS[0].dirty).toBe(true);
  });

  it("on a trigger the computed is marked dirty first, recomputes when asked, and the effect then reads it from cache", () => {
    const real = runInVue(SNIPPET);
    const line = SETUP.length;
    expect(real.events[line]).toEqual([
      "trigger double",
      "trigger effect",
      "compute double",
      "track double count",
      "run effect",
      "track effect show",
      "track effect double",
      "log 4",
    ]);
    const steps = STEPS.filter((step) => step.line === line);
    expect(steps.map((step) => step.kind)).toEqual(["write", "compute", "run", "read", "read", "log"]);
    expect(steps[0].dirty).toBe(true);
    expect(steps[0].double).toBe(2);
    expect(steps[1].dirty).toBe(false);
    expect(steps[1].double).toBe(4);
    expect(steps[4].cached).toBe(true);
  });

  it("re-collects dependencies on every run: the branch that was not read is no longer subscribed", () => {
    const real = runInVue(SNIPPET);
    const hide = SETUP.length + 1;
    expect(real.events[hide]).toEqual(["trigger effect", "run effect", "track effect show", "log off"]);
    // With show false, writing count reaches nobody: no trigger, no run, no recompute.
    expect(real.events[hide + 1]).toEqual([]);
    const last = STEPS.at(-1);
    expect(last?.events).toEqual([]);
    expect(last?.links).toEqual({ "double:count": "off", "effect:show": "on", "effect:double": "off" });
    expect(last && subscribersOf("count", last)).toEqual([]);
    // The computed was not told, so it is not marked dirty: it only holds an old value.
    expect(last?.dirty).toBe(false);
    expect(last?.double).toBe(4);
    expect(last?.refs.count).toBe(3);
  });

  it("keeps links as pending during a run, exactly as many as the library does", () => {
    const real = runInVue(SNIPPET);
    const pending = STEPS.filter((step) => step.kind === "run").map(
      (step) => Object.entries(step.links).filter(([id, level]) => id.startsWith("effect:") && level === "pending").length,
    );
    expect(pending).toEqual(real.pendingAtRunStart);
    expect(pending).toEqual([0, 2, 2]);
  });

  it("runs the getter as many times as the library does", () => {
    const real = runInVue(SNIPPET);
    const count = (events: string[][]) => events.flat().filter((event) => event === "compute double").length;
    expect(STEPS.filter((step) => step.kind === "compute").length).toBe(count(real.events));
    expect(count(real.events)).toBe(2);
  });

  it("matches the library on other sequences of writes", () => {
    const sequences: Write[][] = [
      // Coming back to the branch: the computed missed a change and recomputes when read.
      [...WRITES, { ref: "show", value: true }],
      // Coming back with nothing changed: the cached value is reused.
      [{ ref: "show", value: false }, { ref: "show", value: true }],
      // Writing the same value notifies nobody.
      [{ ref: "count", value: 1 }, { ref: "show", value: true }],
      [{ ref: "count", value: 2 }, { ref: "count", value: 5 }, { ref: "show", value: false }, { ref: "count", value: 6 }, { ref: "show", value: true }, { ref: "count", value: 7 }],
      [{ ref: "show", value: false }, { ref: "count", value: 9 }, { ref: "count", value: 1 }, { ref: "show", value: true }],
    ];
    for (const writes of sequences) {
      const { steps, model, real } = compare(writes);
      expect(model).toEqual(real.events);
      expect(steps.at(-1)?.output).toEqual(real.output);
    }
  });

  it("is deterministic", () => {
    expect(simulate()).toEqual(STEPS);
  });
});
