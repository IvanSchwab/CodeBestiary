import { lineOnTop, slabOf, type Plan, type Plane, type Point3, type SolidPaths } from "../../iso/iso-kit";
import { ACQUIRE_TIMEOUT, CLIENTS, MAX, STEPS, countsOf, placeOf, type Client, type Step, type StepKind } from "./model";
import {
  BAY_X,
  COUNTER_Y,
  DECK,
  DIAL_FROM,
  DIAL_SWEEP,
  DIAL_TOP,
  DOCK_Y,
  EJECTOR,
  GONE_X,
  HIDDEN_Y,
  LANE,
  LANE_Y,
  LOAD,
  OUTSIDE_X,
  P,
  PAN_H,
  PAN_SEAT,
  PUSH,
  PUSH_GAP,
  PUSHER,
  QUEUE_X,
  TIMER,
} from "./view";

/**
 * The choreography. poseAt(u) is a pure function of the timeline position u,
 * where u = k is step k of the model at rest and the values in between are
 * the motion from one step to the next. Playing backwards is the same
 * function read the other way.
 */

export interface Pose {
  /** Where each carriage is along its rails (y). */
  carriages: number[];
  /** 0 = port shut, 1 = shutter fully lifted. */
  shutters: number[];
  /** Where each client is. Null while it is inside a housing. */
  pucks: Record<Client, Point3 | null>;
  /** How far the ejector has extended. */
  push: number;
  /** Seconds on the timer: how long the oldest waiter has waited. */
  wait: number;
  /** Busy connections on the load gauge (fractional while the needle moves). */
  busy: number;
  /** The client the step is about. */
  lit: Client | null;
}

