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
  sideRing,
  sideSeam,
  slabOf,
  topTicks,
  type Flat,
  type Plan,
  type Plane,
  type Point3,
} from "../../iso/iso-kit";
import {
  ATT_X,
  BACKSTOP,
  BACKSTOP_H,
  BAR,
  BAR_DROP,
  BAR_T,
  BASE,
  BASE_H,
  BIN,
  BIN_FLOOR,
  BIN_H,
  BIN_WALL,
  CAB,
  CAB_FACE_X,
  CAB_FRONT_Y,
  CAB_H,
  CAB_SEAL,
  CARD_INNER,
  CARD_L,
  CARD_T,
  CARD_W,
  CARD_Y,
  CHUTE,
  DECK,
  DIAL,
  DIAL_R,
  DIAL_TOP,
  DRAWER,
  DRAWER_PANEL,
  FLAG_H,
  FLAG_T,
  FLAG_W,
  FLAG_X,
  FLAG_Y,
  FOOT_H,
  HOOD,
  HOOD_H,
  LIP_H,
  LIP_W,
  LOCK,
  LOCK_FRONT_Y,
  LOCK_H,
  LOCK_SEAL,
  P,
  PLINTH_H,
  RACK,
  RACK_H,
  RACK_TOP,
  SEAL_R,
  SEAT_X,
  SLOT_H,
  STUB_H,
  STUB_T,
  STUB_W,
  STUB_X,
  STUB_Y,
  TAG_INNER,
  TAG_L,
  TAG_T,
  TAG_W,
  TAG_Y,
  THROAT,
  THROAT_H,
  TRAY,
  UPRIGHTS,
  UPRIGHT_TOP,
  onDial,
} from "./view";

/** Every static path of the bench, computed once at module load. */

const solid = (plan: Plan, z: number, h: number, steps = 4, bevel = 0) => slabOf(plan, z, h, P, steps, bevel);
const round = (at: Plane, r: number, z: number, h: number, steps = 32, bevel = 0) =>
  cylinder(at[0], at[1], r, z, h, P, steps, bevel);
const circle = (at: Plane, r: number, z: number, steps = 40) => ring(at[0], at[1], r, z, P, steps);
const join = (paths: string[]) => paths.join("");
const dots = (points: Plane[], z: number) => pointsAt(points.map(([x, y]): Point3 => [x, y, z]), P);
const byDepth = (points: Plane[]) =>
  [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));

/** Convex hull of screen points, as a closed path. */
function hullPath(points: Flat[]): string {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: Flat[]) => {
    const out: Flat[] = [];
    for (const point of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], point) <= 0) out.pop();
      out.push(point);
    }
    out.pop();
    return out;
  };
  return pathOf([...half(sorted), ...half(sorted.reverse())], true);
}

/** The projected hull of a world box: what shows of a part in front of a face. */
const boxHull = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  hullPath(
    pointsAt(
      [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [z0, z1].map((z): Point3 => [x, y, z]))),
      P,
    ),
  );

/**
 * A closed rounded rectangle drawn in a vertical face: normal "x" puts it in
 * the plane x = at (a runs along y), normal "y" in the plane y = at (a along x).
 */
function faceRect(normal: "x" | "y", at: number, a0: number, a1: number, z0: number, z1: number, r = 0.6): string {
  const points: [number, number][] = [];
  const arc = (ca: number, cz: number, from: number) => {
    for (let i = 0; i <= 4; i++) {
      const angle = from + (i / 4) * (Math.PI / 2);
      points.push([ca + r * Math.cos(angle), cz + r * Math.sin(angle)]);
    }
  };
  arc(a1 - r, z1 - r, 0);
  arc(a0 + r, z1 - r, Math.PI / 2);
  arc(a0 + r, z0 + r, Math.PI);
  arc(a1 - r, z0 + r, (3 * Math.PI) / 2);
  return pathOf(
    pointsAt(
      points.map(([a, z]): Point3 => (normal === "x" ? [at, a, z] : [a, at, z])),
      P,
    ),
    true,
  );
}

