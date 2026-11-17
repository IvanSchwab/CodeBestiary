import {
  corners,
  cylinder,
  depthOf,
  haloOf,
  insetPlan,
  knurl,
  lineOnTop,
  pathOf,
  planOutline,
  pointsAt,
  ring,
  sideArc,
  sideSeam,
  slabOf,
  type Flat,
  type Plan,
  type Plane,
  type Point3,
} from "../../iso/iso-kit";
import {
  BASE,
  BASE_H,
  BEAM_END,
  BEAM_H,
  BEAM_HALF,
  BEAM_Z,
  BEZEL_H,
  BEZEL_R,
  BLADE_HALF,
  BLADE_Z,
  BORE_R,
  CARD_D,
  CARD_T,
  CARD_W,
  CARD_X,
  CARRIAGE,
  CARRIAGE_H,
  CARRIAGE_Z,
  CENTER,
  DOC_TRAY_Y,
  ENCODER,
  ENCODER_H,
  FOOT_H,
  HUB_H,
  HUB_R,
  P,
  QUERY_TRAY_Y,
  RAIL,
  RAIL_H,
  RAIL_Y,
  SLIDER_SPAN,
  SLIDER_X,
  SLIDER_Y,
  STOP,
  TABLE_R,
  TOP,
  TRAY_T,
  UNIT,
  WELL_Y,
  at,
  railX,
} from "./view";

/** Every static path of the bench, computed once at module load. */

const solid = (plan: Plan, z: number, h: number, steps = 6, bevel = 0) => slabOf(plan, z, h, P, steps, bevel);
const round = (where: Plane, r: number, z: number, h: number, steps = 32, bevel = 0) =>
  cylinder(where[0], where[1], r, z, h, P, steps, bevel);
const circle = (where: Plane, r: number, z: number, steps = 40) => ring(where[0], where[1], r, z, P, steps);
const join = (paths: string[]) => paths.join("");
const byDepth = (points: Plane[]) =>
  [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));
const dots = (points: Plane[], z: number) => pointsAt(points.map(([x, y]): Point3 => [x, y, z]), P);
const centered = (cx: number, cy: number, w: number, d: number, r: number): Plan => ({ x: cx - w / 2, y: cy - d / 2, w, d, r });
const RAD = Math.PI / 180;

/* Base plate on feet, with a label plate. */

const LABEL: Plan = { x: 84, y: 54, w: 44, d: 14, r: 1.5 };

export const BASE_ART = {
  halo: haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P),
  feet: byDepth(corners(BASE, 20)).map((foot) => [
    round(foot, 7, -BASE_H - FOOT_H, 1.6, 28),
    round(foot, 5.4, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, 28),
  ]),
  slab: solid(BASE, -BASE_H, BASE_H, 8, 1.6),
  groove: planOutline(insetPlan(BASE, 5), 0, P),
  screwRings: join(corners(BASE, 12).map((screw) => circle(screw, 2.2, 0, 16))),
  screws: dots(corners(BASE, 12), 0),
  label: solid(LABEL, 0, 0.8, 4),
  labelLine: planOutline(insetPlan(LABEL, 1.6), 0.8, P),
  labelRules: join([
    lineOnTop([LABEL.x + 5, LABEL.y + 4.5], [LABEL.x + 30, LABEL.y + 4.5], 0.8, P),
    lineOnTop([LABEL.x + 5, LABEL.y + 7], [LABEL.x + 37, LABEL.y + 7], 0.8, P),
    lineOnTop([LABEL.x + 5, LABEL.y + 9.5], [LABEL.x + 22, LABEL.y + 9.5], 0.8, P),
  ]),
  labelScrews: dots(
    [
      [LABEL.x + 2.6, LABEL.y + 7],
      [LABEL.x + LABEL.w - 2.6, LABEL.y + 7],
    ],
    0.8,
  ),
};

/* The encoder: a housing with two card trays, a well and one slider per component. */

const E_TOP = ENCODER_H;
const WELL = centered(CARD_X, WELL_Y, CARD_W + 2.4, CARD_D + 2.4, 0.6);
const WELL_DEPTH = 9;
const trayOf = (y: number, exit: 1 | -1) => {
  const plan = centered(CARD_X, y, CARD_W + 4, CARD_D + 4, 1.4);
  // Posts on the corners away from the well, so a card can slide off toward it.
  const back = exit > 0 ? plan.y + 1.6 : plan.y + plan.d - 1.6;
  const posts: Plane[] = [
    [plan.x + 1.6, back],
    [plan.x + plan.w - 1.6, back],
  ];
  return {
    plate: solid(plan, E_TOP, TRAY_T, 3, 0.4),
    posts: byDepth(posts).map((post) => round(post, 1.1, E_TOP + TRAY_T, 9, 16, 0.3)),
    postCaps: join(posts.map((post) => circle(post, 0.5, E_TOP + TRAY_T + 9, 10))),
    screws: dots(
      [
        [plan.x + plan.w / 2 - 6, back],
        [plan.x + plan.w / 2 + 6, back],
      ],
      E_TOP + TRAY_T,
    ),
  };
};

