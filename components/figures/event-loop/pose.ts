import { cylinder, depthOf, extrude, lineOnTop, type Plane, type Point3, type SolidPaths } from "../../iso/iso-kit";
import { STEPS, TOKENS, type Step, type TokenId, PROGRAM } from "./model";
import {
  ANVIL,
  ARM_R,
  ARM_TAIL,
  COLUMN_R,
  COLUMN_TOP,
  DECK,
  DIAL,
  DIAL_FROM,
  DIAL_MARKS,
  DIAL_SWEEP,
  DIAL_TOP,
  HUB,
  LIFT,
  MICRO_AT,
  MICRO_PICK,
  MICRO_STAGE,
  P,
  PARK_AT,
  STACK_AT,
  TASK_AT,
  TASK_PICK,
  TASK_STAGE,
  TRAY_SLOTS,
  onArm,
} from "./view";

/**
 * The choreography. poseAt(u) is a pure function of the timeline position u,
 * where u = k is step k of the model at rest and the values in between are
 * the motion from one step to the next. Playing backwards is the same
 * function read the other way.
 */

export interface Pose {
  /** Arm angle in degrees. It only ever grows: the loop turns one way. */
  angle: number;
  /** 0 = arm at carrying height, 1 = down on a token. */
  drop: number;
  /** 0 = press head up, 1 = ram resting on the running token (one call on the stack). */
  press: number;
  /** Lines printed so far (fractional while the needle moves). */
  count: number;
  tokens: Record<TokenId, Point3>;
  /** The unit that is running or being carried. */
  lit: TokenId | null;
}

