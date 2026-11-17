import { lineOnTop, slabOf, type Plan, type Point3, type SolidPaths } from "../../iso/iso-kit";
import { CARD_COUNT, STEPS, TAG_COUNT, type Step } from "./model";
import {
  ATT_HOME,
  ATT_HOOD,
  BAR_DROP,
  BIN,
  BIN_CARD_Y,
  BIN_FLOOR,
  BIN_H,
  BIN_TAG_Y,
  BIN_WALL,
  CAB_FACE_X,
  CAB_FRONT_Y,
  CARD_HOME,
  CARD_L,
  CARD_READER,
  CARD_T,
  CARD_TRAY,
  CARD_W,
  DECK,
  DIAL_TOP,
  DRAWER,
  DRAWER_OPEN,
  LOCK_FRONT_Y,
  P,
  SEAT_X,
  STUB_H,
  STUB_X,
  TAG_HOME,
  TAG_L,
  TAG_TRAY,
  TAG_W,
  TRAY,
  USED,
  onDial,
} from "./view";

/**
 * The choreography. poseAt(u) is a pure function of the timeline position u,
 * where u = k is step k of the model at rest and the values in between are
 * the motion from one step to the next.
 */

export type Lit = { kind: "card" | "tag"; id: number } | { kind: "attacker" } | { kind: "bar" } | null;

export interface Pose {
  /** Where each access card is (index = id − 1). Null while it is inside the cabinet or the reader. */
  cards: (Point3 | null)[];
  tags: (Point3 | null)[];
  /** The stolen copy of the first refresh token. Null while it is inside the hood. */
  attacker: Point3 | null;
  /** How far each stub stands out of the rack, 0 to 1. */
  stubs: number[];
  /** 0 = the family bar up, 1 = down on the rack. */
  bar: number;
  /** 0 = the 401 flag down, 1 = up. */
  flag: number;
  /** 0 = drawer shut, 1 = open. */
  drawer: number;
  /** The clock, seconds since login. */
  now: number;
  /** The exp of the last token the reader read, seconds since login. */
  exp: number;
  lit: Lit;
}

/** Seconds each kind of step takes to play. */
const SECONDS: Record<Step["kind"], number> = {
  start: 1,
  login: 4.6,
  call: 4.4,
  refresh: 6,
  replay: 5.6,
  clear: 3.6,
};
export const secondsInto = (step: number) => SECONDS[STEPS[Math.min(Math.max(step, 1), STEPS.length - 1)].kind];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** Smooth 0 → 1 while t goes from a to b. */
const ramp = (t: number, a: number, b: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Point3, b: Point3, t: number): Point3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

/** A path through timed stops: [time, place], eased between each pair. */
type Stop = [number, Point3];
function along(t: number, stops: Stop[]): Point3 {
  if (t <= stops[0][0]) return stops[0][1];
  for (let index = 1; index < stops.length; index++) {
    const [t1, b] = stops[index];
    if (t > t1) continue;
    const [t0, a] = stops[index - 1];
    return mix3(a, b, ramp(t, t0, t1));
  }
  return stops[stops.length - 1][1];
}

/**
 * Off the tray's front edge and into the bin: a token slides to the edge,
 * tips over the bin's back wall and lands on its seat.
 */
function intoBin(s: number, from: Point3, to: Point3, half: number): Point3 {
  const y = mix(from[1], to[1], s);
  const edge = TRAY.y + TRAY.d;
  const clear = BIN.y + BIN_WALL + half;
  let z = DECK;
  if (y > edge && y <= clear) z = mix(DECK, BIN_H + 0.2, (y - edge) / (clear - edge));
  else if (y > clear) z = mix(BIN_H + 0.2, to[2], clamp((y - clear) / Math.max(0.01, to[1] - clear)));
  return [from[0], y, z];
}

function cardRest(step: Step, id: number): Point3 | null {
  const place = step.cards[id - 1];
  if (place === "client") return CARD_TRAY;
  if (place === "bin") {
    const below = step.cards.slice(0, id - 1).filter((other) => other === "bin").length;
    return [SEAT_X, BIN_CARD_Y, BIN_FLOOR + below * CARD_T];
  }
  return null;
}

