import * as React from "react";
import type { Locale } from "@/lib/i18n";
import { Dots, Line, Solid } from "../../iso/react/draw";
import { BASE_ART, COUNT_ART, DOUBLE_ART, EFFECT_ART, PIN_ART, SHOW_ART } from "./geometry";
import { VueReactivityLive } from "./live";

/**
 * The static art, built on the server. Each constant is one slot of the
 * painter's order; the live component places them and moves the ones that
 * move. Every root has a stable key (see references/react.md in the skill).
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
    <Solid paths={BASE_ART.rule} tone="lo" crease="none" />
    <Line d={BASE_ART.ruleMinor} tone="lo" />
    <Line d={BASE_ART.ruleMajor} tone="mid" />
    <Solid paths={BASE_ART.label} tone="lo" crease="none" />
    <Line d={BASE_ART.labelLine} tone="faint" />
    <Line d={BASE_ART.labelRules} tone="lo" free />
    <Dots points={BASE_ART.labelScrews} size={0.45} tone="mid" />
  </g>
);

type Seamed = { slab: typeof EFFECT_ART.legL.slab; seam: string };
const Seamed = ({ part, tone = "mid" }: { part: Seamed; tone?: "mid" | "lo" }) => (
  <Solid paths={part.slab} tone={tone} inner={<Line d={part.seam} tone="faint" />} />
);

/* The effect's bell housing, legs to bell. The tongues are moved by the live component. */

const EFFECT_BACK = (
  <g key="effect-back">
    <Seamed part={EFFECT_ART.wayA} tone="lo" />
    <Seamed part={EFFECT_ART.wayB} tone="lo" />
    <Seamed part={EFFECT_ART.legL} />
  </g>
);

const TONGUE_A = (
  <g key="tongue-a">
    <Solid paths={EFFECT_ART.tongueA} tone="mid" />
  </g>
);

const EFFECT_MIDDLE = (
  <g key="effect-middle">
    <Seamed part={EFFECT_ART.legM} />
  </g>
);

const TONGUE_B = (
  <g key="tongue-b">
    <Solid paths={EFFECT_ART.tongueB} tone="mid" />
  </g>
);

const EFFECT_TOP = (
  <g key="effect-top">
    <Seamed part={EFFECT_ART.legR} />
    <Dots points={EFFECT_ART.mouthScrews} size={0.45} tone="mid" />
    <Solid paths={EFFECT_ART.deck} tone="mid" inner={<Line d={EFFECT_ART.deckSeam} tone="faint" />} />
    <Line d={EFFECT_ART.deckInset} tone="faint" />
    <Dots points={EFFECT_ART.deckScrews} size={0.5} tone="mid" />
    <Line d={EFFECT_ART.grille} tone="lo" />
    <Dots points={EFFECT_ART.grilleDots} size={0.6} tone="lo" />
    <Solid paths={EFFECT_ART.bellFlange} tone="mid" />
    <Dots points={EFFECT_ART.bellBolts} size={0.45} tone="mid" />
    <Solid
      paths={EFFECT_ART.bellBody}
      tone="hi"
      crease="lo"
      className="vr-bell"
      inner={<Line d={EFFECT_ART.bellSeam} tone="faint" />}
    />
    <Solid paths={EFFECT_ART.bellShoulder} tone="hi" crease="lo" />
    <Solid paths={EFFECT_ART.bellCrown} tone="mid" />
    <Solid paths={EFFECT_ART.bellNut} tone="mid" crease="none" />
    <Dots points={EFFECT_ART.bellNutDot} size={0.5} tone="mid" />
  </g>
);

const STRIKER = (
  <g key="striker">
    <Solid paths={EFFECT_ART.strikerShaft} tone="mid" crease="none" />
    <Solid paths={EFFECT_ART.strikerHead} tone="mid" />
  </g>
);

const STRIKER_BLOCK = (
  <g key="striker-block">
    <Solid paths={EFFECT_ART.strikerBlock} tone="mid" inner={<Line d={EFFECT_ART.strikerSeam} tone="faint" />} />
    <Line d={EFFECT_ART.strikerInset} tone="faint" />
    <Dots points={EFFECT_ART.strikerScrews} size={0.45} tone="mid" />
  </g>
);

/* Guides: the saddle and far wall go under a rod, the near wall over it. */

type Guide = typeof DOUBLE_ART.guide;
const guideBack = (guide: Guide, key: string) => (
  <g key={key}>
    <Solid paths={guide.saddle} tone="lo" />
    <Solid paths={guide.back} tone="mid" />
  </g>
);
const guideFront = (guide: Guide, key: string) => (
  <g key={key}>
    <Solid paths={guide.front} tone="mid" />
    <Dots points={guide.screws} size={0.45} tone="mid" />
  </g>
);

/* The computed. */

const DOUBLE_BACK = (
  <g key="double-back">
    {guideBack(DOUBLE_ART.guide, "guide")}
    <Seamed part={DOUBLE_ART.way} tone="lo" />
    <Seamed part={DOUBLE_ART.legBack} />
  </g>
);

const SLIDER = (
  <g key="slider">
    <Solid paths={DOUBLE_ART.tongue} tone="mid" />
    <Solid paths={DOUBLE_ART.rod} tone="mid" />
    <Line d={DOUBLE_ART.eye.slot} tone="lo" />
    <Dots points={DOUBLE_ART.eye.rivets} size={0.45} tone="mid" />
  </g>
);

