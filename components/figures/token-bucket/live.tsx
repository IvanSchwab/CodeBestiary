"use client";

import * as React from "react";
import type { Locale } from "@/lib/i18n";
import type { SolidPaths, Tone } from "../../iso/iso-kit";
import { IsoFigure, Plate } from "../../iso/react/draw";
import { useInView, useLoop, useReadout, useStillness } from "../../iso/react/live";
import { CAPACITY, LAST_STEP, STEPS } from "./model";
import { carrierOf, gateOf, handOf, poseAt, rodOf, secondsInto, tokenOf, type CarrierPose, type Pose, type TokenPose } from "./pose";
import { figureText } from "./text";
import { HEIGHT, WIDTH, shift } from "./view";

interface Props {
  lang: Locale;
  base: React.ReactNode;
  cabinet: React.ReactNode;
  clockHub: React.ReactNode;
  drive: React.ReactNode;
  inlet: React.ReactNode;
  track: React.ReactNode;
  tubeFrame: React.ReactNode;
  latch: React.ReactNode;
  rodBack: React.ReactNode;
  rodsFront: React.ReactNode;
  tray: React.ReactNode;
  outlet: React.ReactNode;
  head: React.ReactNode;
}

/* A solid whose paths are rewritten every frame. All its paths always exist. */

const PIECES = 9;
const EMPTY: SolidPaths = { fill: "", outline: "", crease: "", top: "", shades: ["", "", "", ""] };

function solidPieces(paths: SolidPaths, tone: Tone) {
  return [
    <path key="fill" className="iso-fill" d={paths.fill} />,
    ...[0, 1, 2, 3].map((shade) => <path key={shade} className="iso-shade" data-shade={shade} d={paths.shades[shade] ?? ""} />),
    <path key="top" className="iso-top" d={paths.top} />,
    <path key="crease" className="iso-line iso-crease" data-tone="faint" d={paths.crease} />,
    <path key="bevel" className="iso-line iso-bevel" data-tone="faint" d={paths.bevel ?? ""} />,
    <path key="edge" className="iso-line iso-edge" data-tone={tone} d={paths.outline} />,
  ];
}

function LiveSolid({ paths, tone, anchor }: { paths: SolidPaths | null; tone: Tone; anchor: React.Ref<SVGGElement> }) {
  return (
    <g className="iso-solid" ref={anchor} style={paths ? undefined : { display: "none" }}>
      {solidPieces(paths ?? EMPTY, tone)}
    </g>
  );
}

function writeSolid(group: SVGGElement | null, paths: SolidPaths | null, lit = false) {
  if (!group || group.children.length !== PIECES) return;
  group.style.display = paths ? "" : "none";
  if (!paths) return;
  const values = [paths.fill, ...[0, 1, 2, 3].map((shade) => paths.shades[shade] ?? ""), paths.top, paths.crease, paths.bevel ?? "", paths.outline];
  values.forEach((d, index) => group.children[index].setAttribute("d", d));
  if (lit) group.setAttribute("data-lit", "");
  else group.removeAttribute("data-lit");
}

/* A token: a short disc with a ring on its top. The solid is the group's first child. */

function LiveToken({ token, anchor }: { token: TokenPose | null; anchor: React.Ref<SVGGElement> }) {
  const art = token ? tokenOf(token) : null;
  return (
    <g ref={anchor} style={art ? undefined : { display: "none" }}>
      <g className="iso-solid" data-lit={token?.lit ? "" : undefined}>
        {solidPieces(art?.solid ?? EMPTY, "hi")}
      </g>
      <path className="iso-line" data-tone="mid" d={art?.ring ?? ""} />
    </g>
  );
}

function writeToken(group: SVGGElement | null, token: TokenPose | null) {
  if (!group) return;
  group.style.display = token ? "" : "none";
  if (!token) return;
  const art = tokenOf(token);
  writeSolid(group.children[0] as SVGGElement, art.solid, token.lit);
  group.children[1].setAttribute("d", art.ring);
}

/* A carrier, the token riding on it, and the seat on its top. */

const ridingOf = (carrier: CarrierPose | null): TokenPose | null =>
  carrier?.token ? { ...carrier.token, x: carrier.token.x + carrier.x } : null;

function LiveCarrier({ carrier, anchor }: { carrier: CarrierPose | null; anchor: React.Ref<SVGGElement> }) {
  const art = carrier ? carrierOf(carrier) : null;
  return (
    <g ref={anchor}>
      <g className="iso-solid" data-lit={carrier?.lit ? "" : undefined} style={art ? undefined : { display: "none" }}>
        {solidPieces(art?.solid ?? EMPTY, "hi")}
      </g>
      <path className="iso-line" data-tone="mid" d={art?.seat ?? ""} />
      <LiveToken token={ridingOf(carrier)} anchor={null} />
    </g>
  );
}