const wellCorner = (x: number, y: number, z: number): Point3 => [x, y, z];
const wellTop = [
  wellCorner(WELL.x, WELL.y, E_TOP),
  wellCorner(WELL.x + WELL.w, WELL.y, E_TOP),
  wellCorner(WELL.x + WELL.w, WELL.y + WELL.d, E_TOP),
  wellCorner(WELL.x, WELL.y + WELL.d, E_TOP),
];
const down = (point: Point3): Point3 => [point[0], point[1], point[2] - WELL_DEPTH];

/** Front-face vents of the encoder: closed slots on the face at y = front. */
function faceSlot(x0: number, x1: number, z: number, y: number, r = 0.9): string {
  const points: Flat[] = [];
  for (let step = 0; step <= 8; step++) {
    const angle = (-90 + (180 * step) / 8) * RAD;
    points.push(at([x1 - r + r * Math.cos(angle), y, z + r * Math.sin(angle)]));
  }
  for (let step = 0; step <= 8; step++) {
    const angle = (90 + (180 * step) / 8) * RAD;
    points.push(at([x0 + r + r * Math.cos(angle), y, z + r * Math.sin(angle)]));
  }
  return pathOf(points, true);
}

const sliderStrip = (x: number): Plan => ({ x: x - 2.4, y: SLIDER_Y - SLIDER_SPAN - 3, w: 4.8, d: 2 * SLIDER_SPAN + 6, r: 0.8 });
function sliderTicks(x: number) {
  const strip = sliderStrip(x);
  const minor: string[] = [];
  const major: string[] = [];
  for (let step = -4; step <= 4; step++) {
    const y = SLIDER_Y + (step / 4) * SLIDER_SPAN;
    const big = step % 4 === 0;
    (big ? major : minor).push(lineOnTop([strip.x, y], [strip.x + (big ? 3 : 1.8), y], E_TOP + 0.6, P));
  }
  return { minor: join(minor), major: join(major) };
}

const FRONT = ENCODER.y + ENCODER.d;

export const ENCODER_ART = {
  housing: solid(ENCODER, 0, E_TOP, 6, 1),
  seams: join([sideSeam(ENCODER, 4, P, 6), sideSeam(ENCODER, E_TOP - 4.4, P, 6)]),
  inset: planOutline(insetPlan(ENCODER, 3.2), E_TOP, P, 6),
  screws: dots(corners(ENCODER, 5.6), E_TOP),
  vents: join([7.6, 10.4, 13.2].map((z) => faceSlot(ENCODER.x + 40, ENCODER.x + ENCODER.w - 8, z, FRONT))),
  well: pathOf(pointsAt(wellTop, P), true),
  /** The two inner walls of the well that face the viewer, drawn inside the opening. */
  wellWalls: [
    pathOf(pointsAt([wellTop[0], wellTop[1], down(wellTop[1]), down(wellTop[0])], P), true),
    pathOf(pointsAt([wellTop[3], wellTop[0], down(wellTop[0]), down(wellTop[3])], P), true),
  ],
  wellRim: planOutline(insetPlan(WELL, -1.4), E_TOP, P, 3),
  docTray: trayOf(DOC_TRAY_Y, 1),
  queryTray: trayOf(QUERY_TRAY_Y, -1),
  strips: SLIDER_X.map((x) => solid(sliderStrip(x), E_TOP, 0.6, 3)),
  stripTicks: SLIDER_X.map((x) => sliderTicks(x)),
};

/** What shows of a card once it is below the top of the encoder: only what the well's opening lets through. */
export const WELL_CLIP = ENCODER_ART.well;

/* A slider block, built at the world origin on top of its strip. */

export const SLIDER_ART = {
  block: solid(centered(0, 0, 7.6, 4.2, 0.8), E_TOP + 0.6, 2.6, 3, 0.4),
  mark: lineOnTop([-2.6, 0], [2.6, 0], E_TOP + 3.2, P),
};

/* The drive from the encoder to the turntable. */

const DRIVE: Plan = { x: ENCODER.x + ENCODER.w, y: CENTER[1] - 3.5, w: CENTER[0] - BEZEL_R - (ENCODER.x + ENCODER.w) + 1, d: 7, r: 1.4 };
const COUPLING = (x: number): Plan => ({ x: x - 2.6, y: CENTER[1] - 5.2, w: 5.2, d: 10.4, r: 1.2 });

