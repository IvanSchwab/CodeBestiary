import * as React from "react";
import type { Locale } from "@/lib/i18n";
import { Dots, Line, Solid } from "../../iso/react/draw";
import {
  ATT_ART,
  BAR_ART,
  BASE_ART,
  BIN_ART,
  CABINET_ART,
  CAB_SEAL_ART,
  CARD_ART,
  CHUTE_ART,
  CLIPS,
  FLAG_ART,
  HOOD_ART,
  LANE_ART,
  LOCK_ART,
  PANEL_ART,
  RACK_ART,
  STUB_ART,
  TAG_ART,
  TRAY_ART,
  UPRIGHT_ART,
} from "./geometry";
import { JwtRefreshTokensLive } from "./live";
import { CARD_COUNT, TAG_COUNT } from "./model";

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
    <Solid paths={BASE_ART.label} tone="lo" crease="none" />
    <Line d={BASE_ART.labelLine} tone="faint" />
    <Line d={BASE_ART.labelRules} tone="lo" free />
    <Dots points={BASE_ART.labelScrews} size={0.45} tone="mid" />
  </g>
);

function Seal({ art }: { art: typeof CAB_SEAL_ART }) {
  return (
    <>
      <Solid paths={art.boss} tone="mid" />
      <Line d={art.face} tone="lo" />
      <Line d={art.mark} tone="hi" />
      <Dots points={art.dot} size={0.6} tone="hi" />
    </>
  );
}

/** The cabinet, its rack and the near upright's twin at the far end. Stubs and bar go between. */
const CABINET = (
  <g key="cabinet">
    <Solid paths={CABINET_ART.plinth} tone="lo" />
    <Solid paths={CABINET_ART.body} tone="mid" inner={<Line d={CABINET_ART.seams} tone="faint" />} />
    {CABINET_ART.slots.map((slot, index) => (
      <React.Fragment key={index}>
        <Line d={slot.frame} tone="lo" />
        <path className="jw-void" d={slot.opening} />
      </React.Fragment>
    ))}
    <Line d={CABINET_ART.frontSlot.frame} tone="lo" />
    <path className="jw-void" d={CABINET_ART.frontSlot.opening} />
    <Line d={CABINET_ART.vents} tone="lo" />
    <Line d={CABINET_ART.inset} tone="faint" />
    <Dots points={CABINET_ART.screws} size={0.5} tone="mid" />
    <Solid paths={RACK_ART.block} tone="mid" inner={<Line d={RACK_ART.seam} tone="faint" />} />
    {RACK_ART.slots.map((slot, index) => (
      <path key={index} className="jw-void" d={slot} />
    ))}
    <Dots points={RACK_ART.pipDots} size={0.55} tone="hi" />
    <Dots points={RACK_ART.screws} size={0.45} tone="mid" />
    <Solid paths={UPRIGHT_ART[0].post} tone="mid" inner={<Line d={UPRIGHT_ART[0].seam} tone="faint" />} />
    <path className="jw-void" d={UPRIGHT_ART[0].slot} />
    <Line d={UPRIGHT_ART[0].capRing} tone="lo" />
    <Dots points={UPRIGHT_ART[0].cap} size={0.45} tone="mid" />
  </g>
);

const STUBS = STUB_ART.map((stub, slot) => (
  <g key={`stub-${slot}`}>
    <Solid paths={stub.body} tone="hi" crease="lo" />
    <path className="jw-void" d={stub.hole} />
    <Dots points={stub.pips} size={0.5} tone="hi" />
  </g>
));

const BAR = (
  <g key="bar">
    <Solid paths={BAR_ART.bar} tone="mid" />
    <Dots points={BAR_ART.screws} size={0.45} tone="mid" />
    <Solid paths={BAR_ART.grip} tone="mid" />
    <Line d={BAR_ART.gripKnurl} tone="lo" />
  </g>
);

const CABINET_FRONT = (
  <g key="cabinet-front">
    <Solid paths={UPRIGHT_ART[1].post} tone="mid" inner={<Line d={UPRIGHT_ART[1].seam} tone="faint" />} />
    <Line d={UPRIGHT_ART[1].capRing} tone="lo" />
    <Dots points={UPRIGHT_ART[1].cap} size={0.45} tone="mid" />
    <Seal art={CAB_SEAL_ART} />
  </g>
);

function Lane({ art }: { art: typeof LANE_ART.tag }) {
  return (
    <>
      <Solid paths={art.bed} tone="mid" />
      <Line d={art.groove} tone="faint" />
      {art.lips.map((lip, index) => (
        <Solid key={index} paths={lip} tone="mid" crease="none" />
      ))}
    </>
  );
}

const LANES_BACK = (
  <g key="lanes-back">
    <Solid paths={CHUTE_ART.bed} tone="mid" />
    <Line d={CHUTE_ART.groove} tone="faint" />
    {CHUTE_ART.lips.map((lip, index) => (
      <Solid key={index} paths={lip} tone="mid" crease="none" />
    ))}
    <Solid paths={TRAY_ART.backstop} tone="mid" inner={<Line d={TRAY_ART.backSeam} tone="faint" />} />
    <Solid paths={TRAY_ART.backLabel} tone="lo" crease="none" />
    <Line d={TRAY_ART.backRules} tone="lo" free />
    <Dots points={TRAY_ART.backScrews} size={0.45} tone="mid" />
    <Lane art={LANE_ART.tag} />
    <Lane art={LANE_ART.card} />
    <Solid paths={TRAY_ART.tray} tone="mid" />
    <Line d={TRAY_ART.seats} tone="faint" />
    <Dots points={TRAY_ART.screws} size={0.45} tone="mid" />
    <Lane art={LANE_ART.reader} />
    <Solid paths={BIN_ART.floor} tone="lo" />
    <Solid paths={BIN_ART.back} tone="mid" crease="none" />
    <Solid paths={BIN_ART.left} tone="mid" crease="none" />
  </g>
);

