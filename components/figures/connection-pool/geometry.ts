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
  sideArc,
  sideSeam,
  slabOf,
  topTicks,
  type Flat,
  type Plan,
  type Plane,
  type Point3,
} from "../../iso/iso-kit";
import { ACQUIRE_TIMEOUT, CLIENTS, MAX } from "./model";
import {
  BASE,
  BASE_H,
  BAY_X,
  CARRIAGE,
  DECK,
  DIAL_FROM,
  DIAL_R,
  DIAL_SWEEP,
  DIAL_TOP,
  EJECTOR,
  EJECTOR_H,
  EXIT,
  FACE_Y,
  FEED,
  FEED_DOOR,
  FOOT_H,
  HOUSING_H,
  LANE,
  LANE_Y,
  LOAD,
  MANIFOLD,
  MANIFOLD_H,
  P,
  PAN,
  PAN_H,
  PAN_SEAT,
  PORT_H,
  PORT_HALF,
  PUCK_H,
  PUCK_R,
  PUSHER,
  QUEUE_X,
  RAIL_END,
  RAIL_H,
  SHUTTER_D,
  TANK,
  TANK_H,
  TANK_R,
  TIMER,
} from "./view";

/** Every static path of the bench, computed once at module load. */

const solid = (plan: Plan, z: number, h: number, steps = 6, bevel = 0) => slabOf(plan, z, h, P, steps, bevel);
const round = (at: Plane, r: number, z: number, h: number, steps = 32, bevel = 0) =>
  cylinder(at[0], at[1], r, z, h, P, steps, bevel);
const circle = (at: Plane, r: number, z: number, steps = 40) => ring(at[0], at[1], r, z, P, steps);
const join = (paths: string[]) => paths.join("");
const byDepth = (points: Plane[]) =>
  [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));
const dots = (points: Plane[], z: number) => pointsAt(points.map(([x, y]): Point3 => [x, y, z]), P);

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

/* Base plate on feet, with a ruler strip, a label plate and the reject pan. */

const LABEL: Plan = { x: -146, y: 64, w: 44, d: 14, r: 1.5 };
const RULER: Plan = { x: BAY_X[0] - 12, y: LANE.y + LANE.d + 3, w: LANE.x + LANE.w - BAY_X[0] + 8, d: 6, r: 1 };
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
  pan: solid(PAN, 0, PAN_H, 5, 0.5),
  panInset: planOutline(insetPlan(PAN, 2.2), PAN_H, P, 5),
  panSeat: circle(PAN_SEAT, PUCK_R + 1.4, PAN_H, 36),
  panScrews: dots(corners(PAN, 3.4), PAN_H),
};

/* The database: a drum, and the duct that joins it to the manifold. */

const DUCT: Plan = { x: MANIFOLD.x + MANIFOLD.w, y: TANK[1] - 6, w: TANK[0] - TANK_R + 4 - (MANIFOLD.x + MANIFOLD.w), d: 12, r: 1.5 };
const TANK_BOLTS = Array.from({ length: 10 }, (_, index): Plane => {
  const angle = (index / 10) * Math.PI * 2 + 0.2;
  return [TANK[0] + (TANK_R - 3.2) * Math.cos(angle), TANK[1] + (TANK_R - 3.2) * Math.sin(angle)];
});

export const TANK_ART = {
  duct: solid(DUCT, 0, 16, 3, 0.5),
  ductSeam: join([sideSeam(DUCT, 12, P, 3), sideSeam(DUCT, 3, P, 3)]),
  ductScrews: dots([[DUCT.x + 4, DUCT.y + 3], [DUCT.x + 4, DUCT.y + DUCT.d - 3]], 16),
  skirt: round(TANK, TANK_R + 2, 0, 2.4, 64),
  body: round(TANK, TANK_R, 2.4, TANK_H - 2.4, 72, 0.9),
  bands: join([10, 11.4, 20, 21.4].map((z) => sideArc(TANK[0], TANK[1], TANK_R, z, P, 44))),
  bolts: dots(TANK_BOLTS, TANK_H),
  lidRing: circle(TANK, TANK_R - 6.4, TANK_H, 56),
  neck: round(TANK, 7, TANK_H, 2.4, 32, 0.4),
  cap: round(TANK, 5.2, TANK_H + 2.4, 3.6, 28, 0.5),
  capKnurl: knurl(TANK[0], TANK[1], 5.2, TANK_H + 2.4, TANK_H + 6, 26, P),
  capRing: circle(TANK, 2.4, TANK_H + 6, 18),
};

/* The manifold: a block with one shuttered port per bay. */

const TOP = MANIFOLD_H;
const facePoint = (x: number, z: number): Point3 => [x, FACE_Y, z];

