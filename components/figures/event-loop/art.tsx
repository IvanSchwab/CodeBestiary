import * as React from "react";
import type { Locale } from "@/lib/i18n";
import { Dots, Line, Solid } from "../../iso/react/draw";
import {
  ARM_ART,
  BASE_ART,
  DECK_ART,
  DIAL_ART,
  HUB_ART,
  MICRO_LANE_ART,
  PRESS_ART,
  TASK_LANE_ART,
  TOKEN_ART,
} from "./geometry";
import { EventLoopLive } from "./live";

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
    <Solid paths={BASE_ART.ruler} tone="lo" crease="none" />
    <Line d={BASE_ART.rulerMinor} tone="lo" />
    <Line d={BASE_ART.rulerMajor} tone="mid" />
    <Solid paths={BASE_ART.shortRuler} tone="lo" crease="none" />
    <Line d={BASE_ART.shortRulerMinor} tone="lo" />
    <Line d={BASE_ART.shortRulerMajor} tone="mid" />
    <Solid paths={BASE_ART.label} tone="lo" crease="none" />
    <Line d={BASE_ART.labelLine} tone="faint" />
    <Line d={BASE_ART.labelRules} tone="lo" free />
    <Dots points={BASE_ART.labelScrews} size={0.45} tone="mid" />
  </g>
);

function Lane({ art }: { art: typeof TASK_LANE_ART }) {
  return (
    <>
      {art.stop ? <Solid paths={art.stop} tone="mid" /> : null}
      <Dots points={art.stopScrews} size={0.45} tone="mid" />
      <Solid paths={art.bed} tone="mid" inner={<Line d={art.seam} tone="faint" />} />
      <Line d={art.rollers} tone="faint" />
      <Line d={art.edges} tone="lo" />
      <Line d={art.seats} tone="mid" />
      {art.feeler ? <Solid paths={art.feeler} tone="mid" crease="none" /> : null}
      <Dots points={art.feelerTip} size={0.5} tone="hi" />
    </>
  );
}

const TASK_LANE = (
  <g key="task-lane">
    <Lane art={TASK_LANE_ART} />
  </g>
);

const MICRO_LANE = (
  <g key="micro-lane">
    <Lane art={MICRO_LANE_ART} />
  </g>
);

const POST = (
  <g key="post">
    <Solid paths={PRESS_ART.foot} tone="lo" />
    <Dots points={PRESS_ART.footScrews} size={0.45} tone="mid" />
    <Solid paths={PRESS_ART.post} tone="mid" inner={<Line d={PRESS_ART.postSeams} tone="faint" />} />
    <Solid paths={PRESS_ART.postCap} tone="mid" />
    <Solid paths={PRESS_ART.brace} tone="mid" />
    <Dots points={PRESS_ART.braceScrew} size={0.45} tone="mid" />
  </g>
);

const DECK = (
  <g key="deck">
    <Solid paths={DECK_ART.anvil} tone="mid" inner={<Line d={DECK_ART.anvilSeam} tone="faint" />} />
    <Line d={DECK_ART.anvilSeat} tone="mid" />
    <Dots points={DECK_ART.anvilScrews} size={0.45} tone="mid" />
    <Lane art={DECK_ART.tray} />
  </g>
);

const HUB = (
  <g key="hub">
    <Solid paths={HUB_ART.pedestal} tone="mid" />
    <Line d={HUB_ART.ticksMinor} tone="lo" />
    <Line d={HUB_ART.ticksMajor} tone="mid" />
    <Dots points={HUB_ART.bolts} size={0.5} tone="mid" />
    {HUB_ART.pinsBack.map((paths, index) => (
      <Solid key={index} paths={paths} tone="mid" crease="none" />
    ))}
    <Solid paths={HUB_ART.boss} tone="mid" />
    {HUB_ART.pinsFront.map((paths, index) => (
      <Solid key={index} paths={paths} tone="mid" crease="none" />
    ))}
    <Solid paths={HUB_ART.column} tone="mid" crease="none" inner={<Line d={HUB_ART.columnSeams} tone="faint" />} />
  </g>
);

const CAP = (
  <g key="cap">
    <Solid paths={HUB_ART.cap} tone="mid" />
    <Line d={HUB_ART.capKnurl} tone="lo" />
    <Line d={HUB_ART.capRing} tone="lo" />
  </g>
);

