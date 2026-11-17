"use client";

import * as React from "react";
import type { Locale } from "@/lib/i18n";
import type { SolidPaths, Tone } from "../../iso/iso-kit";
import { IsoFigure, Plate } from "../../iso/react/draw";
import { useInView, useLoop, useReadout, useStillness } from "../../iso/react/live";
import { DOC_VECTORS, LAST_STEP, STEPS } from "./model";
import { capOf, inFrontOfBar, pinOf, pinPlace, poseAt, secondsInto, slotsOf, type Pose } from "./pose";
import { figureText } from "./text";
import { CARDS, HEIGHT, PAWL_UP, SLIDER_SPAN, SLIDER_X, SLIDER_Y, WIDTH, nearness, railX, shift } from "./view";

interface Props {
  lang: Locale;
  base: React.ReactNode;
  encoder: React.ReactNode;
  queryPosts: React.ReactNode;
  /** Built at the world origin; drawn once per component. */
  slider: React.ReactNode;
  drive: React.ReactNode;
  rail: React.ReactNode;
  pawl: React.ReactNode;
  carriage: React.ReactNode;
  table: React.ReactNode;
  /** Built at the world origin; drawn once per pin. */
  bore: React.ReactNode;
  beam: React.ReactNode;
  blade: React.ReactNode;
  /** One per card, built at the world origin. */
  cards: React.ReactNode[];
  /** The well's opening, which is all that shows of a card inside the encoder. */
  wellClip: string;
}

/* A solid whose paths are rewritten every frame. All its paths always exist. */

const PIECES = 9;

function LiveSolid({ paths, tone, anchor }: { paths: SolidPaths; tone: Tone; anchor: React.Ref<SVGGElement> }) {
  return (
    <g className="iso-solid" ref={anchor}>
      <path className="iso-fill" d={paths.fill} />
      {[0, 1, 2, 3].map((shade) => (
        <path key={shade} className="iso-shade" data-shade={shade} d={paths.shades[shade] ?? ""} />
      ))}
      <path className="iso-top" d={paths.top} />
      <path className="iso-line iso-crease" data-tone="faint" d={paths.crease} />
      <path className="iso-line iso-bevel" data-tone="faint" d={paths.bevel ?? ""} />
      <path className="iso-line iso-edge" data-tone={tone} d={paths.outline} />
    </g>
  );
}

function writeSolid(group: SVGGElement | null, paths: SolidPaths, tone: Tone) {
  if (!group || group.children.length !== PIECES) return;
  const values = [paths.fill, ...[0, 1, 2, 3].map((shade) => paths.shades[shade] ?? ""), paths.top, paths.crease, paths.bevel ?? "", paths.outline];
  values.forEach((d, index) => group.children[index].setAttribute("d", d));
  group.children[PIECES - 1].setAttribute("data-tone", tone);
  group.children[PIECES - 3].setAttribute("data-tone", tone === "hi" ? "lo" : "faint");
}

const setLit = (node: Element | null | undefined, on: boolean) => {
  const solid = node?.querySelector(".iso-solid");
  if (on) solid?.setAttribute("data-lit", "");
  else solid?.removeAttribute("data-lit");
};

const REST = poseAt(0);
const DOCS = DOC_VECTORS.map((_, doc) => doc);
const LAYERS = ["behind", "front"] as const;

const pinTone = (pose: Pose, doc: number): Tone => (pose.picked[doc] > 0.5 ? "hi" : pose.pins[doc] > 1 ? "mid" : "lo");

