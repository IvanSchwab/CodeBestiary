import {
  corners,
  cylinder,
  depthOf,
  haloOf,
  insetPlan,
  knurl,
  lineOnTop,
  planOutline,
  pointsAt,
  radialTicks,
  ring,
  sideArc,
  sideSeam,
  slabOf,
  topTicks,
  type Plan,
  type Plane,
  type Point3,
} from "../../iso/iso-kit";
import { BEAM_H, BEAM_Z, COLLAR_H, COLLAR_Z } from "./pose";
import {
  ANVIL,
  ANVIL_BLOCK,
  ARM_R,
  ARM_TAIL,
  BASE,
  BASE_H,
  COLUMN_R,
  COLUMN_TOP,
  DECK,
  DIAL,
  DIAL_FROM,
  DIAL_MARKS,
  DIAL_R,
  DIAL_SWEEP,
  DIAL_TOP,
  FOOT_H,
  HEAD,
  HUB,
  MICRO_AT,
  MICRO_LANE,
  MICRO_PICK,
  MICRO_STAGE,
  P,
  POST,
  POST_TOP,
  RAM_R,
  RAM_UP,
  STACK_AT,
  TASK_AT,
  TASK_LANE,
  TASK_PICK,
  TASK_STAGE,
  TOKEN_H,
  TOKEN_R,
  TRAY,
  TRAY_SLOTS,
  onArm,
} from "./view";

/** Every static path of the dispatcher, computed once at module load. */

const solid = (plan: Plan, z: number, h: number, steps = 6, bevel = 0) => slabOf(plan, z, h, P, steps, bevel);
const round = (at: Plane, r: number, z: number, h: number, steps = 32, bevel = 0) =>
  cylinder(at[0], at[1], r, z, h, P, steps, bevel);
const circle = (at: Plane, r: number, z: number, steps = 40) => ring(at[0], at[1], r, z, P, steps);
const join = (paths: string[]) => paths.join("");
const byDepth = (points: Plane[]) =>
  [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));
const dots = (points: Plane[], z: number) => pointsAt(points.map(([x, y]): Point3 => [x, y, z]), P);

/* Base plate on feet, with a ruler strip and a label plate. */

