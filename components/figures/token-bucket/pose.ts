import {
  cylinder,
  extrude,
  insetPlan,
  onTop,
  ring,
  roundedPlan,
  segment,
  slabOf,
  type Plan,
  type Plane,
  type SolidPaths,
} from "../../iso/iso-kit";
import { CAPACITY, REFILL_MS, STEPS, type Step } from "./model";
import {
  BED_TOP,
  CARRIER,
  CARRIER_H,
  CLOCK,
  CLOCK_R,
  DECK,
  DECK_TOP,
  FLOOR,
  GATE,
  GATE_UP,
  HEAD,
  HOUSING,
  INLET_FACE,
  MOUTH,
  P,
  PLATE_Z,
  PORT,
  PUSH_IN,
  PUSH_OUT,
  RAIL_TOP,
  SPILL,
  TOKEN_H,
  TOKEN_R,
  TRACK_Y,
  TRAY_H,
  X_GONE,
  X_HIDDEN,
  X_PASSED,
  X_STATION,
  slotZ,
} from "./view";

/**
 * The choreography. poseAt(u) is a pure function of the timeline position u,
 * where u = k is step k of the model at rest and the values in between are
 * the motion from one step to the next. Playing backwards is the same
 * function read the other way.
 */

/** The part of a token that shows: a port or the plate may hide the rest. */
export interface TokenPose {
  x: number;
  y: number;
  z0: number;
  z1: number;
  /** False while the true top is hidden, so the ring on it is not drawn. */
  whole: boolean;
  lit: boolean;
}

export interface CarrierPose {
  /** Centre along the track. */
  x: number;
  /** 0 = on the rails, 1 = gone down the trap. */
  sink: number;
  lit: boolean;
  /** The token that pays for it, falling onto it or riding on it. */
  token: TokenPose | null;
}

export interface Pose {
  /** Model time in milliseconds. The clock and the lift read it. */
  time: number;
  /** Fraction of the refill period gone since the last tick, 0 to 1. */
  phase: number;
  /** Tokens in the tube, bottom first. */
  stack: (TokenPose | null)[];
  /** The token on its way from the port to the tube. */
  feed: TokenPose | null;
  /** A discarded token going into the tray. */
  spill: TokenPose | null;
  /** The request that is being decided, and the one before it on its way out. */
  arriving: CarrierPose | null;
  leaving: CarrierPose | null;
  /** How far the pusher is out. */
  push: number;
  /** 0 = gate up (shut), 1 = down. */
  gate: number;
  /** 0 = release latch home, 1 = pulled. */
  latch: number;
}