export function EmbeddingsVectorSearchLive(props: Props) {
  const text = figureText[props.lang];
  const still = useStillness();
  const id = React.useId();
  const wellClip = `${id}well`;

  const [step, setStep] = React.useState(0);
  /** null until the visitor decides: the tour plays unless they ask for stillness. */
  const [wantsPlay, setWantsPlay] = React.useState<boolean | null>(null);
  const playing = wantsPlay ?? !still;

  const { anchor, say } = useReadout<HTMLDivElement>();
  const inView = useInView(anchor);

  const shown = React.useRef(0);
  const target = React.useRef(0);
  const dwell = React.useRef(0);
  const isPlaying = React.useRef(playing);

  const cards = React.useRef<(SVGGElement | null)[]>([]);
  const sliders = React.useRef<(SVGGElement | null)[]>([]);
  const pawl = React.useRef<SVGGElement>(null);
  const carriage = React.useRef<SVGGElement>(null);
  const beam = React.useRef<SVGGElement>(null);
  const layers = React.useRef<Record<(typeof LAYERS)[number], SVGGElement | null>>({ behind: null, front: null });
  const pins = React.useRef<Record<(typeof LAYERS)[number], (SVGGElement | null)[]>>({ behind: [], front: [] });
  const pinSolids = React.useRef<Record<(typeof LAYERS)[number], (SVGGElement | null)[]>>({ behind: [], front: [] });
  const pinCaps = React.useRef<Record<(typeof LAYERS)[number], (SVGPathElement | null)[]>>({ behind: [], front: [] });
  const order = React.useRef("");
  const slots = React.useRef<SVGPathElement>(null);

  const draw = React.useCallback(
    (u: number) => {
      const pose = poseAt(u);
      CARDS.forEach((_, card) => {
        const group = cards.current[card];
        if (!group) return;
        const place = pose.cards[card];
        group.style.display = place ? "" : "none";
        if (!place) return;
        if (pose.sunk[card]) group.setAttribute("clip-path", `url(#${wellClip})`);
        else group.removeAttribute("clip-path");
        const inner = group.firstElementChild;
        inner?.setAttribute("transform", shift(place[0], place[1], place[2]));
        setLit(inner, pose.lit?.kind === "card" && pose.lit.card === card);
      });
      SLIDER_X.forEach((x, axis) => {
        sliders.current[axis]?.setAttribute("transform", shift(x, SLIDER_Y + pose.sliders[axis] * SLIDER_SPAN));
      });
      pawl.current?.setAttribute("transform", shift(0, 0, PAWL_UP * pose.pawl));
      setLit(pawl.current, pose.lit?.kind === "pawl");
      const barShift = shift(railX(pose.bar), 0);
      carriage.current?.setAttribute("transform", barShift);
      beam.current?.setAttribute("transform", barShift);
      setLit(beam.current?.lastElementChild, pose.lit?.kind === "bar");

      slots.current?.setAttribute("d", slotsOf(pose.turn));

      // Pins: each is drawn in the layer on its side of the beam, nearest last.
      const places = DOCS.map((doc) => pinPlace(doc, pose.turn));
      const sorted = [...DOCS].sort((a, b) => nearness(...places[a]) - nearness(...places[b]));
      const key = sorted.join("");
      for (const layer of LAYERS) {
        const parent = layers.current[layer];
        if (parent && key !== order.current) {
          for (const doc of sorted) {
            const node = pins.current[layer][doc];
            if (node) parent.appendChild(node);
          }
        }
        for (const doc of DOCS) {
          const node = pins.current[layer][doc];
          if (!node) continue;
          const front = inFrontOfBar(places[doc][0], pose.bar);
          const visible = layer === "front" ? front : !front;
          node.style.display = visible ? "" : "none";
          if (!visible) continue;
          node.setAttribute("transform", shift(places[doc][0], places[doc][1]));
          writeSolid(pinSolids.current[layer][doc], pinOf(pose.pins[doc]), pinTone(pose, doc));
          pinCaps.current[layer][doc]?.setAttribute("d", capOf(pose.pins[doc]));
        }
      }
      order.current = key;
    },
    [wellClip],
  );

  const kick = useLoop((dt, calm) => {
    const goal = target.current;
    if (shown.current !== goal) {
      if (calm) shown.current = goal;
      else {
        const gap = goal - shown.current;
        const forward = gap > 0;
        // The step being played sets the pace; a long jump (restart) hurries.
        const playingStep = forward ? Math.floor(shown.current) + 1 : Math.ceil(shown.current);
        const pace = Math.max(1 / secondsInto(playingStep), Math.abs(gap) > 1.5 ? Math.abs(gap) / 2.2 : 0);
        const next = shown.current + (forward ? 1 : -1) * pace * dt;
        shown.current = forward ? Math.min(next, goal) : Math.max(next, goal);
      }
      draw(shown.current);
      dwell.current = 0;
      return true;
    }
    if (!isPlaying.current) return false;
    dwell.current += dt;
    const wait = calm ? 2.6 : goal === LAST_STEP ? 3.6 : goal === 0 ? 1.4 : 1.2;
    if (dwell.current >= wait) {
      dwell.current = 0;
      setStep(goal === LAST_STEP ? 0 : goal + 1);
    }
    return true;
  }, inView);

  // Paint once on mount so the first frame never depends on the loop running.
  React.useEffect(() => draw(shown.current), [draw]);

  React.useEffect(() => {
    target.current = step;
    isPlaying.current = playing;
    say(text.readout(STEPS[step]));
    kick();
  }, [step, playing, kick, say, text]);

  const go = (to: number) => {
    setWantsPlay(false);
    setStep(Math.min(LAST_STEP, Math.max(0, to)));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") go(step + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") go(step - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(LAST_STEP);
    else if (event.key === " " || event.key === "Enter") setWantsPlay(!playing);
    else return;
    event.preventDefault();
  };

  const now = STEPS[step];
  const saying = text.describe(now);
  const listed = now.kind === "rank" || now.kind === "threshold" ? now.top : [];
  const kept = new Set((now.results ?? []).map((hit) => hit.doc));

  const restPlaces = DOCS.map((doc) => pinPlace(doc, REST.turn));
  const pinLayer = (layer: (typeof LAYERS)[number]) => (
    <g
      ref={(node) => {
        layers.current[layer] = node;
      }}
    >
      {DOCS.map((doc) => {
        const front = inFrontOfBar(restPlaces[doc][0], REST.bar);
        const visible = layer === "front" ? front : !front;
        return (
          <g
            key={doc}
            ref={(node) => {
              pins.current[layer][doc] = node;
            }}
            transform={shift(restPlaces[doc][0], restPlaces[doc][1])}
            style={visible ? undefined : { display: "none" }}
          >
            {props.bore}
            <LiveSolid
              anchor={(node) => {
                pinSolids.current[layer][doc] = node;
              }}
              paths={pinOf(REST.pins[doc])}
              tone={pinTone(REST, doc)}
            />
            <path
              ref={(node) => {
                pinCaps.current[layer][doc] = node;
              }}
              className="iso-line"
              data-tone="lo"
              d={capOf(REST.pins[doc])}
            />
          </g>
        );
      })}
    </g>
  );

  return (
    <>
      <Plate fig={text.fig} title={text.title} hint={text.hint} readout={text.readout(STEPS[0])} keys={text.keys}>
        <div
          ref={anchor}
          className="vs-stage"
          role="slider"
          tabIndex={0}
          aria-label={text.control}
          aria-valuemin={0}
          aria-valuemax={LAST_STEP}
          aria-valuenow={step}
          aria-valuetext={`${text.stepOf(step, LAST_STEP)}. ${saying}`}
          onKeyDown={onKeyDown}
          onClick={() => go(step === LAST_STEP ? 0 : step + 1)}
        >
          <IsoFigure width={WIDTH} height={HEIGHT} label={text.label}>
            <defs>
              <clipPath id={wellClip}>
                <path d={props.wellClip} />
              </clipPath>
              <clipPath id="vs-well">
                <path d={props.wellClip} />
              </clipPath>
            </defs>
            {props.base}
            {props.encoder}
            {CARDS.map((card, index) => ({ card, index }))
              .sort((a, b) => (a.card.kind === b.card.kind ? a.card.stack - b.card.stack : a.card.kind === "doc" ? -1 : 1))
              .map(({ index }) => {
                const place = REST.cards[index];
                return (
                  <g
                    key={index}
                    ref={(node) => {
                      cards.current[index] = node;
                    }}
                    style={place ? undefined : { display: "none" }}
                  >
                    <g transform={place ? shift(place[0], place[1], place[2]) : undefined}>{props.cards[index]}</g>
                  </g>
                );
              })}
            {props.queryPosts}
            {SLIDER_X.map((x, axis) => (
              <g
                key={axis}
                ref={(node) => {
                  sliders.current[axis] = node;
                }}
                transform={shift(x, SLIDER_Y + REST.sliders[axis] * SLIDER_SPAN)}
              >
                {props.slider}
              </g>
            ))}
            {props.drive}
            {props.rail}
            <g ref={pawl}>{props.pawl}</g>
            <g ref={carriage} transform={shift(railX(REST.bar), 0)}>
              {props.carriage}
            </g>
            {props.table}
            <path ref={slots} className="iso-line" data-tone="lo" d={slotsOf(REST.turn)} />
            {pinLayer("behind")}
            <g ref={beam} transform={shift(railX(REST.bar), 0)}>
              {props.beam}
              {props.blade}
            </g>
            {pinLayer("front")}
          </IsoFigure>
        </div>
      </Plate>

      <div className="vs-panel">
        <div className="vs-controls">
          <button type="button" onClick={() => go(0)} disabled={step === 0} aria-label={text.reset} title={text.reset}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.2 8a4.8 4.8 0 1 0 1.5-3.5M2.6 2.2v2.9h2.9" />
            </svg>
          </button>
          <button type="button" onClick={() => go(step - 1)} disabled={step === 0} aria-label={text.prev} title={text.prev}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M9.8 3.5 5.3 8l4.5 4.5" />
            </svg>
          </button>
          <button
            type="button"
            className="vs-play"
            onClick={() => setWantsPlay(!playing)}
            aria-label={playing ? text.pause : text.play}
            title={playing ? text.pause : text.play}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              {playing ? <path d="M5.5 3.5v9M10.5 3.5v9" /> : <path d="M5 3.2 12 8l-7 4.8Z" />}
            </svg>
            <span>{playing ? text.pause : text.play}</span>
          </button>
          <button type="button" onClick={() => go(step + 1)} disabled={step === LAST_STEP} aria-label={text.next} title={text.next}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6.2 3.5 10.7 8l-4.5 4.5" />
            </svg>
          </button>
          <span className="vs-step">{text.stepOf(step, LAST_STEP)}</span>
        </div>

        <p className="vs-say" aria-live={playing ? "off" : "polite"}>
          {saying}
        </p>

        <dl className="vs-state">
          <div>
            <dt>{text.queryHead}</dt>
            <dd>{text.queryOf(now)}</dd>
          </div>
          <div>
            <dt>{text.resultsHead}</dt>
            <dd>
              {listed.length ? (
                <ol className="vs-hits">
                  {listed.map((hit) => {
                    const out = now.thresholded && !kept.has(hit.doc);
                    return (
                      <li key={hit.doc} data-out={out ? "" : undefined}>
                        <span className="vs-score">{hit.score.toFixed(3)}</span>
                        <span className="vs-doc">{text.docs[hit.doc]}</span>
                        {out ? <span className="vs-cut">{text.belowThreshold}</span> : null}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                text.emptyOf(now)
              )}
            </dd>
          </div>
        </dl>

        <dl className="vs-io">
          <div>
            <dt>{text.call}</dt>
            <dd translate="no">
              <code>{text.callOf(now)}</code>
            </dd>
          </div>
          <div>
            <dt>{text.result}</dt>
            <dd>{text.resultOf(now)}</dd>
          </div>
        </dl>
      </div>

      <p className="vs-caption">{text.caption}</p>
    </>
  );
}
