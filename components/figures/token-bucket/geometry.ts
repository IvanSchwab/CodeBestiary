import {
  corners,
  cylinder,
  depthOf,
  haloOf,
  insetPlan,
  iso,
  knurl,
  lineOnTop,
  pathOf,
  planOutline,
  pointsAt,
  ring,
  segment,
  sideRing,
  sideSeam,
  slabOf,
  topTicks,
  type Plan,
  type Plane,
  type Point3,
} from "../../iso/iso-kit";
import { CAPACITY } from "./model";
import { ROD_Z } from "./pose";
import {
  BASE,
  BASE_H,
  BED,
  BED_TOP,
  CABINET,
  CAP,
  CAP_H,
  CLOCK,
  CLOCK_R,
  DECK_TOP,
  FLOOR,
  FOOT_H,
  GATE,
  HEAD,
  HEAD_H,
  HOOD_H,
  HOUSING,
  HOUSING_H,
  INLET,
  INLET_FACE,
  MOUTH,
  OUTLET,
  P,
  PLATE,
  PLATE_Z,
  PORT,
  RAILS,
  RAIL_TOP,
  SPILL,
  TOKEN_R,
  TRAP,
  TRAY,
  TRAY_H,
  slotZ,
} from "./view";

/** Every static path of the dispenser, computed once at module load. */

const solid = (plan: Plan, z: number, h: number, steps = 6, bevel = 0) => slabOf(plan, z, h, P, steps, bevel);
const round = (at: Plane, r: number, z: number, h: number, steps = 32, bevel = 0) =>
  cylinder(at[0], at[1], r, z, h, P, steps, bevel);
const circle = (at: Plane, r: number, z: number, steps = 40) => ring(at[0], at[1], r, z, P, steps);
const join = (paths: string[]) => paths.join("");
const byDepth = (points: Plane[]) =>
  [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));
const dots = (points: Plane[], z: number) => pointsAt(points.map(([x, y]): Point3 => [x, y, z]), P);
/** A closed outline through 3D points: slots, panels and openings on a face. */
const loop = (points: Point3[]) => pathOf(points.map((point) => iso(point, P)), true);
/** A rectangle on a face that looks along x (a face at a fixed x). */
const onSide = (x: number, y0: number, y1: number, z0: number, z1: number) =>
  loop([
    [x, y0, z0],
    [x, y1, z0],
    [x, y1, z1],
    [x, y0, z1],
  ]);

/* Base plate on feet, with two ruler strips along the track and a label plate. */

const LABEL: Plan = { x: -86, y: -33, w: 44, d: 13, r: 1.5 };
const RULERS: Plan[] = [-59, 19].map((x) => ({ x, y: 38.6, w: 40, d: 6, r: 1 }));
const rulerTicks = RULERS.map((strip) =>
  topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P),
);

export const BASE_ART = {
  halo: haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P),
  feet: byDepth(corners(BASE, 18)).map((foot) => [
    round(foot, 7, -BASE_H - FOOT_H, 1.6, 28),
    round(foot, 5.4, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, 28),
  ]),
  slab: solid(BASE, -BASE_H, BASE_H, 8, 1.6),
  groove: planOutline(insetPlan(BASE, 5), 0, P),
  screwRings: join(corners(BASE, 12).map((screw) => circle(screw, 2.2, 0, 16))),
  screws: dots(corners(BASE, 12), 0),
  rulers: RULERS.map((strip) => solid(strip, 0, 0.6, 3)),
  rulerMinor: join(rulerTicks.map((ticks) => ticks.minor)),
  rulerMajor: join(rulerTicks.map((ticks) => ticks.major)),
  label: solid(LABEL, 0, 0.8, 4),
  labelLine: planOutline(insetPlan(LABEL, 1.6), 0.8, P),
  labelRules: join([
    lineOnTop([LABEL.x + 5, LABEL.y + 4], [LABEL.x + 30, LABEL.y + 4], 0.8, P),
    lineOnTop([LABEL.x + 5, LABEL.y + 6.5], [LABEL.x + 37, LABEL.y + 6.5], 0.8, P),
    lineOnTop([LABEL.x + 5, LABEL.y + 9], [LABEL.x + 21, LABEL.y + 9], 0.8, P),
  ]),
  labelScrews: dots(
    [
      [LABEL.x + 2.6, LABEL.y + 6.5],
      [LABEL.x + LABEL.w - 2.6, LABEL.y + 6.5],
    ],
    0.8,
  ),
};

/* The track: a bed, two rails, ties between them, and the trap under the station. */

const ties: string[] = [];
for (let x = BED.x + 6; x < BED.x + BED.w - 2; x += 8) {
  if (x > TRAP.x - 1 && x < TRAP.x + TRAP.w + 1) continue;
  ties.push(lineOnTop([x, RAILS[0].y + RAILS[0].d], [x, RAILS[1].y + 1], BED_TOP, P));
}
const TRAP_DOOR = insetPlan(TRAP, 1.6);

