import { cylinder, onTop, ring, type Plane } from "../../iso/iso-kit";
import { DOC_VECTORS, K, QUERY_VECTORS, STEPS, angleOf, type StepKind, type Vector } from "./model";
import {
  BEAM_HALF,
  CARDS,
  CARD_X,
  CENTER,
  CLEAR,
  DOC_TRAY_Y,
  ENCODER_H,
  P,
  PARK,
  PIN_FLUSH,
  PIN_PICKED,
  PIN_R,
  PIN_STORED,
  QUERY_TRAY_Y,
  SINK,
  STOP,
  TOP,
  UNIT,
  WELL_Y,
  railX,
  stackZ,
} from "./view";

/**
 * The choreography. poseAt(u) is a pure function of the timeline position u,
 * where u = k is step k of the model at rest and the values in between are
 * the motion from one step to the next. Playing backwards is the same
 * function read the other way.
 */

export interface Pose {
  /** Rotation of the table, degrees: a document at angle θ in vector space sits at θ + turn. */
  turn: number;
  /** Where the sweep blade is, in similarity units along the rail. */
  bar: number;
  /** 0 = stop down, 1 = stop up. */
  pawl: number;
  /** Height of each document's pin above the table. */
  pins: number[];
  /** 0 = stored or flush, 1 = picked by the sweep (for the tone). */
  picked: number[];
  /** Each card's position (underside centre), or null once it has gone into the encoder. */
  cards: ([number, number, number] | null)[];
  /** Whether each card is below the top of the encoder, seen only through the well. */
  sunk: boolean[];
  /** The encoder's two outputs. */
  sliders: [number, number];
  /** The one part to watch. */
  lit: { kind: "card"; card: number } | { kind: "bar" } | { kind: "pawl" } | null;
}