/** Pips that number a token or a slot, like the faces of a die. */
const PIP = 1.3;
const PIPS: Plane[][] = [
  [[0, 0]],
  [
    [-PIP, -PIP],
    [PIP, PIP],
  ],
  [
    [-PIP, -PIP],
    [0, 0],
    [PIP, PIP],
  ],
  [
    [-PIP, -PIP],
    [-PIP, PIP],
    [PIP, -PIP],
    [PIP, PIP],
  ],
];
/** Pips in a row, for faces that stand upright. */
const pipRow = (count: number, pitch: number) =>
  Array.from({ length: count }, (_, index) => (index - (count - 1) / 2) * pitch);

/* Base plate on feet, with a ruler strip and a label plate. */

const LABEL: Plan = { x: BASE.x + 6, y: 45, w: 26, d: 14, r: 1.5 };
const RULER: Plan = { x: -84, y: 57.5, w: 180, d: 6, r: 1 };
const rulerTicks = topTicks(RULER.x + 4, RULER.x + RULER.w - 4, 4, 5, RULER.y + 0.8, 0.6, [2, 3.6], P);

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
  label: solid(LABEL, 0, 0.8, 4),
  labelLine: planOutline(insetPlan(LABEL, 1.6), 0.8, P),
  labelRules: join([
    lineOnTop([LABEL.x + 5, LABEL.y + 4.5], [LABEL.x + 19, LABEL.y + 4.5], 0.8, P),
    lineOnTop([LABEL.x + 5, LABEL.y + 7], [LABEL.x + 23, LABEL.y + 7], 0.8, P),
    lineOnTop([LABEL.x + 5, LABEL.y + 9.5], [LABEL.x + 14, LABEL.y + 9.5], 0.8, P),
  ]),
  labelScrews: dots(
    [
      [LABEL.x + 2.6, LABEL.y + 7],
      [LABEL.x + LABEL.w - 2.6, LABEL.y + 7],
    ],
    0.8,
  ),
};

/* The issuing cabinet: the auth server. */

const slotOnFace = (y: number, inner: number) => ({
  opening: faceRect("x", CAB_FACE_X, y - inner / 2, y + inner / 2, DECK, DECK + SLOT_H, 0.5),
  frame: faceRect("x", CAB_FACE_X, y - inner / 2 - 2.6, y + inner / 2 + 2.6, DECK - 0.01, DECK + SLOT_H + 2.4, 1),
});

const VENTS = [15, 18.2, 21.4].map((z) =>
  faceRect("y", CAB_FRONT_Y, CAB.x + 8, CAB.x + 30, z, z + 1.4, 0.7),
);

export const CABINET_ART = {
  plinth: solid(insetPlan(CAB, 2), 0, PLINTH_H, 4),
  body: solid(CAB, PLINTH_H, CAB_H - PLINTH_H, 4, 1),
  seams: join([sideSeam(CAB, 12.4, P, 4), sideSeam(CAB, CAB_H - 4.4, P, 4)]),
  slots: [slotOnFace(TAG_Y, TAG_INNER), slotOnFace(CARD_Y, CARD_INNER)],
  frontSlot: {
    opening: faceRect("y", CAB_FRONT_Y, ATT_X - TAG_INNER / 2, ATT_X + TAG_INNER / 2, DECK, DECK + SLOT_H, 0.5),
    frame: faceRect("y", CAB_FRONT_Y, ATT_X - TAG_INNER / 2 - 2.6, ATT_X + TAG_INNER / 2 + 2.6, DECK - 0.01, DECK + SLOT_H + 2.4, 1),
  },
  vents: join(VENTS),
  inset: planOutline(insetPlan(CAB, 3.4), CAB_H, P, 4),
  screws: dots(corners(CAB, 6.4), CAB_H),
};

