"use client";

import * as React from "react";
import type { Locale } from "@/lib/i18n";
import type { SolidPaths } from "../../iso/iso-kit";
import { IsoFigure, Plate } from "../../iso/react/draw";
import { useInView, useLoop, useReadout, useStillness } from "../../iso/react/live";
import { LAST_STEP, LINKS, SNIPPET, STEPS, subscribersOf, type LinkId } from "./model";
import { flagStemOf, poseAt, secondsInto, stemOf, type Part, type Pose } from "./pose";
import { figureText } from "./text";
import {
  COUNT_PITCH,
  DOUBLE_PITCH,
  FLAG_LIFT,
  HEIGHT,
  PIN_LIFT,
  SHOVE,
  SHOW_FALSE,
  SHOW_TRUE,
  STRIKE,
  WIDTH,
  shift,
} from "./view";

type Node = React.ReactNode;

interface Props {
  lang: Locale;
  base: Node;
  effectBack: Node;
  tongueA: Node;
  effectMiddle: Node;
  tongueB: Node;
  effectTop: Node;
  striker: Node;
  strikerBlock: Node;
  doubleBack: Node;
  slider: Node;
  doubleFront: Node;
  flag: Node;
  doubleCursor: Node;
  countBack: Node;
  countRod: Node;
  countFront: Node;
  countCursor: Node;
  showBack: Node;
  showRod: Node;
  showFront: Node;
  showCursor: Node;
  pins: Record<LinkId, Node>;
}

/* A solid whose paths are rewritten every frame. All its paths always exist. */

const PIECES = 9;
const EMPTY: SolidPaths = { fill: "", outline: "", crease: "", top: "", shades: ["", "", "", ""] };

function LiveSolid({ paths, anchor }: { paths: SolidPaths | null; anchor: React.Ref<SVGGElement> }) {
  const shown = paths ?? EMPTY;
  return (
    <g className="iso-solid" ref={anchor} style={paths ? undefined : { display: "none" }}>
      <path className="iso-fill" d={shown.fill} />
      {[0, 1, 2, 3].map((shade) => (
        <path key={shade} className="iso-shade" data-shade={shade} d={shown.shades[shade] ?? ""} />
      ))}
      <path className="iso-top" d={shown.top} />
      <path className="iso-line iso-crease" data-tone="faint" d={shown.crease} />
      <path className="iso-line iso-bevel" data-tone="faint" d={shown.bevel ?? ""} />
      <path className="iso-line iso-edge" data-tone="mid" d={shown.outline} />
    </g>
  );
}

function writeSolid(group: SVGGElement | null, paths: SolidPaths | null) {
  if (!group || group.children.length !== PIECES) return;
  group.style.display = paths ? "" : "none";
  if (!paths) return;
  const values = [paths.fill, ...[0, 1, 2, 3].map((shade) => paths.shades[shade] ?? ""), paths.top, paths.crease, paths.bevel ?? "", paths.outline];
  values.forEach((d, index) => group.children[index].setAttribute("d", d));
}

const along = (push: number) => shift(0, -SHOVE * push);
const lifted = (lift: number) => shift(0, 0, PIN_LIFT * lift);
const countAt = (value: number) => shift(0, -COUNT_PITCH * value);
const doubleAt = (value: number) => shift(0, -DOUBLE_PITCH * value);
const showAt = (value: number) => shift(0, (SHOW_FALSE - SHOW_TRUE) * value);
const strikerAt = (value: number) => shift(value < 0 ? STRIKE * value : 2.4 * value, 0);
const flagAt = (value: number) => shift(0, 0, FLAG_LIFT * value);

const REST = poseAt(0);
const LIT_CLASS: Record<Part, string> = { count: ".vr-grip-count", show: ".vr-grip-show", double: ".vr-register", effect: ".vr-bell" };

const noRefs = () => ({ "double:count": null, "effect:double": null, "effect:show": null }) as Record<LinkId, SVGGElement | null>;