export const TRACK_ART = {
  bed: solid(BED, 0, BED_TOP, 2),
  ties: join(ties),
  rails: RAILS.map((rail) => solid(rail, BED_TOP, RAIL_TOP - BED_TOP, 2, 0.3)),
  trap: solid(TRAP, 0, RAIL_TOP, 3, 0.4),
  trapDoor: planOutline(TRAP_DOOR, RAIL_TOP, P, 3),
  trapSplit: lineOnTop([0, TRAP_DOOR.y], [0, TRAP_DOOR.y + TRAP_DOOR.d], RAIL_TOP, P),
  trapScrews: dots(corners(TRAP, 0.9), RAIL_TOP),
  /** The slot the gate rises from. */
  gateSlot: planOutline(insetPlan(GATE, -0.9), BED_TOP, P, 2),
};

/* The hoods a carrier comes out of and goes into. */

function hoodOf(plan: Plan) {
  const top = insetPlan(plan, 3);
  const slots: string[] = [];
  for (let y = top.y + 3; y <= top.y + top.d - 4.4; y += 3.4) {
    slots.push(planOutline({ x: top.x + 3, y, w: top.w - 6, d: 1.4, r: 0.7 }, HOOD_H, P, 3));
  }
  return {
    body: solid(plan, 0, HOOD_H, 5, 0.8),
    seam: sideSeam(plan, HOOD_H - 3.4, P, 5),
    inset: planOutline(top, HOOD_H, P, 4),
    slots: join(slots),
    screws: dots(corners(plan, 1.7), HOOD_H),
  };
}

export const INLET_ART = {
  ...hoodOf(INLET),
  /** The opening on the face the carriers come out of. */
  opening: onSide(INLET_FACE, 13.5, 36.5, RAIL_TOP, 13.5),
  openingRails: join(RAILS.map((rail) => onSide(INLET_FACE, rail.y, rail.y + rail.d, BED_TOP, RAIL_TOP))),
};
export const OUTLET_ART = hoodOf(OUTLET);

/* The gate's drive, behind the track. */

const DRIVE: Plan = { x: 15.5, y: 2, w: 13, d: 12, r: 1.6 };
const DRIVE_KNOB: Plane = [DRIVE.x + 7.6, DRIVE.y + 6];
export const DRIVE_ART = {
  body: solid(DRIVE, 0, 7, 4, 0.5),
  seam: sideSeam(DRIVE, 2, P, 4),
  screws: dots(corners(DRIVE, 1.8), 7),
  knob: round(DRIVE_KNOB, 3, 7, 2.4, 20, 0.3),
  knurl: knurl(DRIVE_KNOB[0], DRIVE_KNOB[1], 3, 7, 9.4, 18, P, 0.3),
  pointer: lineOnTop([DRIVE_KNOB[0] - 2.7, DRIVE_KNOB[1]], [DRIVE_KNOB[0] + 2.7, DRIVE_KNOB[1]], 9.4, P),
};

/* The cabinet that mints tokens: plinth, body, deck, and the pusher on top. */

const PLINTH = insetPlan(CABINET, -1.4);
const BODY_TOP = DECK_TOP - CAP_H;
const FACE = CABINET.x + CABINET.w;
const [, CLOCK_Y, CLOCK_Z] = CLOCK;
const KNOB: Plane = [0, HOUSING.y + HOUSING.d / 2];
const HOUSING_TOP = DECK_TOP + HOUSING_H;

function clockMarks() {
  const minor: string[] = [];
  const major: string[] = [];
  const rim = CLOCK_R - 1.6;
  for (let index = 0; index < 12; index++) {
    const angle = (index / 12) * Math.PI * 2;
    const big = index === 0;
    const inner = rim - (big ? 3 : 1.5);
    const point = (r: number): Point3 => [FACE, CLOCK_Y - r * Math.sin(angle), CLOCK_Z + r * Math.cos(angle)];
    (big ? major : minor).push(segment(point(inner), point(rim), P));
  }
  return { minor: join(minor), major: join(major) };
}
const clock = clockMarks();

const vents: string[] = [];
for (let z = 22; z <= 36; z += 3.5) vents.push(onSide(FACE, 1.5, 7, z, z + 1.4));