/* The ledger rack, its stubs, the uprights and the family bar. */

const SLOT_PLANS = STUB_X.map(
  (x): Plan => ({ x: x - STUB_W / 2 - 0.7, y: STUB_Y - STUB_T / 2 - 0.7, w: STUB_W + 1.4, d: STUB_T + 1.4, r: 0.6 }),
);

export const RACK_ART = {
  block: solid(RACK, CAB_H, RACK_H, 3, 0.5),
  seam: sideSeam(RACK, CAB_H + 1.6, P, 3),
  slots: SLOT_PLANS.map((plan) => planOutline(plan, RACK_TOP, P, 2)),
  /** The rack's front numbers its slots, one pip per refresh token in issue order. */
  pipDots: STUB_X.flatMap((x, slot) =>
    pointsAt(
      pipRow(slot + 1, 1.7).map((dx): Point3 => [x + dx, RACK.y + RACK.d, CAB_H + RACK_H / 2 + 0.4]),
      P,
    ),
  ),
  screws: dots(
    [
      [RACK.x + 2, STUB_Y],
      [RACK.x + RACK.w - 2, STUB_Y],
    ],
    RACK_TOP,
  ),
};

const UPRIGHT_SLOT = faceRect(
  "x",
  UPRIGHTS[0].x + UPRIGHTS[0].w,
  STUB_Y - 1,
  STUB_Y + 1,
  RACK_TOP + 0.6,
  UPRIGHT_TOP - 2.4,
  1,
);

export const UPRIGHT_ART = UPRIGHTS.map((plan, index) => ({
  post: solid(plan, CAB_H, UPRIGHT_TOP - CAB_H, 2, 0.4),
  seam: sideSeam(plan, UPRIGHT_TOP - 3, P, 2),
  /** The guide slot the bar rides in, on the face that shows. */
  slot: index === 0 ? UPRIGHT_SLOT : "",
  cap: dots([[plan.x + plan.w / 2, plan.y + plan.d / 2]], UPRIGHT_TOP),
  capRing: circle([plan.x + plan.w / 2, plan.y + plan.d / 2], 1.3, UPRIGHT_TOP, 14),
}));

/** The bar, built at rest, above the stubs. */
const BAR_Z = RACK_TOP + BAR_DROP;
export const BAR_ART = {
  bar: solid(BAR, BAR_Z, BAR_T, 2, 0.4),
  grip: round([BAR.x + BAR.w / 2, STUB_Y], 2.2, BAR_Z + BAR_T, 2.6, 20, 0.3),
  gripKnurl: knurl(BAR.x + BAR.w / 2, STUB_Y, 2.2, BAR_Z + BAR_T, BAR_Z + BAR_T + 2.6, 18, P, 0.3),
  screws: dots(
    [
      [BAR.x + 4, STUB_Y],
      [BAR.x + BAR.w - 4, STUB_Y],
    ],
    BAR_Z + BAR_T,
  ),
};

/** One stub per slot, built standing at full height. */
export const STUB_ART = STUB_X.map((x, slot) => {
  const plan: Plan = { x: x - STUB_W / 2, y: STUB_Y - STUB_T / 2, w: STUB_W, d: STUB_T, r: 0.4 };
  const top = RACK_TOP + STUB_H;
  const face = STUB_Y + STUB_T / 2;
  return {
    body: solid(plan, RACK_TOP, STUB_H, 2, 0.3),
    hole: sideRing([x + 1.8, face, top - 3], 1.1, "y", P, 20),
    pips: pointsAt(
      pipRow(slot + 1, 1.5).map((dx): Point3 => [x - 1.6 + dx * 0.9, face, top - 3]),
      P,
    ),
    /** Everything the stub can show: the space above its slot. */
    clip: boxHull(x - STUB_W / 2 - 0.6, x + STUB_W / 2 + 0.6, STUB_Y - 1.4, STUB_Y + 1.4, RACK_TOP, top + 1),
  };
});

