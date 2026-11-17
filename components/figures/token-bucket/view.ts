import { boxCorners, fitProjection, iso, type Flat, type Plan, type Plane, type Point3 } from "../../iso/iso-kit";
import { CAPACITY } from "./model";

/**
 * World layout of the token dispenser. Units are about 1 px of the real
 * thing: x and y on the floor, z up. The viewer looks from +x, +y.
 *
 * The track runs along x (requests travel toward +x). The feed runs along y:
 * cabinet at the back, the tube over the track, the overflow tray in front.
 */
export const WIDTH = 600;
export const HEIGHT = 392;
export const AZIMUTH = 45;

export const BASE: Plan = { x: -96, y: -42, w: 192, d: 104, r: 9 };
export const BASE_H = 9;
export const FOOT_H = 5;

/* Tokens and the carriers that stand for requests. */
export const TOKEN_R = 7;
export const TOKEN_H = 6;
export const CARRIER = 20;
export const CARRIER_H = 6;

/* The track. */
export const TRACK_Y = 25;
export const HOOD_W = 24;
export const INLET: Plan = { x: -86, y: 11, w: HOOD_W, d: 28, r: 2 };
export const OUTLET: Plan = { x: 62, y: 11, w: HOOD_W, d: 28, r: 2 };
export const HOOD_H = 18;
/** The face a carrier comes out of. */
export const INLET_FACE = INLET.x + INLET.w;
export const BED: Plan = { x: INLET_FACE, y: 14, w: OUTLET.x - INLET_FACE, d: 22, r: 0 };
export const BED_TOP = 2;
export const RAIL_TOP = 4;
export const RAILS: Plan[] = [16.5, 30.5].map((y) => ({ x: BED.x, y, w: BED.w, d: 3, r: 0 }));
/** Top of a carrier, where a token lands. */
export const DECK = RAIL_TOP + CARRIER_H;

/** Carrier centres along the track. */
export const X_HIDDEN = INLET.x + HOOD_W / 2;
export const X_STATION = 0;
export const X_PASSED = 38;
export const X_GONE = OUTLET.x + HOOD_W / 2;

/** The trap under the station and the gate after it. */
export const TRAP: Plan = { x: -11.5, y: 14, w: 23, d: 22, r: 1 };
export const GATE: Plan = { x: 15, y: 20.5, w: 2.6, d: 9, r: 0.6 };
export const GATE_UP = 10;

/* The feed line, back to front. */
export const PORT: Plane = [0, 2];
export const MOUTH: Plane = [0, TRACK_Y];
export const SPILL: Plane = [0, 49];

/* The tube: a plate over the track and four guide rods. */
export const PLATE: Plan = { x: -14.5, y: 10, w: 29, d: 29.5, r: 1.5 };
export const PLATE_Z = 24;
/** Top of the plate: the bottom token rests here. */
export const FLOOR = 27;
/** Top of a full stack, flush with the cabinet's deck. */
export const DECK_TOP = FLOOR + CAPACITY * TOKEN_H;
export const slotZ = (index: number) => FLOOR + index * TOKEN_H;

/* The cabinet that mints tokens. */
export const CABINET: Plan = { x: -13, y: -34, w: 26, d: 44, r: 2 };
export const CAP: Plan = { x: -14.5, y: -35.5, w: 29, d: 53, r: 2 };
export const CAP_H = 2;
export const HOUSING: Plan = { x: -9, y: -33, w: 18, d: 15, r: 2 };
export const HOUSING_H = 8;
/** The pusher head at rest, just behind the port. */
export const HEAD: Plan = { x: -8, y: PORT[1] - TOKEN_R - 4, w: 16, d: 4, r: 1 };
export const HEAD_H = 6;
export const PUSH_IN = MOUTH[1] - PORT[1];
export const PUSH_OUT = SPILL[1] - PORT[1];

/* The clock on the cabinet's side: one turn per refill period. */
export const CLOCK: Point3 = [CABINET.x + CABINET.w, -12, 29];
export const CLOCK_R = 10;

/* Where discarded tokens go. */
export const TRAY: Plan = { x: -11, y: 40.5, w: 22, d: 18, r: 2 };
export const TRAY_H = 6;

export const P = fitProjection(
  [...boxCorners(BASE, -BASE_H - FOOT_H, 0), ...boxCorners(CAP, DECK_TOP, DECK_TOP + HOUSING_H + 6)],
  WIDTH,
  HEIGHT,
  { pad: 24, azimuth: AZIMUTH },
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
