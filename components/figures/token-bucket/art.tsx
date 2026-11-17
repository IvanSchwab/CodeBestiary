import * as React from "react";
import type { Locale } from "@/lib/i18n";
import { Dots, Line, Solid } from "../../iso/react/draw";
import { BASE_ART, CABINET_ART, DRIVE_ART, INLET_ART, OUTLET_ART, TRACK_ART, TRAY_ART, TUBE_ART } from "./geometry";
import { TokenBucketLive } from "./live";

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
    {BASE_ART.rulers.map((paths, index) => (
      <Solid key={index} paths={paths} tone="lo" crease="none" />
    ))}
    <Line d={BASE_ART.rulerMinor} tone="lo" />
    <Line d={BASE_ART.rulerMajor} tone="mid" />
    <Solid paths={BASE_ART.label} tone="lo" crease="none" />
    <Line d={BASE_ART.labelLine} tone="faint" />
    <Line d={BASE_ART.labelRules} tone="lo" free />
    <Dots points={BASE_ART.labelScrews} size={0.45} tone="mid" />
  </g>
);

const CABINET = (
  <g key="cabinet">
    <Solid paths={CABINET_ART.plinth} tone="lo" />
    <Solid paths={CABINET_ART.body} tone="mid" inner={<Line d={CABINET_ART.seams} tone="faint" />} />
    <Line d={CABINET_ART.door} tone="lo" />
    <Dots points={CABINET_ART.doorScrews} size={0.45} tone="mid" />
    <Line d={CABINET_ART.vents} tone="lo" />
    <Line d={CABINET_ART.clockBezel} tone="mid" />
    <Line d={CABINET_ART.clockFace} tone="lo" />
    <Line d={CABINET_ART.clockMinor} tone="lo" />
    <Line d={CABINET_ART.clockMajor} tone="hi" />
    <Solid paths={CABINET_ART.cap} tone="mid" />
    <Line d={CABINET_ART.portCollar} tone="lo" />
    <Line d={CABINET_ART.port} tone="mid" />
    <Dots points={CABINET_ART.capScrews} size={0.45} tone="mid" />
    <Solid paths={CABINET_ART.housing} tone="mid" inner={<Line d={CABINET_ART.housingSeam} tone="faint" />} />
    <Line d={CABINET_ART.gland} tone="lo" />
    <Dots points={CABINET_ART.housingScrews} size={0.45} tone="mid" />
    <Solid paths={CABINET_ART.knob} tone="mid" />
    <Line d={CABINET_ART.knobKnurl} tone="lo" />
    <Line d={CABINET_ART.knobPointer} tone="hi" />
  </g>
);

const CLOCK_HUB = (
  <g key="clock-hub">
    <Dots points={CABINET_ART.clockHub} size={1} tone="hi" />
  </g>
);

const DRIVE = (
  <g key="drive">
    <Solid paths={DRIVE_ART.body} tone="mid" inner={<Line d={DRIVE_ART.seam} tone="faint" />} />
    <Dots points={DRIVE_ART.screws} size={0.45} tone="mid" />
    <Solid paths={DRIVE_ART.knob} tone="mid" />
    <Line d={DRIVE_ART.knurl} tone="lo" />
    <Line d={DRIVE_ART.pointer} tone="hi" />
  </g>
);

function Hood({ art }: { art: typeof OUTLET_ART }) {
  return (
    <>
      <Solid paths={art.body} tone="mid" inner={<Line d={art.seam} tone="faint" />} />
      <Line d={art.inset} tone="lo" />
      <Line d={art.slots} tone="lo" />
      <Dots points={art.screws} size={0.45} tone="mid" />
    </>
  );
}

const INLET = (
  <g key="inlet">
    <Hood art={INLET_ART} />
    {/* The opening is dark inside: the carrier waits in there. */}
    <path className="iso-shade" data-shade="0" d={INLET_ART.opening} />
    <Line d={INLET_ART.opening} tone="lo" />
  </g>
);

const OUTLET = (
  <g key="outlet">
    <Hood art={OUTLET_ART} />
  </g>
);

const TRACK = (
  <g key="track">
    <Solid paths={TRACK_ART.bed} tone="lo" />
    <Line d={TRACK_ART.ties} tone="faint" />
    {TRACK_ART.rails.map((paths, index) => (
      <Solid key={index} paths={paths} tone="mid" />
    ))}
    <Line d={INLET_ART.openingRails} tone="faint" />
    <Solid paths={TRACK_ART.trap} tone="mid" />
    <Line d={TRACK_ART.trapDoor} tone="lo" />
    <Line d={TRACK_ART.trapSplit} tone="lo" />
    <Dots points={TRACK_ART.trapScrews} size={0.4} tone="mid" />
    <Line d={TRACK_ART.gateSlot} tone="lo" />
  </g>
);

const TUBE_FRAME = (
  <g key="tube-frame">
    {TUBE_ART.postFeet.map((paths, index) => (
      <Solid key={index} paths={paths} tone="lo" />
    ))}
    {TUBE_ART.posts.map((paths, index) => (
      <Solid key={index} paths={paths} tone="mid" />
    ))}
    <Solid paths={TUBE_ART.plate} tone="mid" />
    <Line d={TUBE_ART.seat} tone="mid" />
    <Dots points={TUBE_ART.plateScrews} size={0.45} tone="mid" />
  </g>
);

const LATCH = (
  <g key="latch">
    <Solid paths={TUBE_ART.latch} tone="mid" />
    <Dots points={TUBE_ART.latchDot} size={0.5} tone="mid" />
  </g>
);

const ROD_BACK = (
  <g key="rod-back">
    <Solid paths={TUBE_ART.rodBack} tone="mid" crease="none" />
  </g>
);

const RODS_FRONT = (
  <g key="rods-front">
    {TUBE_ART.rodsSide.map((paths, index) => (
      <Solid key={index} paths={paths} tone="mid" crease="none" />
    ))}
    <Solid paths={TUBE_ART.rodFront} tone="mid" crease="none" />
    <Dots points={TUBE_ART.rodTips} size={0.55} tone="hi" />
    <Solid paths={TUBE_ART.gauge} tone="lo" inner={<Line d={TUBE_ART.gaugeLevels} tone="mid" />} />
  </g>
);

const TRAY = (
  <g key="tray">
    <Solid paths={TRAY_ART.body} tone="mid" inner={<Line d={TRAY_ART.seam} tone="faint" />} />
    <Line d={TRAY_ART.collar} tone="lo" />
    <Line d={TRAY_ART.port} tone="mid" />
    <Dots points={TRAY_ART.screws} size={0.45} tone="mid" />
  </g>
);

const HEAD = (
  <g key="head">
    <Solid paths={CABINET_ART.head} tone="mid" />
    <Dots points={CABINET_ART.headScrews} size={0.45} tone="mid" />
  </g>
);

export function TokenBucketArt({ lang }: { lang: Locale }) {
  return (
    <TokenBucketLive
      lang={lang}
      base={BASE}
      cabinet={CABINET}
      clockHub={CLOCK_HUB}
      drive={DRIVE}
      inlet={INLET}
      track={TRACK}
      tubeFrame={TUBE_FRAME}
      latch={LATCH}
      rodBack={ROD_BACK}
      rodsFront={RODS_FRONT}
      tray={TRAY}
      outlet={OUTLET}
      head={HEAD}
    />
  );
}