/** Seconds each kind of step takes to play. */
const SECONDS: Record<Step["kind"], number> = { idle: 1, take: 4.2, call: 1.7, return: 1.7 };
export const secondsInto = (step: number) => SECONDS[STEPS[Math.min(Math.max(step, 1), STEPS.length - 1)].kind];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** Smooth 0 → 1 while t goes from a to b. */
const ramp = (t: number, a: number, b: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixPlane = (a: Plane, b: Plane, t: number): Plane => [mix(a[0], b[0], t), mix(a[1], b[1], t)];

const stageOf = (token: TokenId) => (PROGRAM[token].lane === "task" ? TASK_STAGE : MICRO_STAGE);
const pickOf = (token: TokenId) => (PROGRAM[token].lane === "task" ? TASK_PICK : MICRO_PICK);

/** Where a token rests in a given step. */
function restOf(token: TokenId, step: Step): Plane {
  if (step.stack[0] === token) return ANVIL;
  const finished = step.done.indexOf(token);
  if (finished >= 0) return TRAY_SLOTS[finished];
  if (step.tasks.includes(token) || step.microtasks.includes(token)) return pickOf(token);
  return stageOf(token);
}

/** The next angle at or after `from` that points at `target` (degrees, mod 360). */
const nextTurnTo = (from: number, target: number) => from + ((((target - from) % 360) + 360) % 360);

interface Take {
  pick: number;
  place: number;
  park: number;
}

/** Arm angle at rest in every step, and the three stops of every "take". */
const ARM: { rest: number[]; takes: (Take | null)[] } = (() => {
  const rest: number[] = [];
  const takes: (Take | null)[] = [];
  let angle = PARK_AT;
  for (const step of STEPS) {
    if (step.kind === "take") {
      const pick = nextTurnTo(angle, step.from === "task" ? TASK_AT : MICRO_AT);
      const place = nextTurnTo(pick, STACK_AT);
      const park = nextTurnTo(place, PARK_AT);
      takes.push({ pick, place, park });
      angle = park;
    } else takes.push(null);
    rest.push(angle);
  }
  return { rest, takes };
})();

/* Timing of a "take", as fractions of the step. */
const T = { reach: 0.3, down: 0.38, up: 0.46, carry: 0.74, lower: 0.82, clear: 0.9 };

export function poseAt(u: number): Pose {
  const last = STEPS.length - 1;
  const at = Math.min(Math.max(u, 0), last);
  const index = Math.min(Math.floor(at), last - 1);
  const t = at - index;
  const before = STEPS[index];
  const after = STEPS[index + 1];

  let angle = ARM.rest[index];
  let drop = 0;
  let lit: TokenId | null = t < 0.5 ? before.stack[0] as TokenId ?? null : (after.stack[0] as TokenId) ?? null;
  const tokens = {} as Record<TokenId, Point3>;
  let slide = t;

  const pressBefore = before.kind === "call" ? 1 : 0;
  const pressAfter = after.kind === "call" ? 1 : 0;
  // The head lifts first, the work happens, then the head lands again.
  const press = pressBefore * (1 - ramp(t, 0, 0.3)) + pressAfter * ramp(t, 0.68, 1);
  const count = mix(before.output.length, after.output.length, ramp(t, 0.86, 1));

  const take = ARM.takes[index + 1];
  if (after.kind === "take" && take) {
    const token = after.token as TokenId;
    angle =
      ARM.rest[index] +
      (take.pick - ARM.rest[index]) * ramp(t, 0, T.reach) +
      (take.place - take.pick) * ramp(t, T.up, T.carry) +
      (take.park - take.place) * ramp(t, T.clear, 1);
    drop = ramp(t, T.reach, T.down) - ramp(t, T.down, T.up) + ramp(t, T.carry, T.lower) - ramp(t, T.lower, T.clear);
    const held = t >= T.down && t < T.lower;
    lit = t >= T.down ? token : null;
    for (const id of TOKENS) {
      const rest = restOf(id, t < T.down ? before : after);
      tokens[id] = [rest[0], rest[1], DECK];
    }
    if (held) {
      const tip = onArm(angle);
      tokens[token] = [tip[0], tip[1], DECK + LIFT * (1 - drop)];
    }
    return { angle, drop, press, count, tokens, lit };
  }

  if (after.kind === "call") slide = ramp(t, 0.3, 0.78);
  if (after.kind === "return") {
    slide = ramp(t, 0.3, 1);
    lit = t < 0.3 ? (before.stack[0] as TokenId) : null;
  }
  if (after.kind === "call") lit = after.token;

  for (const id of TOKENS) {
    const [x, y] = mixPlane(restOf(id, before), restOf(id, after), slide);
    tokens[id] = [x, y, DECK];
  }
  return { angle, drop, press, count, tokens, lit };
}

/* Parts whose shape changes, rebuilt from the pose. */

const RAD = Math.PI / 180;
export const BEAM_Z = 30;
export const BEAM_H = 4;
const BEAM_HALF = 2.6;

/** The arm's beam at an angle: a bar from the counterweight to the head. */
export function beamOf(angle: number, drop: number): SolidPaths {
  const c = Math.cos(angle * RAD);
  const s = Math.sin(angle * RAD);
  const corner = (along: number, across: number): Plane => [
    HUB[0] + along * c - across * s,
    HUB[1] + along * s + across * c,
  ];
  const ring = [corner(-ARM_TAIL, -BEAM_HALF), corner(ARM_R, -BEAM_HALF), corner(ARM_R, BEAM_HALF), corner(-ARM_TAIL, BEAM_HALF)];
  return extrude(ring, BEAM_Z - LIFT * drop, BEAM_H, P, { convex: true, bevel: 0.4 });
}

export const COLLAR_Z = BEAM_Z - 1;
export const COLLAR_H = BEAM_H + 2;

/** The column above the arm's collar: longer when the arm is down. */
export function columnAbove(drop: number): SolidPaths {
  const from = COLLAR_Z + COLLAR_H - LIFT * drop;
  return cylinder(HUB[0], HUB[1], COLUMN_R, from, COLUMN_TOP - from, P, 24);
}

const NEEDLE = 10.4;
const NEEDLE_TAIL = 2.6;

/** The counter's needle for a number of printed lines. */
export function needleOf(count: number): string {
  const angle = (DIAL_FROM + (count / DIAL_MARKS) * DIAL_SWEEP) * RAD;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return lineOnTop(
    [DIAL[0] - NEEDLE_TAIL * c, DIAL[1] - NEEDLE_TAIL * s],
    [DIAL[0] + NEEDLE * c, DIAL[1] + NEEDLE * s],
    DIAL_TOP + 0.2,
    P,
  );
}

/** Tokens far enough behind the hub are painted before it; the rest after. */
export const isBehindHub = ([x, y]: Point3) => x + y < -60;

export const depth = (point: Point3) => depthOf(point, P);