/** Seconds each kind of step takes to play. */
const SECONDS: Record<Step["kind"], number> = { idle: 1, refill: 2.6, request: 3.1 };
export const secondsInto = (step: number) => SECONDS[STEPS[Math.min(Math.max(step, 1), STEPS.length - 1)].kind];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** Smooth 0 → 1 while t goes from a to b. */
const ramp = (t: number, a: number, b: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
/** A fall under gravity: slow start, no slowing down. */
const fall = (t: number, a: number, b: number) => clamp((t - a) / (b - a)) ** 2;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const EPS = 0.05;
const token = (at: Plane, z0: number, z1: number, whole: boolean, lit = false): TokenPose | null =>
  z1 - z0 > EPS ? { x: at[0], y: at[1], z0, z1, whole, lit } : null;

/* Timing, as fractions of a step. */
const T = {
  /** The clock runs to the event's time, and whatever was leaving is gone. */
  clock: 0.35,
  clear: 0.3,
  /* A refill. */
  pushFrom: 0.38,
  pushTo: 0.6,
  dropTo: 0.8,
  spillAt: 0.78,
  /* A request. */
  arriveFrom: 0.06,
  arriveTo: 0.45,
  release: 0.47,
  land: 0.62,
  settle: 0.76,
  leave: 0.78,
};

export function poseAt(u: number): Pose {
  const last = STEPS.length - 1;
  const at = Math.min(Math.max(u, 0), last);
  const index = Math.min(Math.floor(at), last - 1);
  const t = at - index;
  const before = STEPS[index];
  const after = STEPS[index + 1];

  const time = mix(before.t, after.t, ramp(t, 0, T.clock));
  const sinceTick = time - Math.floor(before.t / REFILL_MS) * REFILL_MS;
  const phase = clamp(sinceTick / REFILL_MS);

  const stack: (TokenPose | null)[] = Array.from({ length: CAPACITY }, (_, slot) =>
    slot < before.tokens ? token(MOUTH, slotZ(slot), slotZ(slot) + TOKEN_H, true) : null,
  );
  // The token that was just added stays lit until the next thing happens.
  if (before.outcome === "added" && t < T.clear) stack[before.tokens - 1]!.lit = true;

  let feed: TokenPose | null = null;
  let spill: TokenPose | null = null;
  let arriving: CarrierPose | null = null;
  let leaving: CarrierPose | null = null;
  let push = 0;
  let gate = 0;
  let latch = 0;

  /* What the step before left behind. */
  if (before.outcome === "discarded") {
    const bottom = mix(TRAY_H - TOKEN_H / 2, TRAY_H - TOKEN_H, ramp(t, 0, 0.16));
    spill = token(SPILL, TRAY_H, bottom + TOKEN_H, true, true);
  }
  if (before.outcome === "passed") {
    gate = 1 - ramp(t, 0.1, 0.25);
    if (t < T.clear) {
      leaving = {
        x: mix(X_PASSED, X_GONE, ramp(t, 0, T.clear)),
        sink: 0,
        lit: true,
        token: token([0, TRACK_Y], DECK, DECK + TOKEN_H, true),
      };
    }
  }
  if (before.outcome === "rejected") {
    const sink = 0.5 + 0.5 * ramp(t, 0, 0.18);
    if (sink < 1 - EPS / CARRIER_H) leaving = { x: X_STATION, sink, lit: true, token: null };
  }

  /* The lift raises the next token as the clock runs. */
  const rising = token(PORT, DECK_TOP, DECK_TOP + TOKEN_H * phase, true);

  if (after.kind === "refill") {
    const kept = after.outcome === "added";
    push = kept
      ? PUSH_IN * (ramp(t, T.pushFrom, T.pushTo) - ramp(t, 0.64, 0.92))
      : PUSH_IN * ramp(t, T.pushFrom, T.pushTo) + (PUSH_OUT - PUSH_IN) * ramp(t, T.pushTo, T.spillAt) - PUSH_OUT * ramp(t, 0.82, 1);
    if (t < T.pushFrom) feed = rising;
    else if (kept) {
      if (t < T.pushTo) feed = token([PORT[0], PORT[1] + push], DECK_TOP, DECK_TOP + TOKEN_H, true, true);
      else {
        const bottom = mix(DECK_TOP, slotZ(before.tokens), fall(t, T.pushTo, T.dropTo));
        stack[before.tokens] = token(MOUTH, bottom, bottom + TOKEN_H, true, true);
      }
    } else if (t < T.spillAt) feed = token([PORT[0], PORT[1] + push], DECK_TOP, DECK_TOP + TOKEN_H, true, true);
    else {
      // Over the edge and into the tray's port, where it rests half in.
      const bottom = mix(DECK_TOP, TRAY_H - TOKEN_H / 2, fall(t, T.spillAt, 1));
      spill = token(SPILL, Math.max(bottom, TRAY_H), bottom + TOKEN_H, true, true);
    }
  } else {
    feed = rising;
  }

  if (after.kind === "request") {
    const passes = after.outcome === "passed";
    latch = ramp(t, 0.43, 0.5) - ramp(t, 0.5, 0.6);
    arriving = {
      x: mix(X_HIDDEN, X_STATION, ramp(t, T.arriveFrom, T.arriveTo)),
      sink: 0,
      lit: t >= T.clear,
      token: null,
    };
    if (passes) {
      // The bottom token goes down through the plate onto the carrier.
      const bottom = mix(FLOOR, DECK, fall(t, T.release, T.land));
      stack[0] = token(MOUTH, Math.max(bottom, FLOOR), bottom + TOKEN_H, true);
      if (bottom < PLATE_Z - EPS) {
        arriving.token = token([0, TRACK_Y], bottom, Math.min(bottom + TOKEN_H, PLATE_Z), bottom + TOKEN_H <= PLATE_Z);
      }
      // Then the rest of the stack comes down by one.
      const settle = ramp(t, T.land, T.settle);
      for (let slot = 1; slot < before.tokens; slot++) {
        const z = slotZ(slot) - TOKEN_H * settle;
        stack[slot] = token(MOUTH, z, z + TOKEN_H, true);
      }
      gate += ramp(t, 0.6, 0.74);
      arriving.x += (X_PASSED - X_STATION) * ramp(t, T.leave, 1);
    } else {
      arriving.sink = 0.5 * ramp(t, 0.66, 0.9);
    }
  }

  return { time, phase, stack, feed, spill, arriving, leaving, push, gate: clamp(gate), latch };
}

/* Parts whose shape changes, rebuilt from the pose. */

/** The visible part of a token and, when its top shows, the ring on it. */
export function tokenOf(pose: TokenPose): { solid: SolidPaths; ring: string } {
  return {
    solid: cylinder(pose.x, pose.y, TOKEN_R, pose.z0, pose.z1 - pose.z0, P, 28, 0.5),
    ring: pose.whole ? ring(pose.x, pose.y, 4.3, pose.z1, P, 24) : "",
  };
}

/** Keeps the part of a convex outline with x >= min. */
function fromX(outline: Plane[], min: number): Plane[] {
  const out: Plane[] = [];
  outline.forEach((a, index) => {
    const b = outline[(index + 1) % outline.length];
    const inA = a[0] >= min;
    const inB = b[0] >= min;
    if (inA) out.push(a);
    if (inA !== inB) out.push([min, a[1] + ((min - a[0]) / (b[0] - a[0])) * (b[1] - a[1])]);
  });
  return out;
}

const HALF = CARRIER / 2;
const CARRIER_PLAN: Plan = { x: -HALF, y: TRACK_Y - HALF, w: CARRIER, d: CARRIER, r: 2.2 };
const CARRIER_SEAT = insetPlan(CARRIER_PLAN, 3.2);

/**
 * A carrier where it is: cut at the inlet's face while it comes out of the
 * hood, and lower as it goes down the trap. Null while nothing of it shows.
 */
export function carrierOf(pose: CarrierPose): { solid: SolidPaths; seat: string } | null {
  const height = CARRIER_H * (1 - pose.sink);
  if (height <= EPS) return null;
  const place = (plan: Plan) => fromX(roundedPlan({ ...plan, x: plan.x + pose.x }, 3), INLET_FACE);
  const body = place(CARRIER_PLAN);
  if (body.length < 3 || Math.max(...body.map(([x]) => x)) - INLET_FACE < 0.3) return null;
  const seat = place(CARRIER_SEAT);
  return {
    solid: extrude(body, RAIL_TOP, height, P, { convex: true, bevel: 0.5 }),
    seat: seat.length >= 3 ? onTop(seat, RAIL_TOP + height, P, true) : "",
  };
}

export const ROD_Z = DECK_TOP + 1.6;
const ROD_FROM = HOUSING.y + HOUSING.d;

/** The pusher's rod, from the housing to the back of the head. */
export const rodOf = (push: number): SolidPaths =>
  slabOf({ x: -1.5, y: ROD_FROM, w: 3, d: HEAD.y + push - ROD_FROM, r: 0 }, ROD_Z, 2.8, P, 2);

/** The gate, as much of it as stands above the bed. Null when it is all the way down. */
export const gateOf = (gate: number): SolidPaths | null =>
  gate > 0.985 ? null : slabOf(GATE, BED_TOP, GATE_UP * (1 - gate), P, 2, 0.3);

export const HAND = CLOCK_R - 3.2;

/** The clock's hand: straight up at each tick, clockwise as the viewer sees it. */
export function handOf(phase: number): string {
  const angle = phase * Math.PI * 2;
  const [x, y, z] = CLOCK;
  return segment([x, y, z], [x, y - HAND * Math.sin(angle), z + HAND * Math.cos(angle)], P);
}
