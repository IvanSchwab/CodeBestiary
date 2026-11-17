import { boxCorners, fitProjection, iso, type Flat, type Plan, type Plane, type Point3 } from "../../iso/iso-kit";
import { DOC_VECTORS, QUERY_VECTORS, THRESHOLD } from "./model";

/**
 * World layout of the search bench. Units are about 1 px of the real thing:
 * x and y on the floor, z up. The viewer looks from +x, +y.
 *
 * A turntable holds one pin per stored vector, on a circle whose radius is
 * similarity 1. The encoder turns the table so the query's vector points
 * along +x, the rail's axis. A sweep bar then travels along the rail toward
 * the centre: its distance from the centre, read on the rail's scale, is the
 * cosine similarity of whatever lies under it, so it meets the pins in the
 * order of their score.
 */
export const WIDTH = 600;
export const HEIGHT = 320;
export const AZIMUTH = 45;

export const BASE: Plan = { x: -134, y: -90, w: 272, d: 166, r: 9 };
export const BASE_H = 9;
export const FOOT_H = 5;

/* The turntable. */
export const CENTER: Plane = [34, 2];
/** Radius of the pin circle: one unit of similarity. */
export const UNIT = 48;
export const BEZEL_R = 64;
export const BEZEL_H = 8;
export const TABLE_R = 58;
/** Top of the turning table. */
export const TOP = 12;
export const HUB_R = 7;
export const HUB_H = 2.4;

/* Pins: one per document, in a bore on the pin circle. */
export const PIN_R = 2.8;
export const BORE_R = 3.9;
/** Pin heights above the table: not stored yet, stored, and picked by the sweep. */
export const PIN_FLUSH = 0.5;
export const PIN_STORED = 3.2;
export const PIN_PICKED = 8;

/** How far the threshold stop's pawl lifts above the rail to stop the carriage. */
export const PAWL_UP = 4.4;

/* The rail and the sweep bar. */
export const RAIL_Y = -BEZEL_R - 12;
export const RAIL_H = 5;
export const RAIL: Plan = { x: CENTER[0] - UNIT - 24, y: RAIL_Y - 3, w: 2 * UNIT + 24 + 46, d: 6, r: 1 };
export const CARRIAGE: Plan = { x: -7.5, y: RAIL_Y - 6, w: 15, d: 12, r: 1.6 };
export const CARRIAGE_Z = RAIL_H;
export const CARRIAGE_H = 4;
/** The blade hangs from the beam, low enough to pass just over a stored pin. */
export const BLADE_HALF = 0.8;
export const BLADE_Z = TOP + PIN_STORED + 1.4;
export const BEAM_Z = TOP + PIN_PICKED + 1.8;
export const BEAM_H = 4.6;
export const BEAM_HALF = 3;
export const BEAM_END = UNIT + 8;

/** Where the bar parks, in similarity units: past 1, clear of every pin. */
export const PARK = 1.34;
/** How far past a pin the blade must be before the pin is released (similarity units). */
export const CLEAR = (PIN_R + BLADE_HALF + 0.9) / UNIT;
/** The stop at the threshold: the blade can go no lower than this. */
export const STOP = THRESHOLD - CLEAR;

/** Screen x of a similarity on the rail axis. */
export const railX = (similarity: number) => CENTER[0] + similarity * UNIT;

/* The encoder: a card goes in, two components come out. */
export const ENCODER: Plan = { x: -124, y: -40, w: 68, d: 80, r: 3 };
export const ENCODER_H = 20;
export const CARD_W = 22;
export const CARD_D = 14;
export const CARD_T = 0.9;
export const CARD_X = -103;
export const WELL_Y = 0;
export const DOC_TRAY_Y = -23;
export const QUERY_TRAY_Y = 23;
export const TRAY_T = 1.4;
/** Height of the top card's underside in a stack of `count` on a tray. */
export const stackZ = (position: number) => ENCODER_H + TRAY_T + position * CARD_T;
/** How deep a card sinks into the well before it is gone. */
export const SINK = 10;

/** Component sliders: one ruler per dimension, along y, ±1 over this many units. */
export const SLIDER_X = [-80, -69];
export const SLIDER_SPAN = 25;
export const SLIDER_Y = 0;

/** Every card in the figure: the documents first, then the queries. */
export const CARDS = [
  ...DOC_VECTORS.map((_, doc) => ({ kind: "doc" as const, index: doc, stack: DOC_VECTORS.length - 1 - doc })),
  ...QUERY_VECTORS.map((_, query) => ({ kind: "query" as const, index: query, stack: QUERY_VECTORS.length - 1 - query })),
];

export const P = fitProjection(
  [
    ...boxCorners(BASE, -BASE_H - FOOT_H, 0),
    ...boxCorners(ENCODER, 0, ENCODER_H + 12),
    [RAIL.x + RAIL.w, RAIL_Y, BEAM_Z + BEAM_H],
    [CENTER[0] - UNIT, RAIL_Y, BEAM_Z + BEAM_H],
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

/** Depth of a floor point (larger is nearer the viewer). */
export const nearness = (x: number, y: number) => x * Math.cos((AZIMUTH * Math.PI) / 180) + y * Math.sin((AZIMUTH * Math.PI) / 180);