function portOf(bay: number) {
  const x = BAY_X[bay];
  const opening = [
    facePoint(x - PORT_HALF, 0),
    facePoint(x + PORT_HALF, 0),
    facePoint(x + PORT_HALF, PORT_H),
    facePoint(x - PORT_HALF, PORT_H),
  ];
  const shutter: Plan = { x: x - PORT_HALF - 1, y: FACE_Y, w: PORT_HALF * 2 + 2, d: SHUTTER_D, r: 0.4 };
  // Everything a carriage can show: the doorway, and the space in front of it.
  const sweep = [...opening, ...opening.map(([px, , pz]): Point3 => [px, RAIL_END + 6, pz])];
  // Ports are numbered by pips above the doorway, like the clients.
  const pips = Array.from({ length: bay + 1 }, (_, pip): Plane => [x + (pip - bay / 2) * 3.2, FACE_Y]);
  return {
    opening: pathOf(pointsAt(opening, P), true),
    clip: hullPath(pointsAt(sweep, P)),
    shutter: solid(shutter, 0, PORT_H, 2),
    slats: join([3.75, 7.5, 11.25].map((z) => sideSeam(shutter, z, P, 2))),
    handle: pointsAt([[x, FACE_Y + SHUTTER_D, 1.8]], P),
    pips: dots(pips, TOP - 2.6),
  };
}

export const MANIFOLD_ART = {
  block: solid(MANIFOLD, 0, TOP, 4, 1),
  seams: join([sideSeam(MANIFOLD, TOP - 5.2, P, 4), sideSeam(MANIFOLD, PORT_H + SHUTTER_D + 17.2, P, 4)]),
  inset: planOutline(insetPlan(MANIFOLD, 3.4), TOP, P, 4),
  screws: dots(corners(MANIFOLD, 6.4), TOP),
  ports: BAY_X.map((_, bay) => portOf(bay)),
};

/* A bay: two rails from the port to the counter, and the bridge onto the lane. */

function bayOf(bay: number) {
  const x = BAY_X[bay];
  const from = FACE_Y + SHUTTER_D;
  const rail = (offset: number): Plan => ({ x: x + offset - 1.1, y: from, w: 2.2, d: RAIL_END - from, r: 0.6 });
  const bridge: Plan = { x: x - 9, y: RAIL_END, w: 18, d: LANE.y - RAIL_END + 0.5, r: 1 };
  const ties: string[] = [];
  for (let y = from + 7; y < RAIL_END - 3; y += 9) ties.push(lineOnTop([x - 7 + 1.1, y], [x + 7 - 1.1, y], 0, P));
  return {
    rails: [rail(-7), rail(7)].map((plan) => solid(plan, 0, RAIL_H, 2, 0.3)),
    ties: join(ties),
    bridge: solid(bridge, 0, DECK, 3, 0.4),
    bridgeScrews: dots(
      [
        [x - 6, RAIL_END + bridge.d / 2],
        [x + 6, RAIL_END + bridge.d / 2],
      ],
      DECK,
    ),
  };
}

export const BAY_ART = BAY_X.map((_, bay) => bayOf(bay));

/* A carriage, built at the world origin: one open connection. */

const SHOE = (dx: number, dy: number): Plan => ({ x: dx - 2.4, y: dy - 3, w: 4.8, d: 6, r: 1 });

export const CARRIAGE_ART = {
  shoes: [SHOE(-7, -6), SHOE(7, -6), SHOE(-7, 6), SHOE(7, 6)]
    .sort((a, b) => depthOf([a.x, a.y, 0], P) - depthOf([b.x, b.y, 0], P))
    .map((plan) => solid(plan, RAIL_H, 1.4, 2)),
  body: solid(CARRIAGE, RAIL_H + 1.4, DECK - RAIL_H - 1.4, 5, 0.6),
  seam: sideSeam(CARRIAGE, DECK - 1.6, P, 5),
  seat: circle([0, 0], PUCK_R + 1.2, DECK, 36),
  screws: dots(corners(CARRIAGE, 2.6), DECK),
};

/* The lane with its two housings, and the waiting line marked on it. */

const rollers: string[] = [];
for (let x = LANE.x + 5; x <= LANE.x + LANE.w - 4; x += 5.5) {
  rollers.push(lineOnTop([x, LANE.y], [x, LANE.y + LANE.d], DECK, P));
}
const sideRail = (y: number): Plan => ({ x: LANE.x, y, w: LANE.w, d: 1.6, r: 0.6 });
const housingOf = (plan: Plan) => ({
  body: solid(plan, 0, HOUSING_H, 5, 0.8),
  seams: join([sideSeam(plan, DECK, P, 5), sideSeam(plan, HOUSING_H - 4, P, 5)]),
  inset: planOutline(insetPlan(plan, 3), HOUSING_H, P, 5),
  screws: dots(corners(plan, 5), HOUSING_H),
  vent: join(
    [-5, 0, 5].map((dy) =>
      planOutline({ x: plan.x + 6, y: plan.y + plan.d / 2 + dy - 1, w: plan.w - 12, d: 2, r: 1 }, HOUSING_H, P, 3),
    ),
  ),
});
const door = FEED_DOOR;
const doorway: Point3[] = [
  [door.x, door.y0, door.z0],
  [door.x, door.y1, door.z0],
  [door.x, door.y1, door.z1],
  [door.x, door.y0, door.z1],
];