const DOUBLE_FRONT = (
  <g key="double-front">
    {guideFront(DOUBLE_ART.guide, "guide")}
    <Seamed part={DOUBLE_ART.legFront} />
    <Solid paths={DOUBLE_ART.deck} tone="mid" inner={<Line d={DOUBLE_ART.deckSeam} tone="faint" />} />
    <Line d={DOUBLE_ART.deckInset} tone="faint" />
    <Dots points={DOUBLE_ART.deckScrews} size={0.5} tone="mid" />
    <Solid paths={DOUBLE_ART.plate} tone="lo" crease="none" />
    <Line d={DOUBLE_ART.plateRules} tone="lo" free />
    <Line d={DOUBLE_ART.flagSeat} tone="faint" />
    <Solid paths={DOUBLE_ART.flagCollar} tone="mid" />
    <Solid paths={DOUBLE_ART.scale.strip} tone="lo" crease="none" />
    <Line d={DOUBLE_ART.scale.minor} tone="lo" />
    <Line d={DOUBLE_ART.scale.major} tone="mid" />
  </g>
);

const FLAG = (
  <g key="flag">
    <Solid paths={DOUBLE_ART.flag} tone="hi" crease="lo" />
    <Line d={DOUBLE_ART.flagRing} tone="mid" />
    <Dots points={DOUBLE_ART.flagDot} size={0.6} tone="hi" />
  </g>
);

const registerOf = (scale: typeof DOUBLE_ART.scale, key: string, className: string, tone: "hi" | "mid" = "mid") => (
  <g key={key}>
    <Solid paths={scale.cursor} tone={tone} crease={tone === "hi" ? "lo" : "faint"} className={className} />
    <Line d={scale.cursorLine} tone="lo" />
  </g>
);

const DOUBLE_CURSOR = registerOf(DOUBLE_ART.scale, "double-cursor", "vr-register", "hi");

/* Sources. */

type Source = typeof COUNT_ART;

const sourceBack = (art: Source, key: string, extra?: React.ReactNode) => (
  <g key={key}>
    {extra}
    <Solid paths={art.bed} tone="mid" inner={<Line d={art.bedSeam} tone="faint" />} />
    <Line d={art.bedInset} tone="faint" />
    <Dots points={art.bedScrews} size={0.5} tone="mid" />
    {guideBack(art.guide, "guide")}
  </g>
);

const rodOf = (art: Source, key: string, grip: string) => (
  <g key={key}>
    <Solid paths={art.rod} tone="mid" />
    <Line d={art.eye.slot} tone="lo" />
    <Dots points={art.eye.rivets} size={0.45} tone="mid" />
    <Solid paths={art.grip.flange} tone="mid" />
    <Solid paths={art.grip.grip} tone="mid" className={grip} />
    <Line d={art.grip.knurl} tone="lo" />
    <Line d={art.grip.pointer} tone="mid" />
  </g>
);

const sourceFront = (art: Source, key: string, extra?: React.ReactNode) => (
  <g key={key}>
    {guideFront(art.guide, "guide")}
    {extra}
    <Solid paths={art.scale.strip} tone="lo" crease="none" />
    <Line d={art.scale.minor} tone="lo" />
    <Line d={art.scale.major} tone="mid" />
  </g>
);

const COUNT_BACK = sourceBack(COUNT_ART, "count-back");
const COUNT_ROD = rodOf(COUNT_ART, "count-rod", "vr-grip-count");
const COUNT_FRONT = sourceFront(COUNT_ART, "count-front");
const COUNT_CURSOR = registerOf(COUNT_ART.scale, "count-cursor", "");

const SHOW_BACK = sourceBack(SHOW_ART, "show-back", guideBack(SHOW_ART.midGuide, "mid-guide"));
const SHOW_ROD = rodOf(SHOW_ART, "show-rod", "vr-grip-show");
const SHOW_FRONT = sourceFront(SHOW_ART, "show-front", guideFront(SHOW_ART.midGuide, "mid-guide"));
const SHOW_CURSOR = registerOf(SHOW_ART.scale, "show-cursor", "");

/* Drop pin heads, built down. */

const pinHead = (id: keyof typeof PIN_ART) => (
  <g key={`pin-${id}`}>
    <Solid paths={PIN_ART[id].head} tone="mid" />
    <Line d={PIN_ART[id].knurl} tone="lo" />
    <Line d={PIN_ART[id].cap} tone="lo" />
  </g>
);

export function VueReactivityArt({ lang }: { lang: Locale }) {
  return (
    <VueReactivityLive
      lang={lang}
      base={BASE}
      effectBack={EFFECT_BACK}
      tongueA={TONGUE_A}
      effectMiddle={EFFECT_MIDDLE}
      tongueB={TONGUE_B}
      effectTop={EFFECT_TOP}
      striker={STRIKER}
      strikerBlock={STRIKER_BLOCK}
      doubleBack={DOUBLE_BACK}
      slider={SLIDER}
      doubleFront={DOUBLE_FRONT}
      flag={FLAG}
      doubleCursor={DOUBLE_CURSOR}
      countBack={COUNT_BACK}
      countRod={COUNT_ROD}
      countFront={COUNT_FRONT}
      countCursor={COUNT_CURSOR}
      showBack={SHOW_BACK}
      showRod={SHOW_ROD}
      showFront={SHOW_FRONT}
      showCursor={SHOW_CURSOR}
      pins={{
        "double:count": pinHead("double:count"),
        "effect:double": pinHead("effect:double"),
        "effect:show": pinHead("effect:show"),
      }}
    />
  );
}
