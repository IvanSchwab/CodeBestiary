import * as React from "react";
import type { Locale } from "@/lib/i18n";
import { Dots, Line, Solid } from "../../iso/react/draw";
import {
  BAR_ART,
  BASE_ART,
  BORE_ART,
  CARD_ART,
  DRIVE_ART,
  ENCODER_ART,
  PAWL_ART,
  RAIL_ART,
  SLIDER_ART,
  TABLE_ART,
  WELL_CLIP,
} from "./geometry";
import { EmbeddingsVectorSearchLive } from "./live";
import { CARDS } from "./view";

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
    <Solid paths={BASE_ART.label} tone="lo" crease="none" />
    <Line d={BASE_ART.labelLine} tone="faint" />
    <Line d={BASE_ART.labelRules} tone="lo" free />
    <Dots points={BASE_ART.labelScrews} size={0.45} tone="mid" />
  </g>
);

function Tray({ art, posts }: { art: typeof ENCODER_ART.docTray; posts: boolean }) {
  return (
    <>
      {posts ? null : <Solid paths={art.plate} tone="lo" />}
      {posts ? null : <Dots points={art.screws} size={0.45} tone="mid" />}
      {posts
        ? art.posts.map((post, index) => <Solid key={index} paths={post} tone="mid" />)
        : null}
      {posts ? <Line d={art.postCaps} tone="lo" /> : null}
    </>
  );
}

const ENCODER = (
  <g key="encoder">
    <Solid paths={ENCODER_ART.housing} tone="mid" inner={<Line d={ENCODER_ART.seams} tone="faint" />} />
    <Line d={ENCODER_ART.vents} tone="lo" />
    <Line d={ENCODER_ART.inset} tone="faint" />
    <Dots points={ENCODER_ART.screws} size={0.5} tone="mid" />
    <Line d={ENCODER_ART.wellRim} tone="lo" />
    <path className="vs-void" d={ENCODER_ART.well} />
    <path className="iso-shade vs-wall" data-shade={1} d={ENCODER_ART.wellWalls[0]} clipPath="url(#vs-well)" />
    <path className="iso-shade vs-wall" data-shade={2} d={ENCODER_ART.wellWalls[1]} clipPath="url(#vs-well)" />
    <path className="vs-void-edge" d={ENCODER_ART.well} />
    {ENCODER_ART.strips.map((strip, index) => (
      <React.Fragment key={index}>
        <Solid paths={strip} tone="lo" crease="none" />
        <Line d={ENCODER_ART.stripTicks[index].minor} tone="lo" />
        <Line d={ENCODER_ART.stripTicks[index].major} tone="mid" />
      </React.Fragment>
    ))}
    <Tray art={ENCODER_ART.docTray} posts={false} />
    <Tray art={ENCODER_ART.docTray} posts />
    <Tray art={ENCODER_ART.queryTray} posts={false} />
  </g>
);

const QUERY_POSTS = (
  <g key="query-posts">
    <Tray art={ENCODER_ART.queryTray} posts />
  </g>
);

const SLIDER = (
  <g key="slider">
    <Solid paths={SLIDER_ART.block} tone="hi" crease="lo" />
    <Line d={SLIDER_ART.mark} tone="hi" />
  </g>
);

const DRIVE = (
  <g key="drive">
    <Solid paths={DRIVE_ART.bar} tone="mid" inner={<Line d={DRIVE_ART.seam} tone="faint" />} />
    {DRIVE_ART.couplings.map((coupling, index) => (
      <Solid key={index} paths={coupling} tone="mid" />
    ))}
    <Dots points={DRIVE_ART.couplingScrews} size={0.5} tone="mid" />
  </g>
);

