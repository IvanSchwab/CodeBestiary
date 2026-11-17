import * as React from "react";
import type { Locale } from "@/lib/i18n";
import { Dots, Line, Solid, Wire } from "../../iso/react/draw";
import {
  BASE_ART,
  BAY_ART,
  CARRIAGE_ART,
  EJECTOR_ART,
  LANE_ART,
  LOAD_ART,
  MANIFOLD_ART,
  PUCK_ART,
  TANK_ART,
  TIMER_ART,
  WIRE_ART,
} from "./geometry";
import { ConnectionPoolLive } from "./live";
import { CLIENTS, type Client } from "./model";

/**
 * The static art, built on the server. Each constant is one slot of the
 * painter's order; the live component places them and moves the ones that move.
 * Every root has a stable key (see references/react.md in the Anatomy skill).
 */

const BASE = (
  <g key="base">
    <path className="iso-halo" d={BASE_ART.halo} />
    {BASE_ART.feet.map((parts, index) => (
      <g key={index}>
        {parts.map((paths, part) => (
          <Solid key={part} paths={paths} tone={part ? "mid" : "lo"} />
        ))}
      </g>
    ))}
    <Solid paths={BASE_ART.slab} tone="mid" />
    <Line d={BASE_ART.groove} tone="lo" />
    <Line d={BASE_ART.screwRings} tone="lo" />
    <Dots points={BASE_ART.screws} size={0.5} tone="mid" />
    <Wire from={WIRE_ART.timer.from} via={WIRE_ART.timer.via} to={WIRE_ART.timer.to} tone="lo" size={1} />
    <Wire from={WIRE_ART.load.from} via={WIRE_ART.load.via} to={WIRE_ART.load.to} tone="lo" size={1} />
    <Solid paths={BASE_ART.ruler} tone="lo" crease="none" />
    <Line d={BASE_ART.rulerMinor} tone="lo" />
    <Line d={BASE_ART.rulerMajor} tone="mid" />
    <Solid paths={BASE_ART.label} tone="lo" crease="none" />
    <Line d={BASE_ART.labelLine} tone="faint" />
    <Line d={BASE_ART.labelRules} tone="lo" free />
    <Dots points={BASE_ART.labelScrews} size={0.45} tone="mid" />
    <Solid paths={BASE_ART.pan} tone="mid" />
    <Line d={BASE_ART.panInset} tone="faint" />
    <Line d={BASE_ART.panSeat} tone="mid" />
    <Dots points={BASE_ART.panScrews} size={0.45} tone="mid" />
  </g>
);

function Dial({ art }: { art: typeof TIMER_ART }) {
  return (
    <>
      <Solid paths={art.stand} tone="lo" />
      <Dots points={art.standScrews} size={0.45} tone="mid" />
      <Solid paths={art.crown} tone="mid" />
      <Solid paths={art.puck} tone="hi" crease="lo" inner={<Line d={art.bandSeam} tone="faint" />} />
      <Line d={art.band} tone="lo" />
      <Line d={art.bezel} tone="lo" />
      <Line d={art.marksMinor} tone="lo" />
      <Line d={art.marksMajor} tone="mid" />
      <Line d={art.marksEnd} tone="hi" />
      <Line d={art.hub} tone="mid" />
    </>
  );
}

const TIMER = (
  <g key="timer">
    <Dial art={TIMER_ART} />
  </g>
);

const LOAD = (
  <g key="load">
    <Dial art={LOAD_ART} />
  </g>
);

const MANIFOLD = (
  <g key="manifold">
    <Solid paths={MANIFOLD_ART.block} tone="mid" inner={<Line d={MANIFOLD_ART.seams} tone="faint" />} />
    <Line d={MANIFOLD_ART.inset} tone="faint" />
    <Dots points={MANIFOLD_ART.screws} size={0.5} tone="mid" />
    {MANIFOLD_ART.ports.map((port, bay) => (
      <React.Fragment key={bay}>
        <path className="cp-void" d={port.opening} />
        <Dots points={port.pips} size={0.7} tone="hi" />
      </React.Fragment>
    ))}
  </g>
);