function writeCarrier(group: SVGGElement | null, carrier: CarrierPose | null) {
  if (!group) return;
  const art = carrier ? carrierOf(carrier) : null;
  writeSolid(group.children[0] as SVGGElement, art?.solid ?? null, carrier?.lit ?? false);
  group.children[1].setAttribute("d", art?.seat ?? "");
  writeToken(group.children[2] as SVGGElement, art ? ridingOf(carrier) : null);
}

const tokensIn = (pose: Pose) => pose.stack.filter(Boolean).length;
const REST = poseAt(0);

export function TokenBucketLive(props: Props) {
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

  const hand = React.useRef<SVGPathElement>(null);
  const leaving = React.useRef<SVGGElement>(null);
  const arriving = React.useRef<SVGGElement>(null);
  const gate = React.useRef<SVGGElement>(null);
  const latch = React.useRef<SVGGElement>(null);
  const stack = React.useRef<(SVGGElement | null)[]>([]);
  const rod = React.useRef<SVGGElement>(null);
  const head = React.useRef<SVGGElement>(null);
  const feed = React.useRef<SVGGElement>(null);
  const spill = React.useRef<SVGGElement>(null);

  const draw = React.useCallback(
    (u: number) => {
      const pose = poseAt(u);
      hand.current?.setAttribute("d", handOf(pose.phase));
      writeCarrier(leaving.current, pose.leaving);
      writeCarrier(arriving.current, pose.arriving);
      writeSolid(gate.current, gateOf(pose.gate));
      latch.current?.setAttribute("transform", shift(2.2 * pose.latch, 0));
      pose.stack.forEach((token, slot) => writeToken(stack.current[slot] ?? null, token));
      writeSolid(rod.current, rodOf(pose.push));
      head.current?.setAttribute("transform", shift(0, pose.push));
      writeToken(feed.current, pose.feed);
      writeToken(spill.current, pose.spill);
      say(text.readout(pose.time, tokensIn(pose)));
    },
    [say, text],
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
    const wait = calm ? 2.4 : goal === LAST_STEP ? 3.2 : goal === 0 ? 1.4 : 0.7;
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
    kick();
  }, [step, playing, kick]);

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
  const saying = text.describe(now, step, step === LAST_STEP);
  /** The last few events, newest last; the list keeps its height. */
  const events = STEPS.slice(1, step + 1).slice(-4);

  return (
    <>
      <Plate fig={text.fig} title={text.title} hint={text.hint} readout={text.readout(REST.time, tokensIn(REST))} keys={text.keys}>
        <div
          ref={anchor}
          className="tk-stage"
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
            {props.cabinet}
            <path ref={hand} className="iso-line tk-hand" data-tone="lit" d={handOf(REST.phase)} />
            {props.clockHub}
            {props.drive}
            {props.inlet}
            {props.track}
            <LiveCarrier anchor={leaving} carrier={REST.leaving} />
            <LiveCarrier anchor={arriving} carrier={REST.arriving} />
            <LiveSolid anchor={gate} paths={gateOf(REST.gate)} tone="mid" />
            {props.tubeFrame}
            <g ref={latch}>{props.latch}</g>
            {props.rodBack}
            {REST.stack.map((token, slot) => (
              <LiveToken
                key={slot}
                token={token}
                anchor={(node) => {
                  stack.current[slot] = node;
                }}
              />
            ))}
            {props.rodsFront}
            {props.tray}
            {props.outlet}
            <LiveSolid anchor={rod} paths={rodOf(REST.push)} tone="mid" />
            <g ref={head}>{props.head}</g>
            <LiveToken anchor={feed} token={REST.feed} />
            <LiveToken anchor={spill} token={REST.spill} />
          </IsoFigure>
        </div>
      </Plate>

      <div className="tk-panel">
        <div className="tk-controls">
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
            className="tk-play"
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
          <span className="tk-step">{text.stepOf(step, LAST_STEP)}</span>
        </div>

        <p className="tk-say" aria-live={playing ? "off" : "polite"}>
          {saying}
        </p>

        <dl className="tk-state">
          <div>
            <dt>{text.tokens}</dt>
            <dd>
              {now.tokens}/{CAPACITY}
            </dd>
          </div>
          <div>
            <dt>{text.passed}</dt>
            <dd>{now.passed}</dd>
          </div>
          <div>
            <dt>{text.rejected}</dt>
            <dd>{now.rejected}</dd>
          </div>
          <div>
            <dt>{text.discarded}</dt>
            <dd>{now.discarded}</dd>
          </div>
        </dl>

        <div className="tk-log">
          <h3>{text.log}</h3>
          {events.length ? (
            <ol>
              {events.map((event) => (
                <li key={`${event.kind}-${event.t}`} data-outcome={event.outcome ?? undefined}>
                  <code>{text.logLine(event)}</code>
                </li>
              ))}
            </ol>
          ) : (
            <p className="tk-log-empty">{text.logEmpty}</p>
          )}
        </div>

        <p className="tk-settings">{text.settings}</p>
      </div>

      <p className="tk-caption">{text.caption}</p>
    </>
  );
}