const DIAL = (
  <g key="dial">
    <Solid paths={DIAL_ART.stand} tone="lo" />
    <Dots points={DIAL_ART.standScrews} size={0.45} tone="mid" />
    <Solid paths={DIAL_ART.crown} tone="mid" />
    <Solid paths={DIAL_ART.puck} tone="hi" crease="lo" inner={<Line d={DIAL_ART.bandSeam} tone="faint" />} />
    <Line d={DIAL_ART.band} tone="lo" />
    <Line d={DIAL_ART.bezel} tone="lo" />
    <Line d={DIAL_ART.marksMinor} tone="lo" />
    <Line d={DIAL_ART.marksMajor} tone="hi" />
    <Line d={DIAL_ART.hub} tone="mid" />
  </g>
);

const ARM_PAD = (
  <g key="arm-pad">
    <Solid paths={ARM_ART.pad} tone="lo" />
  </g>
);

const ARM_WEIGHT = (
  <g key="arm-weight">
    <Solid paths={ARM_ART.weight} tone="mid" />
    <Line d={ARM_ART.weightKnurl} tone="lo" />
  </g>
);

const ARM_HEAD = (
  <g key="arm-head">
    <Solid paths={ARM_ART.head} tone="mid" inner={<Line d={ARM_ART.headSeam} tone="faint" />} />
    <Line d={ARM_ART.headRing} tone="lo" />
    <Solid paths={ARM_ART.headNut} tone="mid" crease="none" />
    <Dots points={ARM_ART.headScrew} size={0.5} tone="mid" />
  </g>
);

const ARM_COLLAR = (
  <g key="arm-collar">
    <Solid paths={ARM_ART.collar} tone="mid" inner={<Line d={ARM_ART.collarSeam} tone="faint" />} />
  </g>
);

const PRESS_HEAD = (
  <g key="press-head">
    <Solid paths={PRESS_ART.ram} tone="hi" crease="lo" inner={<Line d={PRESS_ART.ramSeam} tone="faint" />} />
    <Solid paths={PRESS_ART.head} tone="mid" inner={<Line d={PRESS_ART.headSeam} tone="faint" />} />
    <Line d={PRESS_ART.headInset} tone="faint" />
    <Dots points={PRESS_ART.headScrews} size={0.5} tone="mid" />
    <Solid paths={PRESS_ART.knob} tone="mid" />
    <Line d={PRESS_ART.knobKnurl} tone="lo" />
    <Line d={PRESS_ART.knobPointer} tone="hi" />
    <Line d={PRESS_ART.boss} tone="lo" />
    <Dots points={PRESS_ART.bossDot} size={0.5} tone="mid" />
  </g>
);

const TOKEN_SCRIPT = (
  <g key="token-script">
    <Solid paths={TOKEN_ART.round} tone="hi" crease="lo" />
    <Line d={TOKEN_ART.roundRing} tone="mid" />
    <Line d={TOKEN_ART.scriptRing} tone="mid" />
  </g>
);

const TOKEN_TIMEOUT = (
  <g key="token-timeout">
    <Solid paths={TOKEN_ART.round} tone="hi" crease="lo" />
    <Line d={TOKEN_ART.roundRing} tone="mid" />
    <Dots points={TOKEN_ART.timeoutDot} size={0.8} tone="hi" />
  </g>
);

const TOKEN_PROMISE = (
  <g key="token-promise">
    <Solid paths={TOKEN_ART.square} tone="hi" crease="lo" />
    <Line d={TOKEN_ART.squareInset} tone="mid" />
    <Dots points={TOKEN_ART.squareDot} size={0.8} tone="hi" />
  </g>
);

export function EventLoopArt({ lang }: { lang: Locale }) {
  return (
    <EventLoopLive
      lang={lang}
      base={BASE}
      taskLane={TASK_LANE}
      post={POST}
      microLane={MICRO_LANE}
      deck={DECK}
      hub={HUB}
      cap={CAP}
      dial={DIAL}
      armPad={ARM_PAD}
      armWeight={ARM_WEIGHT}
      armHead={ARM_HEAD}
      armCollar={ARM_COLLAR}
      pressHead={PRESS_HEAD}
      tokens={{ script: TOKEN_SCRIPT, timeout: TOKEN_TIMEOUT, promise: TOKEN_PROMISE }}
    />
  );
}