const TANK = (
  <g key="tank">
    <Solid paths={TANK_ART.duct} tone="mid" inner={<Line d={TANK_ART.ductSeam} tone="faint" />} />
    <Dots points={TANK_ART.ductScrews} size={0.45} tone="mid" />
    <Solid paths={TANK_ART.skirt} tone="lo" />
    <Solid paths={TANK_ART.body} tone="mid" inner={<Line d={TANK_ART.bands} tone="faint" />} />
    <Dots points={TANK_ART.bolts} size={0.5} tone="mid" />
    <Line d={TANK_ART.lidRing} tone="lo" />
    <Solid paths={TANK_ART.neck} tone="mid" />
    <Solid paths={TANK_ART.cap} tone="mid" />
    <Line d={TANK_ART.capKnurl} tone="lo" />
    <Line d={TANK_ART.capRing} tone="lo" />
  </g>
);

const SHUTTERS = MANIFOLD_ART.ports.map((port, bay) => (
  <g key={`shutter-${bay}`}>
    <Solid paths={port.shutter} tone="mid" crease="none" inner={<Line d={port.slats} tone="faint" />} />
    <Dots points={port.handle} size={0.6} tone="mid" />
  </g>
));

const EJECTOR = (
  <g key="ejector">
    <Solid paths={EJECTOR_ART.housing} tone="mid" inner={<Line d={EJECTOR_ART.seams} tone="faint" />} />
    <Line d={EJECTOR_ART.inset} tone="faint" />
    <Dots points={EJECTOR_ART.screws} size={0.45} tone="mid" />
  </g>
);

const PUSHER = (
  <g key="pusher">
    <Solid paths={EJECTOR_ART.plate} tone="mid" />
  </g>
);

const BAYS = (
  <g key="bays">
    {BAY_ART.map((bay, index) => (
      <g key={index}>
        <Line d={bay.ties} tone="faint" />
        {bay.rails.map((rail, side) => (
          <Solid key={side} paths={rail} tone="mid" />
        ))}
        <Solid paths={bay.bridge} tone="mid" />
        <Dots points={bay.bridgeScrews} size={0.45} tone="mid" />
      </g>
    ))}
  </g>
);

const CARRIAGE = (
  <g key="carriage">
    {CARRIAGE_ART.shoes.map((shoe, index) => (
      <Solid key={index} paths={shoe} tone="lo" crease="none" />
    ))}
    <Solid paths={CARRIAGE_ART.body} tone="mid" inner={<Line d={CARRIAGE_ART.seam} tone="faint" />} />
    <Line d={CARRIAGE_ART.seat} tone="mid" />
    <Dots points={CARRIAGE_ART.screws} size={0.45} tone="mid" />
  </g>
);

function Housing({ art }: { art: typeof LANE_ART.feed }) {
  return (
    <>
      <Solid paths={art.body} tone="mid" inner={<Line d={art.seams} tone="faint" />} />
      <Line d={art.inset} tone="faint" />
      <Line d={art.vent} tone="lo" />
      <Dots points={art.screws} size={0.45} tone="mid" />
    </>
  );
}

const FEED = (
  <g key="feed">
    <Housing art={LANE_ART.feed} />
    <path className="cp-void" d={LANE_ART.feedDoor} />
  </g>
);

const LANE = (
  <g key="lane">
    <Solid paths={LANE_ART.bed} tone="mid" inner={<Line d={LANE_ART.seam} tone="faint" />} />
    <Line d={LANE_ART.rollers} tone="faint" />
    <Line d={LANE_ART.edges} tone="lo" />
    <Line d={LANE_ART.seats} tone="mid" />
  </g>
);

const EXIT = (
  <g key="exit">
    <Housing art={LANE_ART.exit} />
  </g>
);

const PUCKS = Object.fromEntries(
  CLIENTS.map((client, index) => [
    client,
    <g key={`puck-${client}`}>
      <Solid paths={PUCK_ART.body} tone="hi" crease="lo" />
      <Line d={PUCK_ART.ring} tone="mid" />
      <Dots points={PUCK_ART.pips[index]} size={0.8} tone="hi" />
    </g>,
  ]),
) as Record<Client, React.ReactNode>;

export function ConnectionPoolArt({ lang }: { lang: Locale }) {
  return (
    <ConnectionPoolLive
      lang={lang}
      base={BASE}
      timer={TIMER}
      manifold={MANIFOLD}
      tank={TANK}
      shutters={SHUTTERS}
      ejector={EJECTOR}
      bays={BAYS}
      carriage={CARRIAGE}
      load={LOAD}
      feed={FEED}
      lane={LANE}
      pusher={PUSHER}
      pucks={PUCKS}
      exit={EXIT}
      clips={{ ports: MANIFOLD_ART.ports.map((port) => port.clip), feed: LANE_ART.feedClip }}
    />
  );
}