const BIN_FRONT = (
  <g key="bin-front">
    <Solid paths={BIN_ART.right} tone="mid" crease="none" />
    <Solid paths={BIN_ART.front} tone="mid" crease="none" />
    <Dots points={BIN_ART.screws} size={0.4} tone="mid" />
  </g>
);

const CARDS = Array.from({ length: CARD_COUNT }, (_, index) => (
  <g key={`card-${index}`}>
    <Solid paths={CARD_ART.body} tone="hi" crease="lo" />
    <Line d={CARD_ART.joints} tone="lo" />
    <Line d={CARD_ART.claims} tone="lo" free />
    <Line d={CARD_ART.seal} tone="mid" />
    <Dots points={CARD_ART.sealDot} size={0.5} tone="hi" />
    <Dots points={CARD_ART.pips[index % 2]} size={0.55} tone="hi" />
  </g>
));

const TAGS = Array.from({ length: TAG_COUNT }, (_, index) => (
  <g key={`tag-${index}`}>
    <Solid paths={TAG_ART.body} tone="hi" crease="lo" />
    <path className="jw-void" d={TAG_ART.hole} />
    <Dots points={TAG_ART.pips[index % 2]} size={0.6} tone="hi" />
  </g>
));

/** The stolen copy is R1: one pip, like the original. */
const ATTACKER = (
  <g key="attacker">
    <Solid paths={ATT_ART.body} tone="hi" crease="lo" />
    <path className="jw-void" d={ATT_ART.hole} />
    <Dots points={ATT_ART.pips[0]} size={0.6} tone="hi" />
  </g>
);

const LOCK = (
  <g key="lock">
    <Solid paths={LOCK_ART.plinth} tone="lo" />
    <Solid paths={LOCK_ART.body} tone="mid" inner={<Line d={LOCK_ART.seams} tone="faint" />} />
    <path className="jw-void" d={LOCK_ART.opening} />
    <Line d={LOCK_ART.inset} tone="faint" />
    <Dots points={LOCK_ART.screws} size={0.5} tone="mid" />
    <Solid paths={LOCK_ART.throat} tone="mid" inner={<Line d={LOCK_ART.throatSeam} tone="faint" />} />
    <Dots points={LOCK_ART.throatScrews} size={0.45} tone="mid" />
    <path className="jw-void" d={LOCK_ART.flagSlot} />
    <Seal art={LOCK_ART.seal} />
    <Solid paths={LOCK_ART.dial.stand} tone="lo" />
    <Dots points={LOCK_ART.dial.standScrews} size={0.45} tone="mid" />
    <Solid paths={LOCK_ART.dial.crown} tone="mid" />
    <Solid paths={LOCK_ART.dial.puck} tone="hi" crease="lo" inner={<Line d={LOCK_ART.dial.bandSeam} tone="faint" />} />
    <Line d={LOCK_ART.dial.band} tone="lo" />
    <Line d={LOCK_ART.dial.bezel} tone="lo" />
    <Line d={LOCK_ART.dial.minor} tone="lo" />
    <Line d={LOCK_ART.dial.major} tone="mid" />
    <Line d={LOCK_ART.dial.zero} tone="hi" />
    <Line d={LOCK_ART.dial.hub} tone="mid" />
  </g>
);

const FLAG = (
  <g key="flag">
    <Solid paths={FLAG_ART.body} tone="hi" crease="lo" />
    <Line d={FLAG_ART.ring} tone="mid" />
    <Line d={FLAG_ART.bar} tone="mid" />
  </g>
);

const PANEL = (
  <g key="panel">
    <Solid paths={PANEL_ART.panel} tone="mid" />
    <Line d={PANEL_ART.holder} tone="lo" />
    <Dots points={PANEL_ART.rivets} size={0.45} tone="mid" />
    <Solid paths={PANEL_ART.pull} tone="mid" />
  </g>
);

const HOOD = (
  <g key="hood">
    <Solid paths={HOOD_ART.body} tone="mid" inner={<Line d={HOOD_ART.seams} tone="faint" />} />
    <Line d={HOOD_ART.inset} tone="faint" />
    <Line d={HOOD_ART.hatch} tone="lo" />
    <Dots points={HOOD_ART.hatchBolts} size={0.5} tone="mid" />
    <Dots points={HOOD_ART.screws} size={0.45} tone="mid" />
  </g>
);

export function JwtRefreshTokensArt({ lang }: { lang: Locale }) {
  return (
    <JwtRefreshTokensLive
      lang={lang}
      base={BASE}
      cabinet={CABINET}
      stubs={STUBS}
      bar={BAR}
      cabinetFront={CABINET_FRONT}
      lanes={LANES_BACK}
      tags={TAGS}
      cards={CARDS}
      attacker={ATTACKER}
      binFront={BIN_FRONT}
      lock={LOCK}
      flag={FLAG}
      panel={PANEL}
      hood={HOOD}
      clips={{ ...CLIPS, stubs: STUB_ART.map((stub) => stub.clip), flag: FLAG_ART.clip }}
    />
  );
}
