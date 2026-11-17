import {
  corners,
  cylinder,
  depthOf,
  dotGrid,
  haloOf,
  insetPlan,
  knurl,
  lineOnTop,
  planOutline,
  pointsAt,
  ring,
  sideArc,
  sideSeam,
  slabOf,
  topTicks,
  type Plan,
  type Plane,
  type Point3,
} from "../../iso/iso-kit";
import {
  BAR_H,
  BAR_W,
  BASE,
  BASE_H,
  BED_H,
  BELL,
  BELL_R,
  COUNT_BED,
  COUNT_MARKS,
  COUNT_PITCH,
  COUNT_ROD_END,
  COUNT_ZERO,
  DOUBLE_D,
  DOUBLE_DECK,
  DOUBLE_DECK_H,
  DOUBLE_MARKS,
  DOUBLE_PITCH,
  DOUBLE_TOP,
  DOUBLE_Y,
  DOUBLE_ZERO,
  EFFECT_D,
  EFFECT_DECK,
  EFFECT_DECK_H,
  EFFECT_MOUTH,
  EFFECT_TOP,
  EFFECT_Y,
  EYE,
  FLAG,
  FLAG_COLLAR_H,
  FOOT_H,
  HIGH_TOP,
  HIGH_Z,
  LANE_A,
  LANE_B,
  LEG_H,
  LOW_Z,
  P,
  PIN_Y_DOUBLE,
  PIN_Y_EFFECT,
  SHOW_BED,
  SHOW_FALSE,
  SHOW_ROD_END,
  SHOW_TRUE,
  STRIKE,
} from "./view";

/** Every static path of the relay, computed once at module load. */

const solid = (plan: Plan, z: number, h: number, steps = 4, bevel = 0) => slabOf(plan, z, h, P, steps, bevel);
const round = (at: Plane, r: number, z: number, h: number, steps = 32, bevel = 0) =>
  cylinder(at[0], at[1], r, z, h, P, steps, bevel);
const circle = (at: Plane, r: number, z: number, steps = 40) => ring(at[0], at[1], r, z, P, steps);
const join = (paths: string[]) => paths.join("");
const byDepth = (points: Plane[]) =>
  [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));
const dots = (points: Plane[], z: number) => pointsAt(points.map(([x, y]): Point3 => [x, y, z]), P);

/* Base plate on feet, with a label plate. */