export const CABINET_ART = {
  plinth: solid(PLINTH, 0, 3, 4, 0.4),
  body: solid(CABINET, 3, BODY_TOP - 3, 5, 0),
  seams: join([sideSeam(CABINET, 17, P, 5), sideSeam(CABINET, BODY_TOP - 4, P, 5)]),
  /** An access door low on the side, with its two screws. */
  door: onSide(FACE, -30, 6, 6, 14.5),
  doorScrews: pointsAt(
    [
      [FACE, -27.5, 10.2],
      [FACE, 3.5, 10.2],
    ],
    P,
  ),
  vents: join(vents),
  clockBezel: sideRing(CLOCK, CLOCK_R, "x", P, 48),
  clockFace: sideRing(CLOCK, CLOCK_R - 1.6, "x", P, 48),
  clockMinor: clock.minor,
  clockMajor: clock.major,
  clockHub: pointsAt([CLOCK], P),
  cap: solid(CAP, BODY_TOP, CAP_H, 5, 0.6),
  /** The port a new token rises out of. */
  port: circle(PORT, TOKEN_R + 0.5, DECK_TOP, 36),
  portCollar: circle(PORT, TOKEN_R + 2.2, DECK_TOP, 40),
  capScrews: dots(
    [
      [CAP.x + 2.4, PORT[1] - 9],
      [CAP.x + CAP.w - 2.4, PORT[1] - 9],
      [CAP.x + 2.4, CAP.y + CAP.d - 2.4],
      [CAP.x + CAP.w - 2.4, CAP.y + CAP.d - 2.4],
    ],
    DECK_TOP,
  ),
  housing: solid(HOUSING, DECK_TOP, HOUSING_H, 5, 0.6),
  housingSeam: sideSeam(HOUSING, DECK_TOP + 2, P, 5),
  housingScrews: dots(corners(HOUSING, 2), HOUSING_TOP),
  /** The gland the rod slides out of. */
  gland: sideRingY([0, HOUSING.y + HOUSING.d, ROD_Z + 1.4], 2.6),
  knob: round(KNOB, 4, HOUSING_TOP, 3, 26, 0.4),
  knobKnurl: knurl(KNOB[0], KNOB[1], 4, HOUSING_TOP, HOUSING_TOP + 3, 22, P, 0.3),
  knobPointer: lineOnTop([KNOB[0] - 3.7, KNOB[1]], [KNOB[0] + 3.7, KNOB[1]], HOUSING_TOP + 3, P),
  head: solid(HEAD, DECK_TOP, HEAD_H, 3, 0.4),
  headScrews: dots(
    [
      [HEAD.x + 2.2, HEAD.y + 2],
      [HEAD.x + HEAD.w - 2.2, HEAD.y + 2],
    ],
    DECK_TOP + HEAD_H,
  ),
};

function sideRingY(center: Point3, radius: number) {
  return sideRing(center, radius, "y", P, 20);
}

/* The tube: two posts, a plate over the track, four rods and a level gauge. */

const POST = 2.7;
const POSTS: Plan[] = [PLATE.x, PLATE.x + PLATE.w - POST].map((x) => ({
  x,
  y: PLATE.y + PLATE.d - POST,
  w: POST,
  d: POST,
  r: 0.6,
}));
const ROD_AT = TOKEN_R + 1.5;
const rodAt = (dx: number, dy: number): Plane => [MOUTH[0] + dx * ROD_AT, MOUTH[1] + dy * 4];
const rod = (at: Plane) => round(at, 1, FLOOR, DECK_TOP - FLOOR, 10);
const GAUGE: Plan = { x: PLATE.x, y: PLATE.y + PLATE.d - 2.4, w: 5.4, d: 2.4, r: 0.4 };
const LATCH: Plan = { x: PLATE.x + PLATE.w, y: MOUTH[1] - 3.5, w: 4.2, d: 7, r: 1 };

/** A level mark wraps the gauge's visible faces and ends on its silhouette. */
const levelMark = (z: number) => sideSeam(GAUGE, z, P, 2);
const levels = Array.from({ length: CAPACITY - 1 }, (_, index) => levelMark(slotZ(index + 1)));

export const TUBE_ART = {
  posts: POSTS.map((post) => solid(post, 0, PLATE_Z, 2)),
  postFeet: POSTS.map((post) => solid(insetPlan(post, -1.2), 0, 1.4, 2)),
  plate: solid(PLATE, PLATE_Z, FLOOR - PLATE_Z, 4, 0.5),
  plateScrews: dots(
    [
      [PLATE.x + 2.2, PLATE.y + 2.2],
      [PLATE.x + PLATE.w - 2.2, PLATE.y + 2.2],
      [PLATE.x + PLATE.w - 2.2, PLATE.y + PLATE.d - 2.2],
    ],
    FLOOR,
  ),
  /** The seat the bottom token rests on. */
  seat: circle(MOUTH, TOKEN_R + 0.8, FLOOR, 36),
  rodBack: rod(rodAt(-1, -1)),
  rodsSide: [rod(rodAt(1, -1)), rod(rodAt(-1, 1))],
  rodFront: rod(rodAt(1, 1)),
  rodTips: dots([rodAt(-1, -1), rodAt(1, -1), rodAt(-1, 1), rodAt(1, 1)], DECK_TOP),
  gauge: solid(GAUGE, FLOOR, DECK_TOP - FLOOR, 2),
  gaugeLevels: join(levels),
  /** The release latch on the side of the plate. It is drawn home and moved. */
  latch: solid(LATCH, PLATE_Z, FLOOR - PLATE_Z, 3, 0.3),
  latchDot: dots([[LATCH.x + LATCH.w / 2, LATCH.y + LATCH.d / 2]], FLOOR),
};

/* Where discarded tokens go: a closed tray with a port on top. */

export const TRAY_ART = {
  body: solid(TRAY, 0, TRAY_H, 4, 0.5),
  seam: sideSeam(TRAY, 2, P, 4),
  port: circle(SPILL, TOKEN_R + 0.5, TRAY_H, 36),
  collar: circle(SPILL, TOKEN_R + 1.9, TRAY_H, 40),
  screws: dots(corners(TRAY, 1.8), TRAY_H),
};