export const CAB_SEAL_ART = sealOf(CAB_SEAL, CAB_H);

function sealOf(at: Plane, z: number) {
  return {
    boss: round(at, SEAL_R, z, 2.2, 40, 0.5),
    face: circle(at, SEAL_R - 1.4, z + 2.2, 36),
    mark: circle(at, 1.4, z + 2.2, 16),
    dot: dots([at], z + 2.2),
  };
}

/* Lanes: a bed with two lips. Along x for the client's lanes, along y for the chute. */

function laneAlongX(x0: number, x1: number, y: number, inner: number) {
  const bed: Plan = { x: x0, y: y - inner / 2 - LIP_W, w: x1 - x0, d: inner + LIP_W * 2, r: 0 };
  const lip = (y0: number): Plan => ({ x: x0, y: y0, w: x1 - x0, d: LIP_W, r: 0.3 });
  return {
    bed: solid(bed, 0, DECK, 1, 0.4),
    lips: [lip(bed.y), lip(y + inner / 2)].map((plan) => solid(plan, DECK, LIP_H, 1)),
    groove: lineOnTop([x0, y], [x1, y], DECK, P),
  };
}

export const LANE_ART = {
  tag: laneAlongX(CAB_FACE_X, TRAY.x, TAG_Y, TAG_INNER),
  card: laneAlongX(CAB_FACE_X, TRAY.x, CARD_Y, CARD_INNER),
  reader: laneAlongX(TRAY.x + TRAY.w, LOCK.x, CARD_Y, CARD_INNER),
};

const lip = (x0: number): Plan => ({ x: x0, y: CHUTE.y, w: LIP_W, d: CHUTE.d, r: 0.3 });
export const CHUTE_ART = {
  bed: solid(CHUTE, 0, DECK, 1, 0.4),
  lips: [lip(CHUTE.x), lip(CHUTE.x + CHUTE.w - LIP_W)].map((plan) => solid(plan, DECK, LIP_H, 1)),
  groove: lineOnTop([ATT_X, CHUTE.y], [ATT_X, CHUTE.y + CHUTE.d], DECK, P),
};

/* The hood the stolen copy comes out of. */

export const HOOD_ART = {
  body: solid(HOOD, 0, HOOD_H, 5, 0.8),
  seams: join([sideSeam(HOOD, DECK, P, 5), sideSeam(HOOD, HOOD_H - 3.6, P, 5)]),
  inset: planOutline(insetPlan(HOOD, 3), HOOD_H, P, 5),
  /** A bolted hatch on top: the way in from outside the bench. */
  hatch: planOutline({ x: HOOD.x + 5, y: HOOD.y + 4, w: HOOD.w - 10, d: HOOD.d - 8, r: 1.4 }, HOOD_H, P, 3),
  hatchBolts: dots(
    [
      [HOOD.x + 7, HOOD.y + HOOD.d / 2],
      [HOOD.x + HOOD.w - 7, HOOD.y + HOOD.d / 2],
    ],
    HOOD_H,
  ),
  screws: dots(corners(HOOD, 4.6), HOOD_H),
};

/* The client: a tray, its backstop, and the bin for spent tokens. */

const seat = (y: number, length: number, width: number) =>
  planOutline({ x: SEAT_X - length / 2 - 1, y: y - width / 2 - 1, w: length + 2, d: width + 2, r: 1.4 }, DECK, P, 3);

const BACK_LABEL: Plan = { x: BACKSTOP.x + 7, y: BACKSTOP.y + 1.4, w: BACKSTOP.w - 14, d: BACKSTOP.d - 2.8, r: 0.8 };