export const LANE_ART = {
  bed: solid(LANE, 0, DECK, 4, 0.5),
  seam: sideSeam(LANE, DECK - 2.4, P, 4),
  rollers: join(rollers),
  edges: [sideRail(LANE.y), sideRail(LANE.y + LANE.d - 1.6)].map((rail) => planOutline(rail, DECK, P, 2)).join(""),
  /** One seat per place in the waiting line: the head is the one beside the ejector. */
  seats: join(QUEUE_X.map((x) => circle([x, LANE_Y], PUCK_R + 1.4, DECK, 36))),
  feed: housingOf(FEED),
  feedDoor: pathOf(pointsAt(doorway, P), true),
  /** Everything a puck can show while it comes out of the feed housing. */
  feedClip: hullPath(
    pointsAt([...doorway, ...doorway.map(([, y, z]): Point3 => [QUEUE_X[0] + 60, y, z])], P),
  ),
  exit: housingOf(EXIT),
};

/* The ejector at the head of the waiting line. The rod is rebuilt as it extends. */

export const EJECTOR_ART = {
  housing: solid(EJECTOR, 0, EJECTOR_H, 4, 0.7),
  seams: join([sideSeam(EJECTOR, 4, P, 4), sideSeam(EJECTOR, EJECTOR_H - 3.4, P, 4)]),
  inset: planOutline(insetPlan(EJECTOR, 2.6), EJECTOR_H, P, 4),
  screws: dots(corners(EJECTOR, 4.4), EJECTOR_H),
  plate: solid(PUSHER, DECK + 0.6, PUCK_H, 2, 0.3),
};

/* Dial gauges, face up. */

const RAD = Math.PI / 180;

function dialOf(center: Plane, divisions: number, per: number) {
  const stand: Plan = { x: center[0] - 13, y: center[1] - 13, w: 26, d: 26, r: 3 };
  const minor: string[] = [];
  const major: string[] = [];
  const ends: string[] = [];
  const rim = DIAL_R - 3;
  for (let index = 0; index <= divisions * per; index++) {
    const angle = (DIAL_FROM + (index / (divisions * per)) * DIAL_SWEEP) * RAD;
    const big = index % per === 0;
    const end = index === 0 || index === divisions * per;
    const inner = rim - (big ? 3 : 1.4);
    (end ? ends : big ? major : minor).push(
      lineOnTop(
        [center[0] + inner * Math.cos(angle), center[1] + inner * Math.sin(angle)],
        [center[0] + rim * Math.cos(angle), center[1] + rim * Math.sin(angle)],
        DIAL_TOP,
        P,
      ),
    );
  }
  return {
    stand: solid(stand, 0, 3, 5, 0.5),
    standScrews: dots(corners(stand, 3), 3),
    puck: round(center, DIAL_R, 3, DIAL_TOP - 3, 64, 0.8),
    band: knurl(center[0], center[1], DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 84, P, 0.3),
    bandSeam: sideArc(center[0], center[1], DIAL_R, DIAL_TOP - 3.4, P, 40),
    bezel: circle(center, DIAL_R - 3, DIAL_TOP, 64),
    marksMinor: join(minor),
    marksMajor: join(major),
    marksEnd: join(ends),
    hub: circle(center, 1.6, DIAL_TOP, 16),
    crown: solid({ x: center[0] + DIAL_R - 0.6, y: center[1] - 2.2, w: 4.6, d: 4.4, r: 1 }, 5, 4, 3, 0.3),
  };
}

/** The timer: one major mark every 5 s up to the acquire timeout. */
export const TIMER_ART = dialOf(TIMER, ACQUIRE_TIMEOUT / 5, 5);
/** The load gauge: one major mark per connection, up to the maximum. */
export const LOAD_ART = dialOf(LOAD, MAX, 2);

/** Signal lines on the plate: timer to ejector, load gauge to the database. */
const floor = ([x, y]: Plane): Flat => iso([x, y, 0], P);
export const WIRE_ART = {
  timer: {
    from: floor([TIMER[0] + 13, TIMER[1] + 8]),
    via: [floor([QUEUE_X[0], TIMER[1] + 8])],
    to: floor([QUEUE_X[0], EJECTOR.y]),
  },
  load: {
    from: floor([LOAD[0] + 13, LOAD[1]]),
    via: [floor([TANK[0], LOAD[1]])],
    to: floor([TANK[0], TANK[1] + TANK_R + 2]),
  },
};

/* Clients: pucks built at the world origin, numbered by pips like a die. */

const PIP = 2.5;
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
  [
    [-PIP, -PIP],
    [-PIP, PIP],
    [0, 0],
    [PIP, -PIP],
    [PIP, PIP],
  ],
  [
    [-PIP, -PIP],
    [-PIP, 0],
    [-PIP, PIP],
    [PIP, -PIP],
    [PIP, 0],
    [PIP, PIP],
  ],
];

export const PUCK_ART = {
  body: round([0, 0], PUCK_R, 0, PUCK_H, 36, 0.6),
  ring: circle([0, 0], PUCK_R - 1.6, PUCK_H, 30),
  pips: CLIENTS.map((client) => dots(PIPS[(client - 1) % PIPS.length], PUCK_H)),
};