const RAIL = (
  <g key="rail">
    <Solid paths={RAIL_ART.strip} tone="lo" crease="none" />
    <Line d={RAIL_ART.scaleMinor} tone="lo" />
    <Line d={RAIL_ART.scaleMajor} tone="mid" />
    <Line d={RAIL_ART.scaleMark} tone="hi" />
    <Solid paths={RAIL_ART.stop} tone="mid" />
    <Dots points={RAIL_ART.stopScrews} size={0.45} tone="mid" />
    <Solid paths={RAIL_ART.rail} tone="mid" inner={<Line d={RAIL_ART.railSeam} tone="faint" />} />
    <Line d={RAIL_ART.railGroove} tone="lo" />
    {RAIL_ART.ends.map((end, index) => (
      <Solid key={index} paths={end} tone="mid" />
    ))}
    <Dots points={RAIL_ART.endScrews} size={0.45} tone="mid" />
  </g>
);

const PAWL = (
  <g key="pawl">
    <Solid paths={PAWL_ART.pawl} tone="hi" crease="lo" />
  </g>
);

const CARRIAGE = (
  <g key="carriage">
    <Solid paths={BAR_ART.pointer} tone="mid" />
    <Line d={BAR_ART.pointerMark} tone="hi" free="end" />
    <Solid paths={BAR_ART.carriage} tone="mid" inner={<Line d={BAR_ART.carriageSeam} tone="faint" />} />
    <Dots points={BAR_ART.carriageScrews} size={0.45} tone="mid" />
    <Solid paths={BAR_ART.upright} tone="mid" inner={<Line d={BAR_ART.uprightSeam} tone="faint" />} />
    <Solid paths={BAR_ART.knob} tone="mid" />
    <Line d={BAR_ART.knobKnurl} tone="lo" />
  </g>
);

const TABLE = (
  <g key="table">
    <Solid paths={TABLE_ART.bezel} tone="mid" inner={<Line d={TABLE_ART.bezelSeam} tone="faint" />} />
    <Line d={TABLE_ART.bezelMinor} tone="lo" />
    <Line d={TABLE_ART.bezelMajor} tone="mid" />
    <Line d={TABLE_ART.bezelZero} tone="hi" />
    <Solid paths={TABLE_ART.table} tone="mid" inner={<Line d={TABLE_ART.tableSeam} tone="faint" />} />
    <Line d={TABLE_ART.unit} tone="faint" />
    <Solid paths={TABLE_ART.hub} tone="mid" />
    <Line d={TABLE_ART.hubRing} tone="lo" />
    <Dots points={TABLE_ART.hubScrews} size={0.45} tone="mid" />
  </g>
);

const BORE = (
  <g key="bore">
    <Line d={BORE_ART.bore} tone="lo" />
  </g>
);

const BEAM = (
  <g key="beam">
    <Solid paths={BAR_ART.beam} tone="mid" inner={<Line d={BAR_ART.beamSeam} tone="faint" />} />
    <Dots points={BAR_ART.beamScrews} size={0.45} tone="mid" />
  </g>
);

const BLADE = (
  <g key="blade">
    <Solid paths={BAR_ART.blade} tone="hi" crease="lo" />
  </g>
);

const CARD_ELEMENTS = CARDS.map((card, index) => (
  <g key={`card-${index}`}>
    <Solid paths={CARD_ART.body} tone="hi" crease="lo" />
    {card.kind === "doc" ? (
      <Line d={CARD_ART.docRules} tone="lo" free />
    ) : (
      <>
        <Line d={CARD_ART.queryRules} tone="lo" free />
        <Line d={CARD_ART.queryPunch} tone="mid" />
      </>
    )}
  </g>
));

export function EmbeddingsVectorSearchArt({ lang }: { lang: Locale }) {
  return (
    <EmbeddingsVectorSearchLive
      lang={lang}
      base={BASE}
      encoder={ENCODER}
      queryPosts={QUERY_POSTS}
      slider={SLIDER}
      drive={DRIVE}
      rail={RAIL}
      pawl={PAWL}
      carriage={CARRIAGE}
      table={TABLE}
      bore={BORE}
      beam={BEAM}
      blade={BLADE}
      cards={CARD_ELEMENTS}
      wellClip={WELL_CLIP}
    />
  );
}