function tagRest(step: Step, id: number): Point3 | null {
  const place = step.tags[id - 1];
  if (place === "client") return TAG_TRAY;
  if (place === "bin") return [SEAT_X, BIN_TAG_Y, BIN_FLOOR];
  return null;
}

const stubsOf = (step: Step): number[] =>
  STUB_X.map((_, slot) => {
    const record = step.records[slot];
    if (!record || record.state === "revoked") return 0;
    return record.state === "used" ? USED : 1;
  });

const barOf = (step: Step) => (step.records.length && step.records.every((record) => record.state === "revoked") ? 1 : 0);
const flagOf = (step: Step) => (step.kind === "call" && step.status === 401 ? 1 : 0);

function litOf(step: Step): Lit {
  if (step.kind === "login") return { kind: "card", id: 1 };
  if (step.kind === "replay") return { kind: "bar" };
  if (!step.presented) return null;
  return { kind: step.presented.type === "access" ? "card" : "tag", id: step.presented.id };
}

export function poseAt(u: number): Pose {
  const last = STEPS.length - 1;
  const at = Math.min(Math.max(u, 0), last);
  const index = Math.min(Math.floor(at), last - 1);
  const t = at - index;
  const before = STEPS[index];
  const after = STEPS[index + 1];

  const cards = Array.from({ length: CARD_COUNT }, (_, i) => cardRest(before, i + 1));
  const tags = Array.from({ length: TAG_COUNT }, (_, i) => tagRest(before, i + 1));
  let attacker: Point3 | null = null;
  const stubs = stubsOf(before);
  let bar = barOf(before);
  // A 401 flag stays up until the next step begins.
  let flag = flagOf(before) * (1 - ramp(t, 0, 0.14));
  let drawer = 0;
  // Time passes first, then the step's action happens.
  const now = mix(before.at, after.at, ramp(t, 0, 0.18));
  let exp = before.readExp ?? 0;
  let lit = litOf(before);

  if (t > 0) {
    lit = litOf(after);
    if (after.kind === "login") {
      stubs[0] = ramp(t, 0.16, 0.36);
      cards[0] = along(t, [
        [0.3, CARD_HOME],
        [0.7, CARD_TRAY],
      ]);
      tags[0] = along(t, [
        [0.44, TAG_HOME],
        [0.86, TAG_TRAY],
      ]);
    } else if (after.kind === "call" && after.presented) {
      const id = after.presented.id;
      cards[id - 1] = along(t, [
        [0.18, CARD_TRAY],
        [0.42, CARD_READER],
        [0.64, CARD_READER],
        [0.9, CARD_TRAY],
      ]);
      exp = mix(exp, after.readExp ?? 0, ramp(t, 0.42, 0.52));
      if (after.status === 200) drawer = ramp(t, 0.5, 0.62) - ramp(t, 0.74, 0.88);
      else flag = Math.max(flag, ramp(t, 0.52, 0.62));
    } else if (after.kind === "refresh" && after.presented) {
      const r = after.presented.id;
      if (after.status === 200 && before.access && after.access && after.refresh) {
        const old = before.access.id;
        const n = after.access.id;
        const m = after.refresh.id;
        cards[old - 1] = intoBin(ramp(t, 0.14, 0.38), CARD_TRAY, cardRest(after, old)!, CARD_W / 2);
        tags[r - 1] = along(t, [
          [0.24, TAG_TRAY],
          [0.46, TAG_HOME],
        ]);
        stubs[r - 1] = mix(1, USED, ramp(t, 0.48, 0.58));
        stubs[m - 1] = ramp(t, 0.52, 0.66);
        cards[n - 1] = along(t, [
          [0.6, CARD_HOME],
          [0.86, CARD_TRAY],
        ]);
        tags[m - 1] = along(t, [
          [0.68, TAG_HOME],
          [0.96, TAG_TRAY],
        ]);
        if (t > 0.6) lit = { kind: "tag", id: m };
      } else {
        // The tag goes in, finds its stub gone, and comes back.
        const inside: Point3 = [CAB_FACE_X - TAG_L / 2 + 2, TAG_TRAY[1], DECK];
        tags[r - 1] = along(t, [
          [0.16, TAG_TRAY],
          [0.42, inside],
          [0.56, inside],
          [0.84, TAG_TRAY],
        ]);
      }
    } else if (after.kind === "replay") {
      attacker = along(t, [
        [0.12, ATT_HOOD],
        [0.42, ATT_HOME],
        [0.66, ATT_HOME],
        [0.96, ATT_HOOD],
      ]);
      bar = Math.max(bar, ramp(t, 0.46, 0.58));
      lit = t < 0.46 ? { kind: "attacker" } : { kind: "bar" };
    } else if (after.kind === "clear") {
      if (before.access) {
        const id = before.access.id;
        cards[id - 1] = intoBin(ramp(t, 0.12, 0.5), CARD_TRAY, cardRest(after, id)!, CARD_W / 2);
      }
      if (before.refresh) {
        const id = before.refresh.id;
        tags[id - 1] = intoBin(ramp(t, 0.4, 0.82), TAG_TRAY, tagRest(after, id)!, TAG_W / 2);
      }
      lit = null;
    }
  }

  // The bar pushes every stub under it down into the rack.
  const room = (BAR_DROP * (1 - bar)) / STUB_H;
  for (let slot = 0; slot < stubs.length; slot++) stubs[slot] = Math.min(stubs[slot], room);

  const away = (point: Point3 | null, home: Point3) =>
    point && Math.abs(point[0] - home[0]) + Math.abs(point[1] - home[1]) < 0.01 ? null : point;
  return {
    cards: cards.map((point) => away(away(point, CARD_HOME), CARD_READER)),
    tags: tags.map((point) => away(point, TAG_HOME)),
    attacker: away(attacker, ATT_HOOD),
    stubs,
    bar,
    flag,
    drawer,
    now,
    exp,
    lit,
  };
}

