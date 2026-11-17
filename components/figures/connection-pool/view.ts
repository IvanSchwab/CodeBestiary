import { boxCorners, fitProjection, iso, type Flat, type Plan, type Plane, type Point3 } from "../../iso/iso-kit";
import { MAX } from "./model";

/**
 * World layout of the transfer bench. Units are about 1 px of the real thing:
 * x and y on the floor, z up. The viewer looks from +x, +y, so the manifold
 * along the back (low y) shows its front face and its ports.
 */
export const WIDTH = 600;
export const HEIGHT = 322;
export const AZIMUTH = 55;

export const BASE: Plan = { x: -154, y: -88, w: 308, d: 172, r: 9 };
export const BASE_H = 9;
export const FOOT_H = 5;

/** Top of every surface a client rests on: the lane and the carriages. */
export const DECK = 10;

/* Clients: pucks numbered by pips. */
export const PUCK_R = 7;
export const PUCK_H = 6;

/* The lane clients travel on: in from the left housing, out into the right one. */
export const LANE_Y = 41;
export const LANE: Plan = { x: -126, y: LANE_Y - 11, w: 252, d: 22, r: 2 };
export const HOUSING_H = 23;
export const FEED: Plan = { x: -148, y: LANE_Y - 15, w: 22, d: 30, r: 2.5 };
export const EXIT: Plan = { x: 126, y: LANE_Y - 15, w: 22, d: 30, r: 2.5 };
/** Where a client is before it arrives and after it leaves: inside a housing. */
export const OUTSIDE_X = -137;
export const GONE_X = 137;
/** The feed housing's doorway, on its face toward the lane. */
export const FEED_DOOR = { x: FEED.x + FEED.w, y0: LANE_Y - 8.5, y1: LANE_Y + 8.5, z0: DECK, z1: DECK + 9 };

/** The waiting line, oldest first. Its length on the bench is the longest queue the scenario reaches. */
export const QUEUE_X = [-76, -94, -112];

/* The pool: one bay per connection it may open. */
const BAY_PITCH = 40;
export const BAY_X = Array.from({ length: MAX }, (_, bay) => (bay - (MAX - 1) / 2) * BAY_PITCH);
/** A carriage's three resting places along its rails. */
export const HIDDEN_Y = -66;
export const DOCK_Y = -40;
export const COUNTER_Y = 14;
export const CARRIAGE: Plan = { x: -11, y: -10, w: 22, d: 20, r: 2.5 };
export const RAIL_H = 4;
export const RAIL_END = 25;

/* The manifold: the only way into the database, with one port per bay. */
export const MANIFOLD: Plan = { x: BAY_X[0] - 22, y: -80, w: BAY_X[MAX - 1] - BAY_X[0] + 44, d: 28, r: 2 };
export const MANIFOLD_H = 36;
export const FACE_Y = MANIFOLD.y + MANIFOLD.d;
export const PORT_HALF = 12.5;
export const PORT_H = 15;
export const SHUTTER_D = 1.4;
/** How far a shutter lifts to open its port. */
export const SHUTTER_LIFT = PORT_H + 1;

/* The database itself: a drum on the manifold's supply duct. */
export const TANK: Plane = [108, -58];
export const TANK_R = 24;
export const TANK_H = 30;

/* The acquire timeout: a timer, and the ejector it trips at the head of the queue. */
export const EJECTOR: Plan = { x: QUEUE_X[0] - 9, y: 4, w: 18, d: 20, r: 2 };
export const EJECTOR_H = 19;
export const PUSHER: Plan = { x: QUEUE_X[0] - 7, y: 26.5, w: 14, d: 2.5, r: 0.8 };
/** Stroke of the ejector. The first part closes the gap to the puck. */
export const PUSH = 30;
export const PUSH_GAP = LANE_Y - PUCK_R - (PUSHER.y + PUSHER.d);
export const PAN: Plan = { x: QUEUE_X[0] - 14, y: 55, w: 28, d: 23, r: 3 };
export const PAN_H = 2;
export const PAN_SEAT: Plane = [QUEUE_X[0], LANE_Y + PUSH - PUSH_GAP];

export const TIMER: Plane = [-118, -34];
export const LOAD: Plane = [82, -8];
export const DIAL_R = 15;
export const DIAL_TOP = 11;
/** Needle sweep in the floor plane, degrees counter-clockwise from +x. */
export const DIAL_FROM = 225;
export const DIAL_SWEEP = -270;

export const P = fitProjection(
  [
    ...boxCorners(BASE, -BASE_H - FOOT_H, 0),
    ...boxCorners(MANIFOLD, 0, MANIFOLD_H + 2),
    [TANK[0], TANK[1] - TANK_R, TANK_H + 8],
    ...boxCorners(FEED, 0, HOUSING_H + 2),
  ],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: AZIMUTH },
);

export const at = (point: Point3): Flat => iso(point, P);

const ORIGIN = at([0, 0, 0]);
const minus = (a: Flat, b: Flat): Flat => [a[0] - b[0], a[1] - b[1]];
const EX = minus(at([1, 0, 0]), ORIGIN);
const EY = minus(at([0, 1, 0]), ORIGIN);
const EZ = minus(at([0, 0, 1]), ORIGIN);

const fine = (value: number) => Math.round(value * 100) / 100;

/** A translate() that moves a pre-built group by a world offset. */
export const shift = (dx: number, dy: number, dz = 0) =>
  `translate(${fine(EX[0] * dx + EY[0] * dy + EZ[0] * dz)} ${fine(EX[1] * dx + EY[1] * dy + EZ[1] * dz)})`;