/** Seconds each kind of step takes to play. */
const SECONDS: Record<StepKind, number> = {
  start: 1,
  created: 5.4,
  reused: 4,
  queued: 2.6,
  idle: 4.2,
  handed: 6.4,
  timeout: 4.2,
  end: 1.4,
};
export const secondsInto = (step: number) => SECONDS[STEPS[Math.min(Math.max(step, 1), STEPS.length - 1)].kind];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** Smooth 0 → 1 while t goes from a to b. */
const ramp = (t: number, a: number, b: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** A path through timed stops: [time, place]. Eased between each pair. */
type Stop = [number, Plane];
function along(t: number, stops: Stop[]): Plane {
  if (t <= stops[0][0]) return stops[0][1];
  for (let index = 1; index < stops.length; index++) {
    const [t1, b] = stops[index];
    if (t > t1) continue;
    const [t0, a] = stops[index - 1];
    const s = ramp(t, t0, t1);
    return [mix(a[0], b[0], s), mix(a[1], b[1], s)];
  }
  return stops[stops.length - 1][1];
}

const OUTSIDE: Plane = [OUTSIDE_X, LANE_Y];
const GONE: Plane = [GONE_X, LANE_Y];
const front = (bay: number): Plane => [BAY_X[bay], LANE_Y];
const counter = (bay: number): Plane => [BAY_X[bay], COUNTER_Y];
const dock = (bay: number): Plane => [BAY_X[bay], DOCK_Y];
const slot = (position: number): Plane => [QUEUE_X[Math.min(position, QUEUE_X.length) - 1], LANE_Y];

/** Where a client rests in a step. */
function restOf(client: Client, step: Step): Plane {
  const place = placeOf(client, step);
  if (place.where === "holding") return dock(place.conn);
  if (place.where === "waiting") return slot(place.position);
  if (place.where === "served") return GONE;
  if (place.where === "failed") return PAN_SEAT;
  return OUTSIDE;
}

const carriageRest = (bay: number, step: Step) =>
  bay >= step.holders.length ? HIDDEN_Y : step.holders[bay] === null ? COUNTER_Y : DOCK_Y;

/** Height of a puck: on the deck, or down in the reject pan once it is pushed off the lane. */
const heightAt = (y: number) => DECK - (DECK - PAN_H) * ramp(y, LANE.y + LANE.d, LANE.y + LANE.d + 9);

const hidden = ([x]: Plane) => x <= OUTSIDE_X + 0.01 || x >= GONE_X - 0.01;

/** The client a step at rest is about. */
function litOf(step: Step): Client | null {
  const outcome = step.outcome;
  if (!outcome) return step.leaked[0] ?? null;
  if (outcome.kind === "idle") return null;
  if (outcome.kind === "handed") return outcome.to;
  return outcome.client;
}

export function poseAt(u: number): Pose {
  const last = STEPS.length - 1;
  const at = Math.min(Math.max(u, 0), last);
  const index = Math.min(Math.floor(at), last - 1);
  const t = at - index;
  const before = STEPS[index];
  const after = STEPS[index + 1];
  const outcome = after.outcome;

  const carriages = BAY_X.map((_, bay): number => carriageRest(bay, before));
  const shutters = BAY_X.map((_, bay): number => (bay < before.holders.length ? 1 : 0));
  const places = {} as Record<Client, Plane>;
  // Clients the step is not about only move when the waiting line closes up.
  for (const client of CLIENTS) {
    const a = restOf(client, before);
    const b = restOf(client, after);
    const s = ramp(t, 0.55, 0.85);
    places[client] = [mix(a[0], b[0], s), mix(a[1], b[1], s)];
  }
  let push = 0;
  let lit = litOf(before);

  // The timer follows the oldest waiter up to the moment of the event, then
  // shows whoever is the oldest afterwards.
  const waitAtEvent = before.waiters.length ? after.at - before.waiters[0].since : 0;
  const wait =
    mix(before.oldestWait, waitAtEvent, ramp(t, 0, 0.32)) + (after.oldestWait - waitAtEvent) * ramp(t, 0.84, 1);
  const busy = mix(countsOf(before).busy, countsOf(after).busy, ramp(t, 0.5, 0.9));

  if (outcome && t > 0) {
    lit = outcome.client;
    if (outcome.kind === "created") {
      const bay = outcome.conn;
      shutters[bay] = ramp(t, 0.03, 0.18);
      carriages[bay] = mix(mix(HIDDEN_Y, COUNTER_Y, ramp(t, 0.16, 0.52)), DOCK_Y, ramp(t, 0.78, 1));
      places[outcome.client] = along(t, [
        [0, OUTSIDE],
        [0.34, front(bay)],
        [0.56, front(bay)],
        [0.7, counter(bay)],
        [0.78, counter(bay)],
        [1, dock(bay)],
      ]);
    } else if (outcome.kind === "reused") {
      const bay = outcome.conn;
      carriages[bay] = mix(COUNTER_Y, DOCK_Y, ramp(t, 0.68, 1));
      places[outcome.client] = along(t, [
        [0, OUTSIDE],
        [0.38, front(bay)],
        [0.44, front(bay)],
        [0.62, counter(bay)],
        [0.68, counter(bay)],
        [1, dock(bay)],
      ]);
    } else if (outcome.kind === "queued") {
      places[outcome.client] = along(t, [
        [0, OUTSIDE],
        [0.85, slot(outcome.position)],
      ]);
    } else if (outcome.kind === "idle") {
      const bay = outcome.conn;
      carriages[bay] = mix(DOCK_Y, COUNTER_Y, ramp(t, 0, 0.32));
      places[outcome.client] = along(t, [
        [0, dock(bay)],
        [0.32, counter(bay)],
        [0.37, counter(bay)],
        [0.52, front(bay)],
        [0.56, front(bay)],
        [1, GONE],
      ]);
    } else if (outcome.kind === "handed") {
      const bay = outcome.conn;
      carriages[bay] = mix(DOCK_Y, COUNTER_Y, ramp(t, 0, 0.2) - ramp(t, 0.76, 1));
      places[outcome.client] = along(t, [
        [0, dock(bay)],
        [0.2, counter(bay)],
        [0.23, counter(bay)],
        [0.33, front(bay)],
        [0.35, front(bay)],
        [0.7, GONE],
      ]);
      places[outcome.to] = along(t, [
        [0.37, slot(1)],
        [0.56, front(bay)],
        [0.6, front(bay)],
        [0.72, counter(bay)],
        [0.76, counter(bay)],
        [1, dock(bay)],
      ]);
      if (t > 0.36) lit = outcome.to;
    } else {
      // Timeout: the timer reaches its last mark and trips the ejector.
      push = PUSH * (ramp(t, 0.36, 0.6) - ramp(t, 0.64, 0.84));
      const reach = t < 0.62 ? Math.max(0, push - PUSH_GAP) : PUSH - PUSH_GAP;
      places[outcome.client] = [QUEUE_X[0], LANE_Y + reach];
    }
  }

  const pucks = {} as Record<Client, Point3 | null>;
  for (const client of CLIENTS) {
    const place = places[client];
    pucks[client] = hidden(place) ? null : [place[0], place[1], heightAt(place[1])];
  }
  return { carriages, shutters, pucks, push, wait, busy, lit };
}

/* Parts whose shape changes, rebuilt from the pose. */

/** The ejector's rod, from its housing to the back of the pusher plate. */
export function rodOf(push: number): SolidPaths {
  const from = EJECTOR.y + EJECTOR.d;
  const plan: Plan = { x: PUSHER.x + PUSHER.w / 2 - 2, y: from, w: 4, d: PUSHER.y + push - from, r: 0.8 };
  return slabOf(plan, DECK + 2, 3, P, 2);
}

const RAD = Math.PI / 180;
const NEEDLE = 10.4;
const NEEDLE_TAIL = 2.6;

function needleAt(center: Plane, fraction: number): string {
  const angle = (DIAL_FROM + Math.min(1, Math.max(0, fraction)) * DIAL_SWEEP) * RAD;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return lineOnTop(
    [center[0] - NEEDLE_TAIL * c, center[1] - NEEDLE_TAIL * s],
    [center[0] + NEEDLE * c, center[1] + NEEDLE * s],
    DIAL_TOP + 0.2,
    P,
  );
}

/** The timer's needle for a number of seconds waited. */
export const timerNeedle = (wait: number) => needleAt(TIMER, wait / ACQUIRE_TIMEOUT);
/** The load gauge's needle for a number of busy connections. */
export const loadNeedle = (busy: number) => needleAt(LOAD, busy / MAX);

/** A puck is clipped by the feed housing's doorway until it is clear of it. */
export const inDoorway = ([x]: Point3) => x < QUEUE_X[QUEUE_X.length - 1] - 2;
/** A carriage that has not left its port yet is not drawn. */
export const isParked = (y: number) => y <= HIDDEN_Y + 0.01;
