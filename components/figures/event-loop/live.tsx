"use client";

import * as React from "react";
import type { Locale } from "@/lib/i18n";
import type { SolidPaths, Tone } from "../../iso/iso-kit";
import { IsoFigure, Plate } from "../../iso/react/draw";
import { useInView, useLoop, useReadout, useStillness } from "../../iso/react/live";
import { LAST_STEP, SNIPPET, STEPS, TOKENS, type TokenId } from "./model";
import { beamOf, columnAbove, isBehindHub, needleOf, poseAt, secondsInto, type Pose } from "./pose";
import { figureText, frameName } from "./text";
import { ARM_TAIL, HEIGHT, LIFT, STROKE, WIDTH, onArm, shift } from "./view";

interface Props {
  lang: Locale;
  base: React.ReactNode;
  taskLane: React.ReactNode;
  post: React.ReactNode;
  microLane: React.ReactNode;
  deck: React.ReactNode;
  hub: React.ReactNode;
  cap: React.ReactNode;
  dial: React.ReactNode;
  armPad: React.ReactNode;
  armWeight: React.ReactNode;
  armHead: React.ReactNode;
  armCollar: React.ReactNode;
  pressHead: React.ReactNode;
  tokens: Record<TokenId, React.ReactNode>;
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

function writeSolid(group: SVGGElement | null, paths: SolidPaths) {
  if (!group || group.children.length !== PIECES) return;
  const values = [paths.fill, ...[0, 1, 2, 3].map((shade) => paths.shades[shade] ?? ""), paths.top, paths.crease, paths.bevel ?? "", paths.outline];
  values.forEach((d, index) => group.children[index].setAttribute("d", d));
}

/* Where the arm's round parts sit, relative to where they were built (0°, up). */

const tipShift = (pose: Pose) => {
  const [x, y] = onArm(pose.angle);
  const [x0, y0] = onArm(0);
  return shift(x - x0, y - y0, -LIFT * pose.drop);
};
const tailShift = (pose: Pose) => {
  const [x, y] = onArm(pose.angle + 180, ARM_TAIL);
  const [x0, y0] = onArm(180, ARM_TAIL);
  return shift(x - x0, y - y0, -LIFT * pose.drop);
};

/** True when the arm's tail points toward the viewer (who looks from +x, +y). */
const tailIsNear = (angle: number) => Math.cos(((angle + 180 - 45) * Math.PI) / 180) > 0;

const REST = poseAt(0);
/** Painted far to near where finished tokens sit side by side on the tray. */
const PAINT_ORDER: TokenId[] = ["timeout", "promise", "script"];

/**
 * Every token is drawn twice: once in the layer painted before the hub and
 * once in the layer painted after it. Only the copy on the right side of the
 * hub is shown, so a token carried round the back passes behind the column.
 */
function TokenLayer({
  behind,
  tokens,
  register,
}: {
  behind: boolean;
  tokens: Record<TokenId, React.ReactNode>;
  register: (id: TokenId, node: SVGGElement | null) => void;
}) {
  return (
    <g>
      {PAINT_ORDER.map((id) => {
        const place = REST.tokens[id];
        const visible = isBehindHub(place) === behind;
        return (
          <g
            key={id}
            ref={(node) => register(id, node)}
            transform={shift(place[0], place[1], place[2])}
            style={visible ? undefined : { display: "none" }}
          >
            {tokens[id]}
          </g>
        );
      })}
    </g>
  );
}

const sameRefs = () => ({ script: null, timeout: null, promise: null }) as Record<TokenId, SVGGElement | null>;

export function EventLoopLive(props: Props) {
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

  const back = React.useRef(sameRefs());
  const front = React.useRef(sameRefs());
  const pad = React.useRef<SVGGElement>(null);
  const weight = React.useRef<SVGGElement>(null);
  const weightNear = React.useRef<SVGGElement>(null);
  const head = React.useRef<SVGGElement>(null);
  const collar = React.useRef<SVGGElement>(null);
  const beam = React.useRef<SVGGElement>(null);
  const column = React.useRef<SVGGElement>(null);
  const press = React.useRef<SVGGElement>(null);
  const needle = React.useRef<SVGPathElement>(null);

  const keepBack = React.useCallback((id: TokenId, node: SVGGElement | null) => {
    back.current[id] = node;
  }, []);
  const keepFront = React.useCallback((id: TokenId, node: SVGGElement | null) => {
    front.current[id] = node;
  }, []);

  const draw = React.useCallback((u: number) => {
    const pose = poseAt(u);
    for (const id of TOKENS) {
      const place = pose.tokens[id];
      const behind = isBehindHub(place);
      const move = shift(place[0], place[1], place[2]);
      for (const [group, visible] of [
        [back.current[id], behind],
        [front.current[id], !behind],
      ] as const) {
        if (!group) continue;
        group.style.display = visible ? "" : "none";
        if (!visible) continue;
        group.setAttribute("transform", move);
        const solid = group.querySelector(".iso-solid");
        if (pose.lit === id) solid?.setAttribute("data-lit", "");
        else solid?.removeAttribute("data-lit");
      }
    }
    pad.current?.setAttribute("transform", tipShift(pose));
    head.current?.setAttribute("transform", tipShift(pose));
    // The counterweight is painted before the collar when it is behind the
    // column and after the cap when it swings round to the viewer's side.
    const near = tailIsNear(pose.angle);
    for (const [group, visible] of [
      [weight.current, !near],
      [weightNear.current, near],
    ] as const) {
      if (!group) continue;
      group.style.display = visible ? "" : "none";
      if (visible) group.setAttribute("transform", tailShift(pose));
    }
    collar.current?.setAttribute("transform", shift(0, 0, -LIFT * pose.drop));
    writeSolid(beam.current, beamOf(pose.angle, pose.drop));
    writeSolid(column.current, columnAbove(pose.drop));
    press.current?.setAttribute("transform", shift(0, 0, -STROKE * pose.press));
    needle.current?.setAttribute("d", needleOf(pose.count));
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
    const wait = calm ? 2.4 : goal === LAST_STEP ? 3.2 : goal === 0 ? 1.4 : 0.9;
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
  const saying = text.describe(now, step === LAST_STEP);
  const list = (items: string[]) => (items.length ? items.join(" › ") : text.empty);

  return (
    <>
      <Plate
        fig={text.fig}
        title={text.title}
        hint={text.hint}
        readout={text.readout(0, LAST_STEP, STEPS[0])}
        keys={text.keys}
      >
        <div
          ref={anchor}
          className="el-stage"
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
            {props.base}
            {props.taskLane}
            {props.post}
            <TokenLayer behind tokens={props.tokens} register={keepBack} />
            {props.microLane}
            {props.deck}
            {props.hub}
            {props.dial}
            <path ref={needle} className="iso-line el-needle" data-tone="lit" data-free="" d={needleOf(REST.count)} />
            <TokenLayer behind={false} tokens={props.tokens} register={keepFront} />
            <g ref={pad} transform={tipShift(REST)}>
              {props.armPad}
            </g>
            <LiveSolid anchor={beam} paths={beamOf(REST.angle, REST.drop)} tone="hi" />
            <g ref={weight} transform={tailShift(REST)} style={tailIsNear(REST.angle) ? { display: "none" } : undefined}>
              {props.armWeight}
            </g>
            <g ref={head} transform={tipShift(REST)}>
              {props.armHead}
            </g>
            <g ref={collar}>{props.armCollar}</g>
            <LiveSolid anchor={column} paths={columnAbove(REST.drop)} tone="mid" />
            {props.cap}
            <g ref={weightNear} transform={tailShift(REST)} style={tailIsNear(REST.angle) ? undefined : { display: "none" }}>
              {props.armWeight}
            </g>
            <g ref={press}>{props.pressHead}</g>
          </IsoFigure>
        </div>
      </Plate>

      <div className="el-panel">
        <div className="el-controls">
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
            className="el-play"
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
          <span className="el-step">{text.stepOf(step, LAST_STEP)}</span>
        </div>

        <p className="el-say" aria-live={playing ? "off" : "polite"}>
          {saying}
        </p>

        <dl className="el-state">
          <div>
            <dt>{text.stack}</dt>
            <dd>{list(now.stack.map((frame) => frameName(frame, text)))}</dd>
          </div>
          <div>
            <dt>{text.microtasks}</dt>
            <dd>{list(now.microtasks.map((id) => text.unit[id]))}</dd>
          </div>
          <div>
            <dt>{text.tasks}</dt>
            <dd>{list(now.tasks.map((id) => text.unit[id]))}</dd>
          </div>
        </dl>

        <div className="el-io">
          <div>
            <h3>{text.code}</h3>
            <ol className="el-code" translate="no">
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
              <ol className="el-console" translate="no">
                {now.output.map((line) => (
                  <li key={line}>
                    <code>{line}</code>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="el-console-empty">{text.consoleEmpty}</p>
            )}
          </div>
        </div>
      </div>

      <p className="el-caption">{text.caption}</p>
    </>
  );
}