export const TRAY_ART = {
  backstop: solid(BACKSTOP, 0, BACKSTOP_H, 3, 0.6),
  backSeam: sideSeam(BACKSTOP, DECK, P, 3),
  backLabel: solid(BACK_LABEL, BACKSTOP_H, 0.6, 3),
  backRules: join([
    lineOnTop([BACK_LABEL.x + 2, BACK_LABEL.y + 1.2], [BACK_LABEL.x + 12, BACK_LABEL.y + 1.2], BACKSTOP_H + 0.6, P),
    lineOnTop([BACK_LABEL.x + 2, BACK_LABEL.y + 2.4], [BACK_LABEL.x + 9, BACK_LABEL.y + 2.4], BACKSTOP_H + 0.6, P),
  ]),
  backScrews: dots(
    [
      [BACKSTOP.x + 3.4, BACKSTOP.y + BACKSTOP.d / 2],
      [BACKSTOP.x + BACKSTOP.w - 3.4, BACKSTOP.y + BACKSTOP.d / 2],
    ],
    BACKSTOP_H,
  ),
  tray: solid(TRAY, 0, DECK, 4, 0.6),
  seats: join([seat(TAG_Y, TAG_L, TAG_W), seat(CARD_Y, CARD_L, CARD_W)]),
  screws: dots(
    [
      [TRAY.x + 3, TRAY.y + TRAY.d - 3],
      [TRAY.x + TRAY.w - 3, TRAY.y + TRAY.d - 3],
    ],
    DECK,
  ),
};

const wall = (plan: Plan) => solid(plan, 0, BIN_H, 2, 0.3);
export const BIN_ART = {
  floor: solid(BIN, 0, BIN_FLOOR, 4),
  back: wall({ x: BIN.x, y: BIN.y, w: BIN.w, d: BIN_WALL, r: 0.5 }),
  left: wall({ x: BIN.x, y: BIN.y, w: BIN_WALL, d: BIN.d, r: 0.5 }),
  right: wall({ x: BIN.x + BIN.w - BIN_WALL, y: BIN.y, w: BIN_WALL, d: BIN.d, r: 0.5 }),
  front: wall({ x: BIN.x, y: BIN.y + BIN.d - BIN_WALL, w: BIN.w, d: BIN_WALL, r: 0.5 }),
  screws: dots(
    [
      [BIN.x + 0.8, BIN.y + BIN.d / 2],
      [BIN.x + BIN.w - 0.8, BIN.y + BIN.d / 2],
    ],
    BIN_H,
  ),
};

/* The reader locker: the API. */

const DIAL_STAND: Plan = { x: DIAL[0] - 14, y: DIAL[1] - 14, w: 28, d: 28, r: 3 };

function dialMarks() {
  const minor: string[] = [];
  const major: string[] = [];
  const zero: string[] = [];
  const rim = DIAL_R - 2.6;
  for (let minute = 0; minute < 60; minute++) {
    const big = minute % 5 === 0;
    const inner = rim - (minute === 0 ? 3.4 : big ? 2.6 : 1.3);
    (minute === 0 ? zero : big ? major : minor).push(lineOnTop(onDial(minute, inner), onDial(minute, rim), DIAL_TOP, P));
  }
  return { minor: join(minor), major: join(major), zero: join(zero) };
}

const MARKS = dialMarks();
const FLAG_SLOT: Plan = { x: FLAG_X - FLAG_W / 2 - 0.7, y: FLAG_Y - FLAG_T / 2 - 0.7, w: FLAG_W + 1.4, d: FLAG_T + 1.4, r: 0.6 };
const FLAG_PLAN: Plan = { x: FLAG_X - FLAG_W / 2, y: FLAG_Y - FLAG_T / 2, w: FLAG_W, d: FLAG_T, r: 0.4 };
const FLAG_FACE = FLAG_Y + FLAG_T / 2;