export const DRIVE_ART = {
  bar: solid(DRIVE, 0, 5, 3, 0.4),
  seam: sideSeam(DRIVE, 2.5, P, 3),
  couplings: [DRIVE.x + 6, DRIVE.x + DRIVE.w - 7].map((x) => solid(COUPLING(x), 0, 7, 3, 0.5)),
  couplingScrews: dots(
    [DRIVE.x + 6, DRIVE.x + DRIVE.w - 7].map((x): Plane => [x, CENTER[1]]),
    7,
  ),
};

/* The turntable: a fixed bezel with degree marks, the turning table and its hub. */

function bezelTicks() {
  const minor: string[] = [];
  const major: string[] = [];
  const outer = BEZEL_R - 1.2;
  for (let degree = 10; degree < 360; degree += 10) {
    const big = degree % 30 === 0;
    const inner = outer - (big ? 2.8 : 1.6);
    const angle = degree * RAD;
    (big ? major : minor).push(
      lineOnTop(
        [CENTER[0] + inner * Math.cos(angle), CENTER[1] + inner * Math.sin(angle)],
        [CENTER[0] + outer * Math.cos(angle), CENTER[1] + outer * Math.sin(angle)],
        BEZEL_H,
        P,
      ),
    );
  }
  return { minor: join(minor), major: join(major) };
}
const ticks = bezelTicks();

export const TABLE_ART = {
  bezel: round(CENTER, BEZEL_R, 0, BEZEL_H, 96, 0.8),
  bezelSeam: sideArc(CENTER[0], CENTER[1], BEZEL_R, 3, P, 64),
  bezelMinor: ticks.minor,
  bezelMajor: ticks.major,
  /** The zero mark: the direction the encoder turns every vector to, along the rail. */
  bezelZero: lineOnTop([CENTER[0] + TABLE_R + 0.6, CENTER[1]], [CENTER[0] + BEZEL_R - 0.6, CENTER[1]], BEZEL_H, P),
  table: round(CENTER, TABLE_R, BEZEL_H, TOP - BEZEL_H, 96, 0.9),
  tableSeam: sideArc(CENTER[0], CENTER[1], TABLE_R, BEZEL_H + 1.4, P, 64),
  unit: circle(CENTER, UNIT, TOP, 96),
  hub: round(CENTER, HUB_R, TOP, HUB_H, 40, 0.5),
  hubRing: circle(CENTER, HUB_R - 2.2, TOP + HUB_H, 28),
  hubScrews: dots(
    [0, 90, 180, 270].map((degree): Plane => [
      CENTER[0] + (HUB_R - 1.1) * Math.cos(degree * RAD),
      CENTER[1] + (HUB_R - 1.1) * Math.sin(degree * RAD),
    ]),
    TOP + HUB_H,
  ),
};

/* A pin's bore, built at the world origin. The pin itself is rebuilt as it rises (pose.ts). */

export const BORE_ART = {
  bore: circle([0, 0], BORE_R, TOP, 28),
};

/* The rail, its scale, the threshold stop and the sweep bar. */

const STRIP: Plan = { x: railX(-1) - 4, y: RAIL_Y + 4, w: 2 * UNIT + 8, d: 4.4, r: 0.8 };
function railTicks() {
  const minor: string[] = [];
  const major: string[] = [];
  const mark: string[] = [];
  for (let step = -10; step <= 10; step++) {
    const x = railX(step / 10);
    const big = step % 5 === 0;
    const line = lineOnTop([x, STRIP.y], [x, STRIP.y + (big ? 3.2 : 1.8)], 0.6, P);
    (step === 8 ? mark : big ? major : minor).push(line);
  }
  return { minor: join(minor), major: join(major), mark: join(mark) };
}
const railScale = railTicks();

/** The stop sits behind the rail, where the carriage's back meets it at the threshold. */
const STOP_X = railX(STOP) - CARRIAGE.w / 2;
const STOP_HOUSING: Plan = { x: STOP_X - 6, y: RAIL.y - 6, w: 6, d: 6, r: 1 };
export const PAWL: Plan = { x: STOP_X - 4.2, y: RAIL.y - 0.2, w: 4.2, d: 2.6, r: 0.5 };

