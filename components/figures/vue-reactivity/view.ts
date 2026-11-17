import { boxCorners, fitProjection, iso, type Flat, type Plan, type Plane, type Point3 } from "../../iso/iso-kit";
import type { LinkId } from "./model";

/**
 * World layout of the trip-rod relay. Units are about 1 px of the real
 * thing: x and y on the floor, z up. The viewer looks from +x, +y, so a
 * notice travels away from the viewer, toward -y.
 *
 * Two lanes run along y. Lane A: the count rod, the computed's slider under
 * its housing, the bell housing. Lane B: the show rod, straight to the bell
 * housing.
 */
export const WIDTH = 600;
export const HEIGHT = 372;
export const AZIMUTH = 45;

export const BASE: Plan = { x: -64, y: -114, w: 128, d: 260, r: 9 };
export const BASE_H = 9;
export const FOOT_H = 5;

export const LANE_A = -34;
export const LANE_B = 34;

/* Bars. A subscriber's tongue runs low; a source's rod runs high and laps over it. */
export const BAR_W = 7;
export const BAR_H = 3;
export const LOW_Z = 8;
export const HIGH_Z = LOW_Z + BAR_H;
export const HIGH_TOP = HIGH_Z + BAR_H;
/** How far a rod is pushed when its source is written. */
export const SHOVE = 7;

/* Housings: legs with a deck across them, and a tunnel a slider runs through. */
export const LEG_H = 16;

/* The effect: a bell housing at the far end, across both lanes. */
export const EFFECT_Y = -106;
export const EFFECT_D = 42;
export const EFFECT_MOUTH = EFFECT_Y + EFFECT_D;
export const EFFECT_DECK: Plan = { x: -54, y: EFFECT_Y, w: 108, d: EFFECT_D, r: 3 };
export const EFFECT_DECK_H = 8;
export const EFFECT_TOP = LEG_H + EFFECT_DECK_H;
export const BELL: Plane = [0, -85];
export const BELL_R = 13.5;
/** Gap between the striker and the bell at rest. */
export const STRIKE = 3.4;

/* The computed: a housing over lane A, with a flag and a register on its deck. */
export const DOUBLE_Y = 8;
export const DOUBLE_D = 42;
export const DOUBLE_DECK: Plan = { x: -56, y: DOUBLE_Y, w: 44, d: DOUBLE_D, r: 3 };
export const DOUBLE_DECK_H = 7;
export const DOUBLE_TOP = LEG_H + DOUBLE_DECK_H;
export const FLAG: Plane = [-42, 21];
export const FLAG_COLLAR_H = 4;
export const FLAG_LIFT = 7;

/* Drop pins, one per possible link. Down couples a rod to a tongue. */
export const PIN_Y_EFFECT = -47;
export const PIN_Y_DOUBLE = 71;
export const PINS: Record<LinkId, Plane> = {
  "effect:double": [LANE_A, PIN_Y_EFFECT],
  "effect:show": [LANE_B, PIN_Y_EFFECT],
  "double:count": [LANE_A, PIN_Y_DOUBLE],
};
export const PIN_LIFT = 9;
/** A pending link: the pin is drawn half out but still couples. */
export const PIN_PENDING = 0.45;
/** A rod's eye reaches this far past its pin. */
export const EYE = 6.5;

/* Sources: a rod in a channel on a bed, with a scale and a cursor for the value. */
export const COUNT_BED: Plan = { x: -56, y: 88, w: 44, d: 50, r: 3 };
export const SHOW_BED: Plan = { x: 12, y: 56, w: 44, d: 50, r: 3 };
export const BED_H = 6;
export const COUNT_ROD_END = 132;
export const SHOW_ROD_END = 100;

/** Where the count cursor sits for a value: one mark every 6 units. */
export const COUNT_ZERO = 119;
export const COUNT_PITCH = 6;
export const COUNT_MARKS = 3;
/** The register of the computed: half the pitch, twice the marks. */
export const DOUBLE_ZERO = 43;
export const DOUBLE_PITCH = 3;
export const DOUBLE_MARKS = 8;
/** The show cursor has two stops. */
export const SHOW_TRUE = 72;
export const SHOW_FALSE = 84;

export const P = fitProjection(
  [
    ...boxCorners(BASE, -BASE_H - FOOT_H, 0),
    [BELL[0] - BELL_R, BELL[1], EFFECT_TOP + 17],
    [BELL[0] + BELL_R, BELL[1], EFFECT_TOP + 17],
    [FLAG[0], FLAG[1], DOUBLE_TOP + FLAG_COLLAR_H + FLAG_LIFT + 3],
  ],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: AZIMUTH },
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