export const LOCK_ART = {
  plinth: solid(insetPlan(LOCK, 2), 0, PLINTH_H, 4),
  body: solid(LOCK, PLINTH_H, LOCK_H - PLINTH_H, 4, 1),
  seams: join([sideSeam(LOCK, LOCK_H - 4.4, P, 4), sideSeam(LOCK, 3.6, P, 4)]),
  inset: planOutline(insetPlan(LOCK, 3.4), LOCK_H, P, 4),
  screws: dots(corners(LOCK, 6.4), LOCK_H),
  /** The opening the drawer slides out of, seen when it is open. */
  opening: faceRect("y", LOCK_FRONT_Y, DRAWER.x0 + 1.2, DRAWER.x1 - 1.2, DRAWER.z0 + 0.8, DRAWER.z1 - 0.8, 0.8),
  throat: solid(THROAT, DECK + LIP_H, THROAT_H - LIP_H, 2, 0.4),
  throatSeam: sideSeam(THROAT, DECK + THROAT_H - 2.2, P, 2),
  throatScrews: dots(
    [
      [THROAT.x + THROAT.w / 2, THROAT.y + 2.6],
      [THROAT.x + THROAT.w / 2, THROAT.y + THROAT.d - 2.6],
    ],
    DECK + THROAT_H,
  ),
  dial: {
    stand: solid(DIAL_STAND, LOCK_H, 2.4, 5, 0.5),
    standScrews: dots(corners(DIAL_STAND, 3), LOCK_H + 2.4),
    puck: round(DIAL, DIAL_R, LOCK_H + 2.4, DIAL_TOP - LOCK_H - 2.4, 64, 0.8),
    band: knurl(DIAL[0], DIAL[1], DIAL_R, DIAL_TOP - 3, DIAL_TOP, 84, P, 0.3),
    bandSeam: sideArc(DIAL[0], DIAL[1], DIAL_R, DIAL_TOP - 3, P, 40),
    bezel: circle(DIAL, DIAL_R - 2.6, DIAL_TOP, 64),
    minor: MARKS.minor,
    major: MARKS.major,
    zero: MARKS.zero,
    hub: circle(DIAL, 1.5, DIAL_TOP, 16),
    crown: solid({ x: DIAL[0] + DIAL_R - 0.6, y: DIAL[1] - 2.2, w: 4.4, d: 4.4, r: 1 }, LOCK_H + 3.4, 3.4, 3, 0.3),
  },
  flagSlot: planOutline(FLAG_SLOT, LOCK_H, P, 2),
  seal: sealOf(LOCK_SEAL, LOCK_H),
};

/** The 401 flag, built standing up. */
export const FLAG_ART = {
  body: solid(FLAG_PLAN, LOCK_H, FLAG_H, 2, 0.3),
  ring: sideRing([FLAG_X, FLAG_FACE, LOCK_H + FLAG_H - 4], 2, "y", P, 24),
  bar: sideRing([FLAG_X, FLAG_FACE, LOCK_H + FLAG_H - 4], 0.7, "y", P, 12),
  clip: boxHull(FLAG_SLOT.x, FLAG_SLOT.x + FLAG_SLOT.w, FLAG_SLOT.y, FLAG_SLOT.y + FLAG_SLOT.d, LOCK_H, LOCK_H + FLAG_H + 1),
};

/** The drawer's front panel, built shut, with its pull. */
const PULL: Plan = { x: (DRAWER.x0 + DRAWER.x1) / 2 - 7, y: LOCK_FRONT_Y + DRAWER_PANEL, w: 14, d: 1.8, r: 0.8 };
export const PANEL_ART = {
  panel: solid({ x: DRAWER.x0, y: LOCK_FRONT_Y, w: DRAWER.x1 - DRAWER.x0, d: DRAWER_PANEL, r: 0.6 }, DRAWER.z0, DRAWER.z1 - DRAWER.z0, 2, 0.4),
  holder: faceRect("y", LOCK_FRONT_Y + DRAWER_PANEL, DRAWER.x0 + 4, DRAWER.x0 + 13, DRAWER.z1 - 6.4, DRAWER.z1 - 2.4, 0.5),
  pull: solid(PULL, DRAWER.z0 + 4.2, 1.8, 3, 0.3),
  rivets: pointsAt(
    [DRAWER.x0 + 2, DRAWER.x1 - 2].flatMap((x) =>
      [DRAWER.z0 + 2, DRAWER.z1 - 2].map((z): Point3 => [x, LOCK_FRONT_Y + DRAWER_PANEL, z]),
    ),
    P,
  ),
};