const LABEL: Plan = { x: -128, y: 60, w: 46, d: 14, r: 1.5 };
const RULER: Plan = { x: TASK_LANE.x, y: TASK_LANE.y + TASK_LANE.d + 3, w: TASK_LANE.w, d: 6, r: 1 };
const rulerTicks = topTicks(RULER.x + 4, RULER.x + RULER.w - 4, 4, 5, RULER.y + 0.8, 0.6, [2, 3.6], P);
const SHORT_RULER: Plan = { x: MICRO_LANE.x, y: MICRO_LANE.y + MICRO_LANE.d + 3, w: MICRO_LANE.w, d: 6, r: 1 };
const shortTicks = topTicks(SHORT_RULER.x + 4, SHORT_RULER.x + SHORT_RULER.w - 4, 4, 5, SHORT_RULER.y + 0.8, 0.6, [2, 3.6], P);

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
  ruler: solid(RULER, 0, 0.6, 3),
  rulerMinor: rulerTicks.minor,
  rulerMajor: rulerTicks.major,
  shortRuler: solid(SHORT_RULER, 0, 0.6, 3),
  shortRulerMinor: shortTicks.minor,
  shortRulerMajor: shortTicks.major,
  label: solid(LABEL, 0, 0.8, 4),
  labelLine: planOutline(insetPlan(LABEL, 1.6), 0.8, P),
  labelRules: join([
    lineOnTop([LABEL.x + 5, LABEL.y + 4.5], [LABEL.x + 30, LABEL.y + 4.5], 0.8, P),
    lineOnTop([LABEL.x + 5, LABEL.y + 7], [LABEL.x + 38, LABEL.y + 7], 0.8, P),
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

/* A roller lane: a bed, rollers across it, a stop at the far end and two seats. */

function laneOf(plan: Plan, seats: Plane[], stop: boolean) {
  // A feeler post on the far edge, beside the pickup seat.
  const feeler: Plane = [seats[0][0], plan.y + 1.9];
  const rollers: string[] = [];
  for (let x = plan.x + 5; x <= plan.x + plan.w - 4; x += 5.5) {
    rollers.push(lineOnTop([x, plan.y], [x, plan.y + plan.d], DECK, P));
  }
  const side = (y: number): Plan => ({ x: plan.x, y, w: plan.w, d: 1.6, r: 0.6 });
  return {
    bed: solid(plan, 0, DECK, 4, 0.5),
    seam: sideSeam(plan, DECK - 2.4, P, 4),
    rollers: join(rollers),
    stop: stop ? solid({ x: plan.x - 4, y: plan.y + 2, w: 4, d: plan.d - 4, r: 1 }, 0, DECK + 5, 3, 0.4) : null,
    stopScrews: stop
      ? dots(
          [
            [plan.x - 2, plan.y + 6],
            [plan.x - 2, plan.y + plan.d - 6],
          ],
          DECK + 5,
        )
      : [],
    feeler: stop ? round(feeler, 1.7, DECK, 7, 14) : null,
    feelerTip: stop ? dots([feeler], DECK + 7) : [],
    seats: join(seats.map((seat) => circle(seat, TOKEN_R + 1.4, DECK, 36))),
    edges: [side(plan.y), side(plan.y + plan.d - 1.6)].map((rail) => planOutline(rail, DECK, P, 2)).join(""),
  };
}

export const TASK_LANE_ART = laneOf(TASK_LANE, [TASK_PICK, TASK_STAGE], true);
export const MICRO_LANE_ART = laneOf(MICRO_LANE, [MICRO_PICK, MICRO_STAGE], true);

/* The deck where units run and leave: the anvil and the tray. */

const TRAY_ART_BASE = laneOf(TRAY, TRAY_SLOTS, false);
export const DECK_ART = {
  anvil: solid(ANVIL_BLOCK, 0, DECK, 5, 0.8),
  anvilSeam: sideSeam(ANVIL_BLOCK, 2.4, P, 5),
  anvilSeat: circle(ANVIL, TOKEN_R + 1.4, DECK, 36),
  anvilScrews: dots(corners(ANVIL_BLOCK, 2.6), DECK),
  tray: TRAY_ART_BASE,
};

/* The hub the arm turns on. */

const hubTicks = radialTicks(HUB[0], HUB[1], 15.2, 36, 3, 4, [1.3, 2.6], P);
const BOLTS = Array.from({ length: 6 }, (_, index): Plane => {
  const angle = (index / 6) * Math.PI * 2 + 0.3;
  return [HUB[0] + 11.6 * Math.cos(angle), HUB[1] + 11.6 * Math.sin(angle)];
});

/** One detent pin per station of the arm: stack, microtasks, tasks. */
const pinAt = (degrees: number) => round(onArm(degrees, 12.9), 1.5, 4, 2.2, 12);

export const HUB_ART = {
  pinsBack: [pinAt(TASK_AT)],
  pinsFront: [pinAt(STACK_AT), pinAt(MICRO_AT)],
  pedestal: round(HUB, 16, 0, 4, 56, 0.6),
  ticksMinor: hubTicks.minor,
  ticksMajor: hubTicks.major,
  bolts: dots(BOLTS, 4),
  boss: round(HUB, 9.2, 4, 4, 40, 0.5),
  column: round(HUB, COLUMN_R, 8, COLUMN_TOP - 8, 24),
  columnSeams: join([sideArc(HUB[0], HUB[1], COLUMN_R, 11, P, 14), sideArc(HUB[0], HUB[1], COLUMN_R, 13, P, 14)]),
  cap: round(HUB, 6.4, COLUMN_TOP, 3, 32, 0.5),
  capKnurl: knurl(HUB[0], HUB[1], 6.4, COLUMN_TOP, COLUMN_TOP + 3, 30, P),
  capRing: circle(HUB, 3, COLUMN_TOP + 3, 20),
};

/* The arm's round parts, built with the arm pointing at the stack (0°), up. */

const TIP: Plane = [HUB[0] + ARM_R, HUB[1]];
const TAIL: Plane = [HUB[0] - ARM_TAIL, HUB[1]];
const BEAM_TOP = BEAM_Z + BEAM_H;

export const ARM_ART = {
  pad: round(TIP, 4.2, DECK + TOKEN_H + 10, 2, 24),
  head: round(TIP, 5, BEAM_Z - 2, BEAM_H + 4, 28, 0.5),
  headSeam: sideArc(TIP[0], TIP[1], 5, BEAM_Z, P, 16),
  headRing: circle(TIP, 3.6, BEAM_TOP + 2, 18),
  headNut: round(TIP, 2.3, BEAM_TOP + 2, 1.6, 6),
  headScrew: dots([TIP], BEAM_TOP + 3.6),
  weight: round(TAIL, 5.6, BEAM_Z - 1.5, BEAM_H + 3, 28, 0.5),
  weightKnurl: knurl(TAIL[0], TAIL[1], 5.6, BEAM_Z - 1.5, BEAM_TOP + 1.5, 26, P),
  collar: round(HUB, 8.4, COLLAR_Z, COLLAR_H, 36, 0.5),
  collarSeam: sideArc(HUB[0], HUB[1], 8.4, COLLAR_Z + 2, P, 20),
};

/* The press. The head is built up and moved down by the stroke. */

const POST_FOOT: Plan = { x: POST.x - 4, y: POST.y - 3, w: POST.w + 8, d: POST.d + 6, r: 2 };
const POST_CAP: Plan = { x: POST.x - 1.2, y: POST.y - 1.2, w: POST.w + 2.4, d: POST.d + 2.4, r: 1.6 };
const HEAD_Z = RAM_UP + 5;
const HEAD_H = 11;
const HEAD_TOP = HEAD_Z + HEAD_H;
const KNOB: Plane = [ANVIL[0], -24];

export const PRESS_ART = {
  foot: solid(POST_FOOT, 0, 3, 4, 0.5),
  footScrews: dots(
    [
      [POST_FOOT.x + 2.2, POST_FOOT.y + POST_FOOT.d - 2.2],
      [POST_FOOT.x + POST_FOOT.w - 2.2, POST_FOOT.y + POST_FOOT.d - 2.2],
    ],
    3,
  ),
  post: solid(POST, 3, POST_TOP - 3, 3, 0.4),
  postSeams: join([sideSeam(POST, 7, P, 3), sideSeam(POST, POST_TOP - 4, P, 3)]),
  postCap: solid(POST_CAP, POST_TOP, 2.6, 3, 0.4),
  brace: solid({ x: POST.x + 1.2, y: POST.y + POST.d, w: POST.w - 2.4, d: 4.6, r: 0.8 }, 3, 9, 3, 0.3),
  braceScrew: dots([[POST.x + POST.w / 2, POST.y + POST.d + 2.3]], 12),
  ram: round(ANVIL, RAM_R, RAM_UP, 5, 32, 0.5),
  ramSeam: sideArc(ANVIL[0], ANVIL[1], RAM_R, RAM_UP + 1.6, P, 18),
  head: solid(HEAD, HEAD_Z, HEAD_H, 5, 0.8),
  headSeam: sideSeam(HEAD, HEAD_Z + 3, P, 5),
  headInset: planOutline(insetPlan(HEAD, 2.4), HEAD_TOP, P, 5),
  headScrews: dots(corners(HEAD, 4.6), HEAD_TOP),
  boss: circle(ANVIL, 5.2, HEAD_TOP, 24),
  bossDot: dots([ANVIL], HEAD_TOP),
  knob: round(KNOB, 4.6, HEAD_TOP, 5, 28, 0.5),
  knobKnurl: knurl(KNOB[0], KNOB[1], 4.6, HEAD_TOP, HEAD_TOP + 5, 26, P),
  knobPointer: lineOnTop([KNOB[0] - 2.4, KNOB[1]], [KNOB[0] + 3.4, KNOB[1]], HEAD_TOP + 5, P),
};

/* The counter: a dial gauge, face up, with one major mark per printed line. */

const DIAL_STAND: Plan = { x: DIAL[0] - 13, y: DIAL[1] - 13, w: 26, d: 26, r: 3 };
const RAD = Math.PI / 180;

function dialMarks() {
  const minor: string[] = [];
  const major: string[] = [];
  const rim = DIAL_R - 3;
  const per = 4;
  for (let index = 0; index <= DIAL_MARKS * per; index++) {
    const angle = (DIAL_FROM + (index / (DIAL_MARKS * per)) * DIAL_SWEEP) * RAD;
    const big = index % per === 0;
    const inner = rim - (big ? 3 : 1.4);
    (big ? major : minor).push(
      lineOnTop(
        [DIAL[0] + inner * Math.cos(angle), DIAL[1] + inner * Math.sin(angle)],
        [DIAL[0] + rim * Math.cos(angle), DIAL[1] + rim * Math.sin(angle)],
        DIAL_TOP,
        P,
      ),
    );
  }
  return { minor: join(minor), major: join(major) };
}

const marks = dialMarks();

export const DIAL_ART = {
  stand: solid(DIAL_STAND, 0, 3, 5, 0.5),
  standScrews: dots(corners(DIAL_STAND, 3), 3),
  puck: round(DIAL, DIAL_R, 3, DIAL_TOP - 3, 64, 0.8),
  band: knurl(DIAL[0], DIAL[1], DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 84, P, 0.3),
  bandSeam: sideArc(DIAL[0], DIAL[1], DIAL_R, DIAL_TOP - 3.4, P, 40),
  bezel: circle(DIAL, DIAL_R - 3, DIAL_TOP, 64),
  marksMinor: marks.minor,
  marksMajor: marks.major,
  hub: circle(DIAL, 1.6, DIAL_TOP, 16),
  crown: solid({ x: DIAL[0] + DIAL_R - 0.6, y: DIAL[1] - 2.2, w: 4.6, d: 4.4, r: 1 }, 5, 4, 3, 0.3),
};

/* Tokens, built at the world origin and moved into place. */

const SQUARE: Plan = { x: -7, y: -7, w: 14, d: 14, r: 2.4 };

export const TOKEN_ART = {
  /** Tasks are round. */
  round: round([0, 0], TOKEN_R, 0, TOKEN_H, 36, 0.6),
  roundRing: circle([0, 0], 5, TOKEN_H, 28),
  /** The script carries a second ring, the timer callback a dot. */
  scriptRing: circle([0, 0], 2.4, TOKEN_H, 18),
  timeoutDot: dots([[0, 0]], TOKEN_H),
  /** The microtask is square. */
  square: solid(SQUARE, 0, TOKEN_H, 4, 0.6),
  squareInset: planOutline(insetPlan(SQUARE, 2.6), TOKEN_H, P, 4),
  squareDot: dots([[0, 0]], TOKEN_H),
};