/* Clips: a token that is partly inside the cabinet is cut at its face. */
export const cardAtFace = ([x]: Point3) => x - CARD_L / 2 < CAB_FACE_X + 0.5;
export const tagAtFace = ([x]: Point3) => x - TAG_L / 2 < CAB_FACE_X + 0.5;
export const attackerAtFace = ([, y]: Point3) => y - TAG_L / 2 < CAB_FRONT_Y + 0.5;

/* The clock's hands. */
const NOW_LENGTH = 9.4;
const NOW_TAIL = 2.4;
const EXP_LENGTH = 6.2;
const hand = (seconds: number, length: number, tail: number) => {
  const minutes = seconds / 60;
  return lineOnTop(onDial(minutes + 30, tail), onDial(minutes, length), DIAL_TOP + 0.2, P);
};

/** The long hand: the reader's own clock. */
export const nowHand = (seconds: number) => hand(seconds, NOW_LENGTH, NOW_TAIL);
/** The short hand: the exp the reader last read from a card. */
export const expHand = (seconds: number) => hand(seconds, EXP_LENGTH, 0.01);

/* The drawer box: only the part pulled out of the locker is drawn, rebuilt as it opens. */
export interface DrawerParts {
  floor: SolidPaths;
  left: SolidPaths;
  load: SolidPaths;
  right: SolidPaths;
}

const EMPTY: SolidPaths = { fill: "", outline: "", crease: "", top: "", shades: ["", "", "", ""] };

export function drawerOf(open: number): DrawerParts {
  const out = open * DRAWER_OPEN;
  if (out < 0.05) return { floor: EMPTY, left: EMPTY, load: EMPTY, right: EMPTY };
  const y = LOCK_FRONT_Y;
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
    if (y1 - y0 < 0.05) return EMPTY;
    const plan: Plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 0.3 };
    return slabOf(plan, z0, z1 - z0, P, 1);
  };
  // The served resource: a block of records sitting near the front of the drawer.
  const loadFrom = Math.max(y, y + out - 11);
  return {
    floor: box(DRAWER.x0 + 1.6, DRAWER.x1 - 1.6, y, y + out, DRAWER.z0 + 0.6, DRAWER.z0 + 1.6),
    left: box(DRAWER.x0 + 1.6, DRAWER.x0 + 3, y, y + out, DRAWER.z0 + 1.6, DRAWER.z1 - 3),
    load: box(DRAWER.x0 + 8, DRAWER.x1 - 8, loadFrom, y + out - 1.5, DRAWER.z0 + 1.6, DRAWER.z0 + 5.2),
    right: box(DRAWER.x1 - 3, DRAWER.x1 - 1.6, y, y + out, DRAWER.z0 + 1.6, DRAWER.z1 - 3),
  };
}
