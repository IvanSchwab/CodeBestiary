import { boxCorners, fitProjection, iso, type Flat, type Plan, type Plane, type Point3 } from "../../iso/iso-kit";

/**
 * World layout of the token bench. Units are about 1 px of the real thing:
 * x and y on the floor, z up. The viewer looks from +x, +y.
 *
 * The issuing cabinet (the auth server) stands at the back left; the reader
 * locker (the API) at the front right. Nothing joins them. Between them is
 * the client's tray: a card lane runs from the cabinet through the tray to
 * the reader, a tag lane only from the cabinet to the tray.
 */
export const WIDTH = 600;
export const HEIGHT = 360;
export const AZIMUTH = 55;

export const BASE: Plan = { x: -150, y: -40, w: 258, d: 107, r: 9 };
export const BASE_H = 9;
export const FOOT_H = 5;

/** Top of the lane beds and the tray: tokens ride here. */
export const DECK = 5;
export const LIP_H = 1.6;
export const LIP_W = 1.6;

/* Tokens. An access token is a card, a refresh token a tag with a hole. */
export const CARD_L = 16;
export const CARD_W = 11;
export const CARD_T = 1.2;
export const TAG_L = 12;
export const TAG_W = 8;
export const TAG_T = 1.8;

/* The two lanes, by their centre line. */
export const TAG_Y = -9;
export const CARD_Y = 11;
export const TAG_INNER = TAG_W + 2;
export const CARD_INNER = CARD_W + 2;

/* The issuing cabinet: the auth server. */
export const CAB: Plan = { x: -136, y: -28, w: 64, d: 56, r: 2 };
export const CAB_H = 30;
export const PLINTH_H = 2.4;
export const CAB_FACE_X = CAB.x + CAB.w;
export const CAB_FRONT_Y = CAB.y + CAB.d;
export const SLOT_H = 3;

/* The ledger rack on the cabinet: one stub per refresh token it issued. */
export const RACK: Plan = { x: -128, y: -16, w: 48, d: 10, r: 1.2 };
export const RACK_H = 5;
export const RACK_TOP = CAB_H + RACK_H;
export const STUB_Y = RACK.y + RACK.d / 2;
export const STUB_W = 8.6;
export const STUB_T = 1.6;
export const STUB_H = 17;
export const STUB_X = [-117.5, -106.5, -95.5, -84.5];
/** A used stub sinks to this share of its height. */
export const USED = 0.45;

/* The family bar between two uprights: when it comes down, every stub of the row goes with it. */
export const UPRIGHT_W = 4;
export const UPRIGHTS: Plan[] = [
  { x: RACK.x - UPRIGHT_W, y: STUB_Y - 3, w: UPRIGHT_W, d: 6, r: 0.8 },
  { x: RACK.x + RACK.w, y: STUB_Y - 3, w: UPRIGHT_W, d: 6, r: 0.8 },
];
export const UPRIGHT_TOP = RACK_TOP + STUB_H + 8;
export const BAR: Plan = { x: RACK.x, y: STUB_Y - 1.8, w: RACK.w, d: 3.6, r: 0.6 };
export const BAR_T = 3;
/** Gap between the bar at rest and the top of a fresh stub. */
export const BAR_GAP = 2;
export const BAR_DROP = STUB_H + BAR_GAP;

/* The signing key on the cabinet, and its twin on the reader. */
export const SEAL_R = 4.6;
export const CAB_SEAL: Plane = [-84, 15];

/* The stolen copy's way in: a hood at the front and a chute to the cabinet's front face. */
export const ATT_X = -104;
export const CHUTE: Plan = { x: ATT_X - TAG_INNER / 2 - LIP_W, y: CAB_FRONT_Y, w: TAG_INNER + LIP_W * 2, d: 18, r: 0 };
export const HOOD: Plan = { x: ATT_X - 12, y: CHUTE.y + CHUTE.d, w: 24, d: 16, r: 2.5 };
export const HOOD_H = 14;

/* The client: a tray on the lanes, with a backstop, and a bin in front for spent tokens. */
export const TRAY: Plan = { x: -36, y: -17, w: 32, d: 37, r: 2 };
export const SEAT_X = TRAY.x + TRAY.w / 2;
export const BACKSTOP: Plan = { x: TRAY.x, y: TRAY.y - 6, w: TRAY.w, d: 6, r: 1.5 };
export const BACKSTOP_H = 13;
export const BIN: Plan = { x: TRAY.x + 2, y: TRAY.y + TRAY.d + 0.4, w: 28, d: 28, r: 2 };
export const BIN_WALL = 1.6;
export const BIN_H = 3.4;
export const BIN_FLOOR = 0.8;
export const BIN_CARD_Y = BIN.y + 19.6;
export const BIN_TAG_Y = BIN.y + 8.6;

/* The reader locker: the API. */
export const LOCK: Plan = { x: 46, y: -12, w: 48, d: 42, r: 2 };
export const LOCK_H = 26;
export const LOCK_FRONT_Y = LOCK.y + LOCK.d;
export const THROAT: Plan = { x: 36, y: CARD_Y - 10, w: LOCK.x - 36, d: 20, r: 1 };
export const THROAT_H = 9;
export const DIAL: Plane = [62, 4];
export const DIAL_R = 12;
export const DIAL_TOP = LOCK_H + 7;
const RAD = Math.PI / 180;
/** Minutes on the clock face to a floor point: 0 at −y, clockwise on screen. */
export const onDial = (minutes: number, r: number): Plane => {
  const angle = (-90 + (minutes / 60) * 360) * RAD;
  return [DIAL[0] + r * Math.cos(angle), DIAL[1] + r * Math.sin(angle)];
};
export const LOCK_SEAL: Plane = [85, 19];
/** The 401 flag rises out of a slot in the locker's top. */
export const FLAG_X = 84;
export const FLAG_Y = -3;
export const FLAG_W = 9;
export const FLAG_T = 1.4;
export const FLAG_H = 11;
/** The drawer on the locker's front: it opens when a request is served. */
export const DRAWER = { x0: 52, x1: 88, z0: 5, z1: 19 };
export const DRAWER_PANEL = 2;
export const DRAWER_OPEN = 14;

/* Where tokens rest. */
export const CARD_TRAY: Point3 = [SEAT_X, CARD_Y, DECK];
export const TAG_TRAY: Point3 = [SEAT_X, TAG_Y, DECK];
/** Inside the cabinet, just behind its face. */
export const CARD_HOME: Point3 = [CAB_FACE_X - CARD_L / 2 - 1, CARD_Y, DECK];
export const TAG_HOME: Point3 = [CAB_FACE_X - TAG_L / 2 - 1, TAG_Y, DECK];
/** Fully in the reader. */
export const CARD_READER: Point3 = [LOCK.x + CARD_L / 2 - 2, CARD_Y, DECK];
/** The stolen copy travels along y: inside the hood, and inside the cabinet. */
export const ATT_HOOD: Point3 = [ATT_X, HOOD.y + HOOD.d / 2, DECK];
export const ATT_HOME: Point3 = [ATT_X, CAB_FRONT_Y - TAG_L / 2 - 1, DECK];

export const P = fitProjection(
  [
    ...boxCorners(BASE, -BASE_H - FOOT_H, 0),
    ...boxCorners(UPRIGHTS[0], 0, UPRIGHT_TOP),
    ...boxCorners(UPRIGHTS[1], 0, UPRIGHT_TOP),
    ...boxCorners(LOCK, 0, DIAL_TOP),
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