export const RAIL_ART = {
  rail: solid(RAIL, 0, RAIL_H, 3, 0.6),
  railSeam: sideSeam(RAIL, 1.8, P, 3),
  railGroove: lineOnTop([RAIL.x + 3, RAIL_Y], [RAIL.x + RAIL.w - 3, RAIL_Y], RAIL_H, P),
  ends: [RAIL.x - 3.4, RAIL.x + RAIL.w - 0.6].map((x) => solid({ x, y: RAIL.y - 1.6, w: 4, d: RAIL.d + 3.2, r: 1 }, 0, RAIL_H + 3, 3, 0.4)),
  endScrews: dots([RAIL.x - 1.4, RAIL.x + RAIL.w + 1.4].map((x): Plane => [x, RAIL_Y]), RAIL_H + 3),
  strip: solid(STRIP, 0, 0.6, 3),
  scaleMinor: railScale.minor,
  scaleMajor: railScale.major,
  /** The threshold's mark on the scale. */
  scaleMark: railScale.mark,
  stop: solid(STOP_HOUSING, 0, RAIL_H + 1, 3, 0.5),
  stopScrews: dots([[STOP_HOUSING.x + 3, STOP_HOUSING.y + 1.6]], RAIL_H + 1),
};

/** The pawl, built down (flush with the rail top); it lifts by PAWL_UP to stop the carriage. */
export const PAWL_ART = {
  pawl: solid(PAWL, 1, RAIL_H - 0.4, 2, 0.3),
};

/** The sweep bar, built at x = 0 on the rail axis; it moves along x. */
const UPRIGHT: Plan = { x: -3, y: RAIL_Y - 3, w: 6, d: 6, r: 1 };
const BEAM: Plan = { x: -BEAM_HALF, y: RAIL_Y - 3, w: BEAM_HALF * 2, d: CENTER[1] + BEAM_END - (RAIL_Y - 3), r: 1 };
const BLADE: Plan = { x: -BLADE_HALF, y: CENTER[1] - UNIT - 4, w: BLADE_HALF * 2, d: 2 * UNIT + 8, r: 0.4 };
const POINTER: Plan = { x: -1.6, y: CARRIAGE.y + CARRIAGE.d, w: 3.2, d: 4.2, r: 0.6 };

export const BAR_ART = {
  carriage: solid(CARRIAGE, CARRIAGE_Z, CARRIAGE_H, 4, 0.6),
  carriageSeam: sideSeam(CARRIAGE, CARRIAGE_Z + 1.6, P, 4),
  carriageScrews: dots(corners(CARRIAGE, 2.2), CARRIAGE_Z + CARRIAGE_H),
  pointer: solid(POINTER, CARRIAGE_Z, 0.8, 2),
  pointerMark: lineOnTop([0, POINTER.y + 0.6], [0, POINTER.y + POINTER.d], CARRIAGE_Z + 0.8, P),
  knob: round([4.6, CARRIAGE.y + CARRIAGE.d - 3], 2.2, CARRIAGE_Z + CARRIAGE_H, 3, 20, 0.3),
  knobKnurl: knurl(4.6, CARRIAGE.y + CARRIAGE.d - 3, 2.2, CARRIAGE_Z + CARRIAGE_H, CARRIAGE_Z + CARRIAGE_H + 3, 18, P, 0.4),
  upright: solid(UPRIGHT, CARRIAGE_Z + CARRIAGE_H, BEAM_Z + BEAM_H - CARRIAGE_Z - CARRIAGE_H, 3, 0.5),
  uprightSeam: sideSeam(UPRIGHT, BEAM_Z - 1.2, P, 3),
  beam: solid(BEAM, BEAM_Z, BEAM_H, 3, 0.5),
  beamSeam: sideSeam(BEAM, BEAM_Z + 1.4, P, 3),
  beamScrews: dots(
    [RAIL_Y, CENTER[1] - UNIT + 2, CENTER[1], CENTER[1] + UNIT - 2].map((y): Plane => [0, y]),
    BEAM_Z + BEAM_H,
  ),
  blade: solid(BLADE, BLADE_Z, BEAM_Z - BLADE_Z, 2),
  bladeEdge: lineOnTop([0, BLADE.y + 0.6], [0, BLADE.y + BLADE.d - 0.6], BLADE_Z, P),
};

/* Cards, built at the world origin: their underside at z = 0. */

const CARD: Plan = centered(0, 0, CARD_W, CARD_D, 1);
const rule = (from: number, to: number, y: number) => lineOnTop([from, y], [to, y], CARD_T, P);

export const CARD_ART = {
  body: solid(CARD, 0, CARD_T, 3, 0.3),
  /** A document: a few lines of text. */
  docRules: join([rule(-8, 7, -3.6), rule(-8, 8, -1.2), rule(-8, 5, 1.2), rule(-8, 2, 3.6)]),
  /** A query: one short line, and a corner punched to tell it apart. */
  queryRules: rule(-8, 1, 0),
  queryPunch: circle([7.4, -3.6], 1.2, CARD_T, 14),
};
