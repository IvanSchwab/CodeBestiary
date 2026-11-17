import { cylinder, type SolidPaths } from "../../iso/iso-kit";
import { LINKS, STEPS, type Level, type LinkId, type Step } from "./model";
import { FLAG, FLAG_COLLAR_H, FLAG_LIFT, DOUBLE_TOP, HIGH_TOP, P, PINS, PIN_LIFT, PIN_PENDING } from "./view";

/**
 * The choreography. poseAt(u) is a pure function of the timeline position u,
 * where u = k is step k of the model at rest and the values in between are
 * the motion from one step to the next.
 */

export type Part = "count" | "show" | "double" | "effect";

export interface Pose {
  /** Values the cursors point at (fractional while they move). */
  count: number;
  /** 0 = true, 1 = false. */
  show: number;
  double: number;
  /** 0 = flag down (clean), 1 = up (dirty). */
  flag: number;
  /** 0 = pin down (subscribed), 1 = pulled out. */
  pins: Record<LinkId, number>;
  /** How far each moving bar is pushed, 0 to 1 of SHOVE. */
  push: { count: number; show: number; slider: number; tongueA: number; tongueB: number };
  /** -1 = on the bell, 0 = rest, 1 = cocked by a notice. */
  striker: number;
  lit: Part | null;
}

/** Seconds each kind of step takes to play. */
const SECONDS: Record<Step["kind"], number> = { idle: 1, write: 2.8, run: 1.7, read: 1.5, compute: 2, log: 1.3, end: 1.8 };
export const secondsInto = (step: number) => SECONDS[STEPS[Math.min(Math.max(step, 1), STEPS.length - 1)].kind];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** Smooth 0 → 1 while t goes from a to b. */
const ramp = (t: number, a: number, b: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const LIFT: Record<Level, number> = { on: 0, pending: PIN_PENDING, off: 1 };

/** A notified effect cocks its striker; it stays cocked until the effect runs. */
const COCKED: number[] = (() => {
  const out: number[] = [];
  let cocked = 0;
  for (const step of STEPS) {
    if (step.kind === "write" && step.notified.includes("effect")) cocked = 1;
    else if (step.kind === "run") cocked = 0;
    out.push(cocked);
  }
  return out;
})();

function litOf(step: Step): Part | null {
  if (step.kind === "write") return step.source === "show" ? "show" : "count";
  if (step.kind === "compute") return "double";
  if (step.running === "effect") return "effect";
  return null;
}

const valueOf = (step: Step) => ({
  count: step.refs.count,
  show: step.refs.show ? 0 : 1,
  double: step.double ?? 0,
  flag: step.dirty ? 1 : 0,
});

export function poseAt(u: number): Pose {
  const last = STEPS.length - 1;
  const at = Math.min(Math.max(u, 0), last);
  const index = Math.min(Math.floor(at), last - 1);
  const t = at - index;
  const before = STEPS[index];
  const after = STEPS[index + 1];
  const a = valueOf(before);
  const b = valueOf(after);

  const pins = {} as Record<LinkId, number>;
  const pinT = after.kind === "end" ? ramp(t, 0.2, 0.8) : ramp(t, 0.15, 0.6);
  for (const id of LINKS) pins[id] = mix(LIFT[before.links[id]], LIFT[after.links[id]], pinT);

  const push = { count: 0, show: 0, slider: 0, tongueA: 0, tongueB: 0 };
  let flagT = ramp(t, 0.4, 0.8);
  let striker = COCKED[index];
  if (after.kind === "write") {
    // In, hold while the notice lands, out again.
    const stroke = ramp(t, 0.05, 0.3) - ramp(t, 0.62, 0.92);
    if (after.source === "count") {
      push.count = stroke;
      if (before.links["double:count"] !== "off") {
        push.slider = stroke;
        if (before.links["effect:double"] !== "off") push.tongueA = stroke;
      }
    } else {
      push.show = stroke;
      if (before.links["effect:show"] !== "off") push.tongueB = stroke;
    }
    flagT = ramp(t, 0.22, 0.4);
    striker = mix(COCKED[index], COCKED[index + 1], ramp(t, 0.28, 0.42));
  } else if (after.kind === "run") {
    // Release, ring, back to rest.
    striker = COCKED[index] * (1 - ramp(t, 0, 0.14)) - (ramp(t, 0.1, 0.24) - ramp(t, 0.34, 0.8));
  }

  return {
    count: mix(a.count, b.count, ramp(t, 0.08, 0.32)),
    show: mix(a.show, b.show, ramp(t, 0.08, 0.32)),
    double: mix(a.double, b.double, ramp(t, 0.2, 0.75)),
    flag: mix(a.flag, b.flag, flagT),
    pins,
    push,
    striker,
    lit: t < 0.02 ? litOf(before) : litOf(after),
  };
}

/* Parts whose shape changes, rebuilt from the pose. */

const STEM_R = 1.3;

/** The visible stem of a pin, from the rod's top up to its lifted head. Null when it is down. */
export function stemOf(id: LinkId, lift: number): SolidPaths | null {
  const h = lift * PIN_LIFT;
  if (h < 0.05) return null;
  const [x, y] = PINS[id];
  return cylinder(x, y, STEM_R, HIGH_TOP, h, P, 16);
}

/** The flag's stem, between its collar and the raised disc. */
export function flagStemOf(flag: number): SolidPaths | null {
  const h = flag * FLAG_LIFT;
  if (h < 0.05) return null;
  return cylinder(FLAG[0], FLAG[1], 1.4, DOUBLE_TOP + FLAG_COLLAR_H, h, P, 16);
}