const LABEL: Plan = { x: 2, y: 122, w: 46, d: 14, r: 1.5 };
/** A bench rule down the middle, to set the rods' travel against. */
const RULE: Plan = { x: -4, y: -56, w: 8, d: 156, r: 1 };
const ruleTicks = topTicks(RULE.y + 4, RULE.y + RULE.d - 4, 4, 5, RULE.x + 0.8, 0.6, [2, 3.6], P, "y");

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
  rule: solid(RULE, 0, 0.6, 3),
  ruleMinor: ruleTicks.minor,
  ruleMajor: ruleTicks.major,
  label: solid(LABEL, 0, 0.8, 4),
  labelLine: planOutline(insetPlan(LABEL, 1.6), 0.8, P),
  labelRules: join([
    lineOnTop([LABEL.x + 5, LABEL.y + 4.5], [LABEL.x + 30, LABEL.y + 4.5], 0.8, P),
    lineOnTop([LABEL.x + 5, LABEL.y + 7], [LABEL.x + 36, LABEL.y + 7], 0.8, P),
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

/* Shared pieces. */

const HALF = BAR_W / 2;

/** A flat bar along y, centred on a lane. */
const barOf = (lane: number, from: number, to: number, z: number, r = 1.2) =>
  solid({ x: lane - HALF, y: from, w: BAR_W, d: to - from, r }, z, BAR_H, 4, 0.4);

/** The way a tongue slides on. */
function wayOf(lane: number, from: number, to: number) {
  const plan: Plan = { x: lane - 6, y: from, w: 12, d: to - from, r: 1.5 };
  return { slab: solid(plan, 0, LOW_Z, 3, 0.4), seam: sideSeam(plan, 2.4, P, 3) };
}

/** A guide: a saddle under a high rod and a wall on each side of it. */
function guideOf(lane: number, from: number, to: number, z: number) {
  const d = to - from;
  const back: Plan = { x: lane - 8, y: from, w: 4, d, r: 0.8 };
  const front: Plan = { x: lane + 4, y: from, w: 4, d, r: 0.8 };
  const wallH = HIGH_TOP + 1.5 - HIGH_Z;
  return {
    saddle: solid({ x: lane - 8, y: from, w: 16, d, r: 1 }, z, HIGH_Z - z, 3, 0.3),
    back: solid(back, HIGH_Z, wallH, 2, 0.3),
    front: solid(front, HIGH_Z, wallH, 2, 0.3),
    screws: dots(
      [
        [lane + 6, from + 2.2],
        [lane + 6, to - 2.2],
      ],
      HIGH_Z + wallH,
    ),
  };
}

/** A rod's eye: the slot its pin drops through, and two rivets behind it. */
function eyeOf(lane: number, pin: number) {
  return {
    slot: planOutline({ x: lane - 1.3, y: pin - 2.6, w: 2.6, d: 7.8, r: 1.3 }, HIGH_TOP, P, 4),
    rivets: dots(
      [
        [lane - 1.8, pin + 9],
        [lane + 1.8, pin + 9],
      ],
      HIGH_TOP,
    ),
  };
}

/** A drop pin's head, built down on its rod. The stem is drawn live. */
function pinOf(at: Plane) {
  return {
    head: round(at, 2.9, HIGH_TOP, 3, 20, 0.4),
    knurl: knurl(at[0], at[1], 2.9, HIGH_TOP, HIGH_TOP + 3, 18, P),
    cap: circle(at, 1.3, HIGH_TOP + 3, 12),
  };
}

/** A push grip standing on the near end of a rod. */
function gripOf(lane: number, y: number) {
  const at: Plane = [lane, y];
  return {
    flange: round(at, 4.3, HIGH_TOP, 1.2, 24),
    grip: round(at, 3.5, HIGH_TOP + 1.2, 6.4, 24, 0.5),
    knurl: knurl(lane, y, 3.5, HIGH_TOP + 1.2, HIGH_TOP + 7.6, 22, P),
    pointer: lineOnTop([lane, y + 2.4], [lane, y - 3.3], HIGH_TOP + 7.6, P),
  };
}

/** A scale strip along y with a mark every `pitch`, and a cursor built at its zero. */
function scaleOf(strip: Plan, z: number, marks: number[], minors: number[], zero: number) {
  const top = z + 0.8;
  const edge = strip.x + 0.7;
  const tick = (y: number, length: number) => lineOnTop([edge, y], [edge + length, y], top, P);
  const cursor: Plan = { x: strip.x - 1.6, y: zero - 2, w: strip.w + 3.2, d: 4, r: 1 };
  return {
    strip: solid(strip, z, 0.8, 3),
    major: join(marks.map((y) => tick(y, 3.8))),
    minor: join(minors.map((y) => tick(y, 2.2))),
    cursor: solid(cursor, top, 3.2, 3, 0.4),
    cursorLine: lineOnTop([cursor.x, zero], [cursor.x + cursor.w, zero], top + 3.2, P),
  };
}

/* The effect: a bell housing on three legs, with a tunnel over each lane. */

const LEG = (x: number, w: number): Plan => ({ x, y: EFFECT_Y, w, d: EFFECT_D, r: 1.5 });
const LEG_L = LEG(-54, 8);
const LEG_M = LEG(-22, 44);
const LEG_R = LEG(46, 8);
const TONGUE_FROM = EFFECT_Y + 8;
const TONGUE_TO = PIN_Y_EFFECT + 9;
const GRILLE: Plan = { x: -48, y: -96, w: 26, d: 22, r: 2 };
const STRIKER_BLOCK: Plan = { x: BELL[0] + BELL_R + STRIKE + 13, y: BELL[1] - 7, w: 16, d: 14, r: 2 };
const STRIKER_HEAD: Plane = [BELL[0] + BELL_R + STRIKE + 2.5, BELL[1]];
const BELL_BOLTS = Array.from({ length: 8 }, (_, index): Plane => {
  const angle = (index / 8) * Math.PI * 2 + 0.2;
  return [BELL[0] + (BELL_R + 0.9) * Math.cos(angle), BELL[1] + (BELL_R + 0.9) * Math.sin(angle)];
}).filter(([x, y]) => x - BELL[0] + (y - BELL[1]) > -6);

const legOf = (plan: Plan) => ({ slab: solid(plan, 0, LEG_H, 3, 0.4), seam: sideSeam(plan, 2.4, P, 3) });

export const EFFECT_ART = {
  legL: legOf(LEG_L),
  legM: legOf(LEG_M),
  legR: legOf(LEG_R),
  wayA: wayOf(LANE_A, EFFECT_Y + 4, TONGUE_TO + 2),
  wayB: wayOf(LANE_B, EFFECT_Y + 4, TONGUE_TO + 2),
  tongueA: barOf(LANE_A, TONGUE_FROM, TONGUE_TO, LOW_Z, 3),
  tongueB: barOf(LANE_B, TONGUE_FROM, TONGUE_TO, LOW_Z, 3),
  mouthScrews: dots(
    [
      [LEG_M.x + 4, EFFECT_MOUTH],
      [LEG_M.x + LEG_M.w - 4, EFFECT_MOUTH],
    ],
    LEG_H - 4,
  ),
  deck: solid(EFFECT_DECK, LEG_H, EFFECT_DECK_H, 5, 1),
  deckSeam: sideSeam(EFFECT_DECK, LEG_H + 2.2, P, 5),
  deckInset: planOutline(insetPlan(EFFECT_DECK, 3), EFFECT_TOP, P, 5),
  deckScrews: dots(corners(EFFECT_DECK, 6), EFFECT_TOP),
  grille: planOutline(GRILLE, EFFECT_TOP, P, 4),
  grilleDots: dotGrid(GRILLE.x + 4, GRILLE.y + 4, 4, 3, 6, EFFECT_TOP, P),
  bellFlange: round(BELL, BELL_R + 2, EFFECT_TOP, 1.5, 56),
  bellBolts: dots(BELL_BOLTS, EFFECT_TOP + 1.5),
  bellBody: round(BELL, BELL_R, EFFECT_TOP + 1.5, 6.5, 56, 0.8),
  bellSeam: sideArc(BELL[0], BELL[1], BELL_R, EFFECT_TOP + 3.2, P, 36),
  bellShoulder: round(BELL, BELL_R - 3, EFFECT_TOP + 8, 3, 48, 0.6),
  bellCrown: round(BELL, 6.5, EFFECT_TOP + 11, 2, 36, 0.5),
  bellNut: round(BELL, 2.4, EFFECT_TOP + 13, 2, 6),
  bellNutDot: dots([BELL], EFFECT_TOP + 15),
  strikerHead: round(STRIKER_HEAD, 2.5, EFFECT_TOP + 2, 5.5, 18, 0.4),
  strikerShaft: solid({ x: STRIKER_HEAD[0] + 2, y: BELL[1] - 1.1, w: 14.6, d: 2.2, r: 0.6 }, EFFECT_TOP + 3.6, 2.2, 2),
  strikerBlock: solid(STRIKER_BLOCK, EFFECT_TOP, 9, 4, 0.6),
  strikerSeam: sideSeam(STRIKER_BLOCK, EFFECT_TOP + 2.4, P, 4),
  strikerInset: planOutline(insetPlan(STRIKER_BLOCK, 2.2), EFFECT_TOP + 9, P, 4),
  strikerScrews: dots(
    [
      [STRIKER_BLOCK.x + 4.4, STRIKER_BLOCK.y + 7],
      [STRIKER_BLOCK.x + STRIKER_BLOCK.w - 4.4, STRIKER_BLOCK.y + 7],
    ],
    EFFECT_TOP + 9,
  ),
};

/* Lane A: the computed. A slider runs under its housing: a tongue toward
   count, and a rod on to the bell housing. */

const DOUBLE_LEG = (x: number): Plan => ({ x, y: DOUBLE_Y, w: 7, d: DOUBLE_D, r: 1.5 });
const DOUBLE_SCALE: Plan = { x: -27.5, y: DOUBLE_ZERO - DOUBLE_MARKS * DOUBLE_PITCH - 4, w: 7, d: DOUBLE_MARKS * DOUBLE_PITCH + 8, r: 1 };
const marksOf = (zero: number, pitch: number, count: number, every: number) => {
  const major: number[] = [];
  const minor: number[] = [];
  for (let index = 0; index <= count; index++) (index % every ? minor : major).push(zero - index * pitch);
  return { major, minor };
};
const doubleMarks = marksOf(DOUBLE_ZERO, DOUBLE_PITCH, DOUBLE_MARKS, 2);
const DOUBLE_PLATE: Plan = { x: -52, y: 30, w: 21, d: 12, r: 1.2 };

export const DOUBLE_ART = {
  guide: guideOf(LANE_A, -16, -8, 0),
  legBack: legOf(DOUBLE_LEG(-56)),
  legFront: legOf(DOUBLE_LEG(-19)),
  way: wayOf(LANE_A, DOUBLE_Y + 4, PIN_Y_DOUBLE + 11),
  /** The slider, built at rest: the low tongue and the high rod, joined inside the housing. */
  tongue: barOf(LANE_A, DOUBLE_Y + 10, PIN_Y_DOUBLE + 9, LOW_Z, 3),
  rod: barOf(LANE_A, PIN_Y_EFFECT - EYE, DOUBLE_Y + 26, HIGH_Z),
  eye: eyeOf(LANE_A, PIN_Y_EFFECT),
  deck: solid(DOUBLE_DECK, LEG_H, DOUBLE_DECK_H, 5, 1),
  deckSeam: sideSeam(DOUBLE_DECK, LEG_H + 2.2, P, 5),
  deckInset: planOutline(insetPlan(DOUBLE_DECK, 3), DOUBLE_TOP, P, 5),
  deckScrews: dots(corners(DOUBLE_DECK, 5.5), DOUBLE_TOP),
  plate: solid(DOUBLE_PLATE, DOUBLE_TOP, 0.7, 3),
  plateRules: join([
    lineOnTop([DOUBLE_PLATE.x + 3, DOUBLE_PLATE.y + 4], [DOUBLE_PLATE.x + 16, DOUBLE_PLATE.y + 4], DOUBLE_TOP + 0.7, P),
    lineOnTop([DOUBLE_PLATE.x + 3, DOUBLE_PLATE.y + 7.5], [DOUBLE_PLATE.x + 11, DOUBLE_PLATE.y + 7.5], DOUBLE_TOP + 0.7, P),
  ]),
  flagCollar: round(FLAG, 3.3, DOUBLE_TOP, FLAG_COLLAR_H, 20, 0.4),
  flagSeat: circle(FLAG, 5.2, DOUBLE_TOP, 24),
  /** The flag, built down on its collar. */
  flag: round(FLAG, 5, DOUBLE_TOP + FLAG_COLLAR_H, 1.8, 28, 0.5),
  flagRing: circle(FLAG, 3, DOUBLE_TOP + FLAG_COLLAR_H + 1.8, 20),
  flagDot: dots([FLAG], DOUBLE_TOP + FLAG_COLLAR_H + 1.8),
  scale: scaleOf(DOUBLE_SCALE, DOUBLE_TOP, doubleMarks.major, doubleMarks.minor, DOUBLE_ZERO),
};

/* Sources: count on lane A, show on lane B. */

function sourceOf(lane: number, bed: Plan, pin: number, rodEnd: number, scale: ReturnType<typeof scaleOf>) {
  return {
    bed: solid(bed, 0, BED_H, 5, 0.8),
    bedSeam: sideSeam(bed, 2.2, P, 5),
    bedInset: planOutline(insetPlan(bed, 2.6), BED_H, P, 5),
    bedScrews: dots(corners(bed, 5), BED_H),
    guide: guideOf(lane, bed.y + 6, bed.y + 24, BED_H),
    /** The rod, built at rest, with its eye and its grip. */
    rod: barOf(lane, pin - EYE, rodEnd, HIGH_Z),
    eye: eyeOf(lane, pin),
    grip: gripOf(lane, rodEnd - 4.5),
    scale,
  };
}

const COUNT_SCALE: Plan = { x: -22.5, y: COUNT_ZERO - COUNT_MARKS * COUNT_PITCH - 4, w: 7, d: COUNT_MARKS * COUNT_PITCH + 8, r: 1 };
const countMarks = marksOf(COUNT_ZERO, COUNT_PITCH / 2, COUNT_MARKS * 2, 2);
const SHOW_SCALE: Plan = { x: 45.5, y: SHOW_TRUE - 4, w: 7, d: SHOW_FALSE - SHOW_TRUE + 8, r: 1 };

export const COUNT_ART = sourceOf(
  LANE_A,
  COUNT_BED,
  PIN_Y_DOUBLE,
  COUNT_ROD_END,
  scaleOf(COUNT_SCALE, BED_H, countMarks.major, countMarks.minor, COUNT_ZERO),
);

export const SHOW_ART = {
  ...sourceOf(LANE_B, SHOW_BED, PIN_Y_EFFECT, SHOW_ROD_END, scaleOf(SHOW_SCALE, BED_H, [SHOW_TRUE, SHOW_FALSE], [], SHOW_TRUE)),
  midGuide: guideOf(LANE_B, -4, 4, 0),
};

/* Drop pins. */

export const PIN_ART = {
  "effect:double": pinOf([LANE_A, PIN_Y_EFFECT]),
  "effect:show": pinOf([LANE_B, PIN_Y_EFFECT]),
  "double:count": pinOf([LANE_A, PIN_Y_DOUBLE]),
};