/* Tokens, built at the world origin, lying flat. */

const CARD_PLAN: Plan = { x: -CARD_L / 2, y: -CARD_W / 2, w: CARD_L, d: CARD_W, r: 1 };
const HEADER_END = -CARD_L / 2 + 4.4;
const SIGNATURE_START = CARD_L / 2 - 5;

export const CARD_ART = {
  body: solid(CARD_PLAN, 0, CARD_T, 3, 0.3),
  /** The two dots of a JWT: header . payload . signature. */
  joints: join(
    [HEADER_END, SIGNATURE_START].map((x) => lineOnTop([x, -CARD_W / 2], [x, CARD_W / 2], CARD_T, P)),
  ),
  /** Claims, printed. */
  claims: join(
    [-3, -0.6, 1.8].map((y, index) =>
      lineOnTop([HEADER_END + 1.4, y], [SIGNATURE_START - (index === 2 ? 3.4 : 1.4), y], CARD_T, P),
    ),
  ),
  seal: circle([(SIGNATURE_START + CARD_L / 2) / 2, 0], 1.6, CARD_T, 18),
  sealDot: dots([[(SIGNATURE_START + CARD_L / 2) / 2, 0]], CARD_T),
  /** One pip per access token, in issue order, on the header. */
  pips: [1, 2].map((count) =>
    dots(
      PIPS[count - 1].map(([dx, dy]): Plane => [(-CARD_L / 2 + HEADER_END) / 2 + dx * 0.8, dy * 1.4]),
      CARD_T,
    ),
  ),
};

function tagOf(alongY: boolean) {
  const plan: Plan = alongY
    ? { x: -TAG_W / 2, y: -TAG_L / 2, w: TAG_W, d: TAG_L, r: 1.6 }
    : { x: -TAG_L / 2, y: -TAG_W / 2, w: TAG_L, d: TAG_W, r: 1.6 };
  const hole: Plane = alongY ? [0, TAG_L / 2 - 2.6] : [TAG_L / 2 - 2.6, 0];
  const pipAt = (offset: number): Plane => (alongY ? [0, -1.8 + offset] : [-1.8 + offset, 0]);
  return {
    body: solid(plan, 0, TAG_T, 3, 0.3),
    hole: circle(hole, 1.1, TAG_T, 16),
    pips: [1, 2].map((count) => dots(pipRow(count, 2.2).map((offset) => pipAt(offset)), TAG_T)),
  };
}

export const TAG_ART = tagOf(false);
export const ATT_ART = tagOf(true);

/* What shows of a token that comes out of the cabinet: only what is in front of its face. */
export const CLIPS = {
  card: boxHull(CAB_FACE_X, CAB_FACE_X + 60, CARD_Y - CARD_INNER / 2 - 1, CARD_Y + CARD_INNER / 2 + 1, DECK - 0.3, DECK + CARD_T + 0.5),
  tag: boxHull(CAB_FACE_X, CAB_FACE_X + 60, TAG_Y - TAG_INNER / 2 - 1, TAG_Y + TAG_INNER / 2 + 1, DECK - 0.3, DECK + TAG_T + 0.5),
  attacker: boxHull(ATT_X - TAG_INNER / 2 - 1, ATT_X + TAG_INNER / 2 + 1, CAB_FRONT_Y, CAB_FRONT_Y + 40, DECK - 0.3, DECK + TAG_T + 0.5),
};
