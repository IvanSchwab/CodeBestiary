/**
 * Pure model of Vue's reactivity for one fixed script. No DOM, no geometry.
 * Everything the figure shows (motion, readout, code panel, console) is
 * derived from the steps this module produces, and model.test.ts checks them
 * against @vue/reactivity running the same script.
 *
 * The rules are those of Vue 3.5:
 * - reading a source while a subscriber runs links the two (track);
 * - writing a ref notifies its subscribers (trigger). A computed is only
 *   marked dirty and passes the notice on; it does not recompute;
 * - a notified effect first asks its computed sources whether they really
 *   changed, which is the moment a dirty computed recomputes;
 * - a subscriber keeps its links during a run and, at the end, drops the
 *   ones it did not read again. A computed nobody subscribes to lets go of
 *   its own sources as well.
 */

export type RefId = "count" | "show";
export type SubId = "double" | "effect";
export type SourceId = RefId | "double";
export type LinkId = "double:count" | "effect:show" | "effect:double";
export const LINKS: LinkId[] = ["double:count", "effect:show", "effect:double"];

/** on: subscribed. pending: subscribed, to be confirmed by this run. off: not subscribed. */
export type Level = "off" | "pending" | "on";

export type Write = { ref: "count"; value: number } | { ref: "show"; value: boolean };

/** The assignments the figure walks through, after the setup. */
export const WRITES: Write[] = [
  { ref: "count", value: 2 },
  { ref: "show", value: false },
  { ref: "count", value: 3 },
];

export const SETUP = [
  "const count = ref(1);",
  "const show = ref(true);",
  "const double = computed(() => count.value * 2);",
  'effect(() => console.log(show.value ? double.value : "off"));',
] as const;

export const lineOf = (write: Write) => `${write.ref}.value = ${write.value};`;

/** The script, one statement per line. */
export const SNIPPET: string[] = [...SETUP, ...WRITES.map(lineOf)];
/** Line where the effect is created and runs for the first time. */
export const EFFECT_LINE = SETUP.length - 1;

export type StepKind = "idle" | "write" | "run" | "read" | "compute" | "log" | "end";

export interface Step {
  kind: StepKind;
  /** Active line of the snippet, if any. */
  line: number | null;
  /** The code that is running: the effect or the computed's getter. */
  running: SubId | null;
  /** write: the ref written. read: the source read. compute: "double". */
  source: SourceId | null;
  /** write: who was notified, in order. */
  notified: SubId[];
  /** read of double: true when its cached value was returned without recomputing. */
  cached: boolean;
  /** compute: who asked. "check" is a notified effect asking before it runs. */
  asked: "read" | "check" | null;
  /** end: links dropped because the run did not read them again. */
  released: LinkId[];
  refs: { count: number; show: boolean };
  /** Cached value of the computed; null until it runs for the first time. */
  double: number | null;
  /** The computed's dirty flag. */
  dirty: boolean;
  links: Record<LinkId, Level>;
  /** Console output so far. */
  output: string[];
  /** What this step did, in the words the test compares with the real library. */
  events: string[];
}

/**
 * Runs the setup and then the given writes. Every observable moment becomes
 * a step.
 */