export function VueReactivityLive(props: Props) {
  const text = figureText[props.lang];
  const still = useStillness();

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

  const svgHolder = React.useRef<HTMLDivElement>(null);
  const tongueA = React.useRef<SVGGElement>(null);
  const tongueB = React.useRef<SVGGElement>(null);
  const striker = React.useRef<SVGGElement>(null);
  const slider = React.useRef<SVGGElement>(null);
  const countRod = React.useRef<SVGGElement>(null);
  const showRod = React.useRef<SVGGElement>(null);
  const flag = React.useRef<SVGGElement>(null);
  const flagStem = React.useRef<SVGGElement>(null);
  const doubleCursor = React.useRef<SVGGElement>(null);
  const countCursor = React.useRef<SVGGElement>(null);
  const showCursor = React.useRef<SVGGElement>(null);
  const heads = React.useRef(noRefs());
  const stems = React.useRef(noRefs());

  const draw = React.useCallback((u: number) => {
    const pose: Pose = poseAt(u);
    tongueA.current?.setAttribute("transform", along(pose.push.tongueA));
    tongueB.current?.setAttribute("transform", along(pose.push.tongueB));
    slider.current?.setAttribute("transform", along(pose.push.slider));
    countRod.current?.setAttribute("transform", along(pose.push.count));
    showRod.current?.setAttribute("transform", along(pose.push.show));
    striker.current?.setAttribute("transform", strikerAt(pose.striker));
    flag.current?.setAttribute("transform", flagAt(pose.flag));
    writeSolid(flagStem.current, flagStemOf(pose.flag));
    doubleCursor.current?.setAttribute("transform", doubleAt(pose.double));
    countCursor.current?.setAttribute("transform", countAt(pose.count));
    showCursor.current?.setAttribute("transform", showAt(pose.show));
    for (const id of LINKS) {
      heads.current[id]?.setAttribute("transform", lifted(pose.pins[id]));
      writeSolid(stems.current[id], stemOf(id, pose.pins[id]));
    }
    const svg = svgHolder.current;
    if (svg) {
      for (const [part, selector] of Object.entries(LIT_CLASS) as [Part, string][]) {
        const solid = svg.querySelector(selector);
        if (pose.lit === part) solid?.setAttribute("data-lit", "");
        else solid?.removeAttribute("data-lit");
      }
    }
  }, []);

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
    const wait = calm ? 2.4 : goal === LAST_STEP ? 3.6 : goal === 0 ? 1.4 : 0.9;
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
    say(text.readout(step, LAST_STEP, STEPS[step]));
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
  const saying = text.describe(now, step);
  const list = (items: string[]) => (items.length ? items.join(", ") : text.none);

  const pinned = (id: LinkId) => (
    <>
      <LiveSolid
        anchor={(node) => {
          stems.current[id] = node;
        }}
        paths={stemOf(id, REST.pins[id])}
      />
      <g
        ref={(node) => {
          heads.current[id] = node;
        }}
        transform={lifted(REST.pins[id])}
      >
        {props.pins[id]}
      </g>
    </>
  );

  return (
    <>
      <Plate fig={text.fig} title={text.title} hint={text.hint} readout={text.readout(0, LAST_STEP, STEPS[0])} keys={text.keys}>
        <div
          ref={anchor}
          className="vr-stage"
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
          <div ref={svgHolder}>
            <IsoFigure width={WIDTH} height={HEIGHT} label={text.label}>
              {props.base}
              {props.effectBack}
              <g ref={tongueA}>{props.tongueA}</g>
              {props.effectMiddle}
              <g ref={tongueB}>{props.tongueB}</g>
              {props.effectTop}
              <g ref={striker} transform={strikerAt(REST.striker)}>
                {props.striker}
              </g>
              {props.strikerBlock}
              {props.doubleBack}
              <g ref={slider}>
                {props.slider}
                {pinned("effect:double")}
              </g>
              {props.doubleFront}
              <LiveSolid anchor={flagStem} paths={flagStemOf(REST.flag)} />
              <g ref={flag} transform={flagAt(REST.flag)}>
                {props.flag}
              </g>
              <g ref={doubleCursor} transform={doubleAt(REST.double)}>
                {props.doubleCursor}
              </g>
              {props.countBack}
              <g ref={countRod}>
                {props.countRod}
                {pinned("double:count")}
              </g>
              {props.countFront}
              <g ref={countCursor} transform={countAt(REST.count)}>
                {props.countCursor}
              </g>
              {props.showBack}
              <g ref={showRod}>
                {props.showRod}
                {pinned("effect:show")}
              </g>
              {props.showFront}
              <g ref={showCursor} transform={showAt(REST.show)}>
                {props.showCursor}
              </g>
            </IsoFigure>
          </div>
        </div>
      </Plate>

      <div className="vr-panel">
        <div className="vr-controls">
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
            className="vr-play"
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
          <span className="vr-step">{text.stepOf(step, LAST_STEP)}</span>
        </div>

        <p className="vr-say" aria-live={playing ? "off" : "polite"}>
          {saying}
        </p>

        <dl className="vr-state">
          {(["count", "show", "double"] as const).map((source) => (
            <div key={source}>
              <dt>{text.subscribersOf(source)}</dt>
              <dd>{list(subscribersOf(source, now))}</dd>
            </div>
          ))}
        </dl>

        <div className="vr-io">
          <div>
            <h3>{text.code}</h3>
            <ol className="vr-code" translate="no">
              {SNIPPET.map((line, index) => (
                <li key={line} data-active={now.line === index ? "" : undefined} aria-current={now.line === index ? "step" : undefined}>
                  <code>{line}</code>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3>{text.console}</h3>
            {now.output.length ? (
              <ol className="vr-console" translate="no">
                {now.output.map((line, index) => (
                  <li key={index}>
                    <code>{line}</code>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="vr-console-empty">{text.consoleEmpty}</p>
            )}
          </div>
        </div>
      </div>

      <p className="vr-caption">{text.caption}</p>
    </>
  );
}