/** Seconds each kind of step takes to play. */
const SECONDS: Record<StepKind, number> = {
  start: 1,
  index: 10.5,
  embed: 4.6,
  rank: 4.4,
  threshold: 5.6,
};
export const secondsInto = (step: number) => SECONDS[STEPS[Math.min(Math.max(step, 1), STEPS.length - 1)].kind];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** Smooth 0 → 1 while t goes from a to b. */
const ramp = (t: number, a: number, b: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** How much of the pop happens over this much bar travel, in similarity units. */
const POP = 0.05;

/* Table angles: every vector is turned to point along +x, the rail's axis. Unwrapped so a turn takes the short way. */

const unwrap = (from: number, to: number) => from + ((((to - from) % 360) + 540) % 360) - 180;
const DOC_TURNS: number[] = [];
{
  let turn = 0;
  for (const vector of DOC_VECTORS) {
    turn = unwrap(turn, -angleOf(vector));
    DOC_TURNS.push(turn);
  }
}
const QUERY_TURNS: number[] = [];
{
  let turn = DOC_TURNS[DOC_TURNS.length - 1];
  for (const vector of QUERY_VECTORS) {
    turn = unwrap(turn, -angleOf(vector));
    QUERY_TURNS.push(turn);
  }
}

/** The table's angle at rest at each step. */
function turnAt(step: number): number {
  const kind = STEPS[step].kind;
  if (kind === "start") return 0;
  if (kind === "index") return DOC_TURNS[DOC_TURNS.length - 1];
  return QUERY_TURNS[STEPS[step].query as number];
}

/** Where the bar comes to rest after the top k, and with the threshold stop up. */
function stopsOf(query: number) {
  const step = STEPS.find((candidate) => candidate.query === query && candidate.kind === "rank")!;
  const kth = step.top[K - 1].score - CLEAR - POP;
  return { topK: kth, limited: Math.max(kth, STOP) };
}

function barAt(step: number): number {
  const { kind, query } = STEPS[step];
  if (kind === "rank") return stopsOf(query as number).topK;
  if (kind === "threshold") return stopsOf(query as number).limited;
  return PARK;
}

const pawlAt = (step: number): number => (STEPS[step].kind === "threshold" ? 1 : 0);

/** Where a card sits in its tray. */
function trayOf(card: number): [number, number, number] {
  const { kind, stack } = CARDS[card];
  return [CARD_X, kind === "doc" ? DOC_TRAY_Y : QUERY_TRAY_Y, stackZ(stack)];
}
const cardOfDoc = (doc: number) => doc;
const cardOfQuery = (query: number) => DOC_VECTORS.length + query;
/** The card's move into the encoder, for local time s from 0 to 1. Null once it is gone. */
function feed(card: number, s: number): [number, number, number] | null {
  const [x, y, z] = trayOf(card);
  if (s >= 1) return null;
  const slide = ramp(s, 0, 0.55);
  const sink = ramp(s, 0.6, 1);
  return [x, mix(y, WELL_Y, slide), mix(z, ENCODER_H - SINK, sink)];
}

const PIN_RANGE = PIN_PICKED - PIN_STORED;

export function poseAt(u: number): Pose {
  const last = STEPS.length - 1;
  const at = Math.min(Math.max(u, 0), last);
  const index = Math.min(Math.floor(at), last - 1);
  const t = at - index;
  const before = STEPS[index];
  const after = STEPS[index + 1];

  let turn = turnAt(index);
  let bar = barAt(index);
  let pawl = pawlAt(index);
  let sliders: [number, number] = [0, 0];
  let lit: Pose["lit"] = null;
  /** Documents stored so far, fractional while a pin rises. */
  const stored: number[] = DOC_VECTORS.map((_, doc) => (before.stored > doc ? 1 : 0));

  // Which cards have gone already.
  const cards: Pose["cards"] = CARDS.map((_, card) => trayOf(card));
  const consumed = (card: number) => (cards[card] = null);
  if (before.stored > 0) DOC_VECTORS.forEach((_, doc) => consumed(cardOfDoc(doc)));
  const queriesFed = before.query === null ? 0 : before.query + 1;
  for (let query = 0; query < queriesFed; query++) consumed(cardOfQuery(query));

  // The sliders hold the last vector the encoder produced.
  const lastVector: Vector | null = before.raw ?? (before.stored > 0 ? DOC_VECTORS[DOC_VECTORS.length - 1] : null);
  if (lastVector) sliders = [lastVector[0], lastVector[1]];

  if (t > 0) {
    if (after.kind === "index") {
      // Each document in turn: card into the encoder, components out, table turned, pin up.
      const count = DOC_VECTORS.length;
      const span = 1 / count;
      DOC_VECTORS.forEach((vector, doc) => {
        const s = clamp((t - doc * span) / span);
        if (s <= 0) return;
        const card = cardOfDoc(doc);
        cards[card] = feed(card, s / 0.5);
        if (s < 0.5) lit = { kind: "card", card };
        const previous = doc === 0 ? [0, 0] : DOC_VECTORS[doc - 1];
        const out = ramp(s, 0.42, 0.62);
        sliders = [mix(previous[0], vector[0], out), mix(previous[1], vector[1], out)];
        turn = mix(doc === 0 ? 0 : DOC_TURNS[doc - 1], DOC_TURNS[doc], ramp(s, 0.5, 0.82));
        stored[doc] = ramp(s, 0.8, 0.96);
      });
    } else if (after.kind === "embed") {
      const query = after.query as number;
      const card = cardOfQuery(query);
      pawl = mix(pawl, 0, ramp(t, 0, 0.12));
      bar = mix(bar, PARK, ramp(t, 0.04, 0.3));
      cards[card] = feed(card, (t - 0.28) / 0.38);
      if (t > 0.28 && t < 0.66) lit = { kind: "card", card };
      const vector = after.raw as Vector;
      const out = ramp(t, 0.6, 0.76);
      sliders = [mix(sliders[0], vector[0], out), mix(sliders[1], vector[1], out)];
      turn = mix(turnAt(index), turnAt(index + 1), ramp(t, 0.7, 1));
    } else if (after.kind === "rank") {
      bar = mix(PARK, barAt(index + 1), ramp(t, 0.06, 0.94));
      lit = { kind: "bar" };
    } else if (after.kind === "threshold") {
      bar = mix(bar, PARK, ramp(t, 0, 0.26));
      pawl = ramp(t, 0.28, 0.4);
      bar = t < 0.44 ? bar : mix(PARK, barAt(index + 1), ramp(t, 0.44, 0.96));
      lit = t < 0.44 ? { kind: "pawl" } : { kind: "bar" };
    }
  } else if (before.kind === "rank") {
    lit = { kind: "bar" };
  } else if (before.kind === "threshold") {
    lit = { kind: "pawl" };
  }

  // A pin is released by the blade once the blade is past it, so the pins
  // that stand up are exactly the ones whose score lies above the blade.
  const pins: number[] = [];
  const picked: number[] = [];
  DOC_VECTORS.forEach((vector, doc) => {
    const score = Math.cos(((angleOf(vector) + turn) * Math.PI) / 180);
    const up = stored[doc] >= 1 ? clamp((score - CLEAR - bar) / POP) : 0;
    const eased = up * up * (3 - 2 * up);
    picked.push(eased);
    pins.push(PIN_FLUSH + (PIN_STORED - PIN_FLUSH) * stored[doc] + PIN_RANGE * eased);
  });

  const sunk = cards.map((place) => place !== null && place[2] < ENCODER_H - 0.05);
  return { turn, bar, pawl, pins, picked, cards, sunk, sliders, lit };
}

/** A pin's place on the floor for a table angle. */
export function pinPlace(doc: number, turn: number): [number, number] {
  const angle = ((angleOf(DOC_VECTORS[doc]) + turn) * Math.PI) / 180;
  return [CENTER[0] + UNIT * Math.cos(angle), CENTER[1] + UNIT * Math.sin(angle)];
}

/** True when a pin lies wholly on the viewer's side of the sweep beam, so it is drawn after it. */
export const inFrontOfBar = (x: number, bar: number) => x - PIN_R > railX(bar) + BEAM_HALF;

/** A pin of a given height, built at the world origin. */
export const pinOf = (height: number) => cylinder(0, 0, PIN_R, TOP, height, P, 24, 0.3);
/** The ring on a pin's top. */
export const capOf = (height: number) => ring(0, 0, 1.1, TOP + height, P, 14);

/** The table's radial T-slots, closed outlines that turn with it. */
export function slotsOf(turn: number): string {
  const paths: string[] = [];
  for (const local of [0, 90, 180, 270]) {
    const angle = ((local + 45 + turn) * Math.PI) / 180;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const points: Plane[] = [];
    const half = 1.7;
    for (const [r, from] of [
      [36, -90],
      [13, 90],
    ] as const) {
      for (let step = 0; step <= 8; step++) {
        const a = ((from + (180 * step) / 8) * Math.PI) / 180;
        const along = r + half * Math.cos(a);
        const across = half * Math.sin(a);
        points.push([CENTER[0] + ux * along - uy * across, CENTER[1] + uy * along + ux * across]);
      }
    }
    paths.push(onTop(points, TOP, P, true));
  }
  return paths.join("");
}