export function simulate(writes: Write[] = WRITES): Step[] {
  const refs = { count: 1, show: true };
  const version = { count: 0, show: 0, double: 0 };
  /** Versions each subscriber saw when it last read its sources. */
  const seen = { doubleCount: -1, effectShow: -1, effectDouble: -1 };
  const links: Record<LinkId, Level> = { "double:count": "off", "effect:show": "off", "effect:double": "off" };
  const output: string[] = [];
  const steps: Step[] = [];
  let cache: number | null = null;
  let dirty = true;
  let line: number | null = null;
  let events: string[] = [];

  type Extra = Partial<Pick<Step, "running" | "source" | "notified" | "cached" | "asked" | "released">>;
  const snapshot = (kind: StepKind, extra: Extra = {}) => {
    steps.push({
      kind,
      line,
      running: null,
      source: null,
      notified: [],
      cached: false,
      asked: null,
      released: [],
      ...extra,
      refs: { ...refs },
      double: cache,
      dirty,
      links: { ...links },
      output: [...output],
      events,
    });
    events = [];
  };

  /** The computed is stale when it was told so, or when its source moved on while it was not listening. */
  const isStale = () => dirty || seen.doubleCount !== version.count;

  /** Recomputes the computed. Returns true when its value changed. */
  const compute = (asked: "read" | "check") => {
    events.push("compute double");
    // The getter reads count: track. The link only notifies while someone subscribes to the computed.
    events.push("track double count");
    links["double:count"] = links["effect:double"] === "off" ? "off" : "on";
    seen.doubleCount = version.count;
    const value = refs.count * 2;
    const changed = value !== cache;
    if (changed) version.double++;
    cache = value;
    dirty = false;
    snapshot("compute", { running: "double", source: "double", asked });
    return changed;
  };

  const runEffect = () => {
    events.push("run effect");
    for (const id of ["effect:show", "effect:double"] as const) if (links[id] === "on") links[id] = "pending";
    snapshot("run", { running: "effect" });

    events.push("track effect show");
    links["effect:show"] = "on";
    seen.effectShow = version.show;
    snapshot("read", { running: "effect", source: "show" });

    let text = "off";
    if (refs.show) {
      events.push("track effect double");
      links["effect:double"] = "on";
      const stale = isStale();
      snapshot("read", { running: "effect", source: "double", cached: !stale });
      if (stale) compute("read");
      seen.effectDouble = version.double;
      text = String(cache);
    }

    events.push(`log ${text}`);
    output.push(text);
    snapshot("log", { running: "effect" });

    const released: LinkId[] = [];
    if (links["effect:double"] === "pending") {
      links["effect:double"] = "off";
      released.push("effect:double");
      // Nobody subscribes to the computed any more, so it stops listening too.
      if (links["double:count"] !== "off") {
        links["double:count"] = "off";
        released.push("double:count");
      }
    }
    if (released.length) snapshot("end", { running: "effect", released });
  };

  const write = (change: Write) => {
    if (Object.is(refs[change.ref], change.value)) return;
    if (change.ref === "count") refs.count = change.value;
    else refs.show = change.value;
    version[change.ref]++;

    const notified: SubId[] = [];
    if (change.ref === "count" && links["double:count"] !== "off") {
      dirty = true;
      notified.push("double");
      events.push("trigger double");
      if (links["effect:double"] !== "off") notified.push("effect");
    }
    if (change.ref === "show" && links["effect:show"] !== "off") notified.push("effect");
    if (notified.includes("effect")) events.push("trigger effect");
    snapshot("write", { source: change.ref, notified });

    if (!notified.includes("effect")) return;
    // Before running again, the effect checks that a source really changed.
    let changed = seen.effectShow !== version.show;
    if (!changed && links["effect:double"] !== "off") {
      if (isStale()) compute("check");
      changed = seen.effectDouble !== version.double;
    }
    if (changed) runEffect();
  };

  snapshot("idle");
  line = EFFECT_LINE;
  runEffect();
  writes.forEach((change, index) => {
    line = SETUP.length + index;
    write(change);
  });

  return steps;
}

export const STEPS = simulate();
export const LAST_STEP = STEPS.length - 1;

/** Who subscribes to a source in a step (pending links still count). */
export function subscribersOf(source: SourceId, step: Step): SubId[] {
  return LINKS.filter((id) => id.endsWith(`:${source}`) && step.links[id] !== "off").map((id) => id.split(":")[0] as SubId);
}

/** The events of a run of steps, grouped by the snippet line that caused them. */
export function eventsByLine(steps: Step[], lines: number): string[][] {
  const groups: string[][] = Array.from({ length: lines }, () => []);
  for (const step of steps) if (step.line !== null) groups[step.line].push(...step.events);
  return groups;
}
