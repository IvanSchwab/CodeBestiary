import { boxCorners, fitProjection, iso, type Flat, type Plan, type Plane, type Point3 } from "../../iso/iso-kit";

/**
 * World layout of the dispatcher. Units are about 1 px of the real thing:
 * x and y on the floor, z up. The viewer looks from +x, +y.
 */
export const WIDTH = 600;
export const HEIGHT = 336;
export const AZIMUTH = 45;

export const BASE: Plan = { x: -140, y: -84, w: 280, d: 168, r: 9 };
export const BASE_H = 9;
export const FOOT_H = 5;

/** Top of every surface a token rests on: lanes, anvil and tray. */
export const DECK = 10;

/* The loop: a hub with an arm that turns one way. */
export const HUB: Plane = [0, 0];
export const ARM_R = 50;
export const ARM_TAIL = 16;
export const COLUMN_R = 4.5;
export const COLUMN_TOP = 46;
/** Degrees, counter-clockwise from +x. The arm visits them in this order. */
export const STACK_AT = 0;
export const PARK_AT = 90;
export const MICRO_AT = 90;
export const TASK_AT = 180;

const RAD = Math.PI / 180;
export const onArm = (degrees: number, radius = ARM_R): Plane => [
  HUB[0] + radius * Math.cos(degrees * RAD),
  HUB[1] + radius * Math.sin(degrees * RAD),
];

/* Tokens. */
export const TOKEN_R = 8;
export const TOKEN_H = 6;
/** How far the arm comes down to pick or place, and so how high it carries. */
export const LIFT = 10;

/* Stations on the arm's circle. */
export const ANVIL = onArm(STACK_AT);
export const MICRO_PICK = onArm(MICRO_AT);
export const TASK_PICK = onArm(TASK_AT);
/** Where a callback waits before it is scheduled. The task lane is the long one. */
export const MICRO_STAGE: Plane = [MICRO_PICK[0] - 25, MICRO_PICK[1]];
export const TASK_STAGE: Plane = [TASK_PICK[0] - 68, TASK_PICK[1]];
/** Finished units line up here in the order they ran. */
export const TRAY_SLOTS: Plane[] = [
  [114, 0],
  [95, 0],
  [76, 0],
];

export const LANE_D = 22;
export const TASK_LANE: Plan = { x: TASK_STAGE[0] - 14, y: TASK_PICK[1] - LANE_D / 2, w: 68 + 26, d: LANE_D, r: 2 };
export const MICRO_LANE: Plan = { x: MICRO_STAGE[0] - 14, y: MICRO_PICK[1] - LANE_D / 2, w: 25 + 26, d: LANE_D, r: 2 };
export const ANVIL_BLOCK: Plan = { x: ANVIL[0] - 11, y: -11, w: 22, d: 22, r: 2.5 };
export const TRAY: Plan = { x: ANVIL[0] + 13, y: -11, w: 62, d: 22, r: 2 };

/* The press: a post behind the anvil and a head that comes down on it. */
export const POST: Plan = { x: ANVIL[0] - 4, y: -45, w: 8, d: 9, r: 1.2 };
export const POST_TOP = 72;
export const HEAD: Plan = { x: ANVIL[0] - 8, y: -36, w: 16, d: 46, r: 2.5 };
export const RAM_R = 7;
/** Bottom of the ram with the head up. */
export const RAM_UP = 42;
/** The ram travels until it rests on a token. */
export const STROKE = RAM_UP - (DECK + TOKEN_H);

/* The counter: one mark per line printed. */
export const DIAL: Plane = [98, 52];
export const DIAL_R = 15;
export const DIAL_TOP = 11;
export const DIAL_MARKS = 4;
/** Needle sweep in the floor plane, degrees counter-clockwise from +x. */
export const DIAL_FROM = 225;
export const DIAL_SWEEP = -270;

export const P = fitProjection(
  [...boxCorners(BASE, -BASE_H - FOOT_H, 0), [POST.x, POST.y, POST_TOP + 4], [POST.x + POST.w, POST.y, POST_TOP + 4]],
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
