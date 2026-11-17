"use client";

import * as React from "react";
import type { Locale } from "@/lib/i18n";
import type { SolidPaths, Tone } from "../../iso/iso-kit";
import { IsoFigure, Plate } from "../../iso/react/draw";
import { useInView, useLoop, useReadout, useStillness } from "../../iso/react/live";
import { CLIENTS, LAST_STEP, MAX, STEPS, type Client } from "./model";
import { inDoorway, isParked, loadNeedle, poseAt, rodOf, secondsInto, timerNeedle } from "./pose";
import { figureText } from "./text";
import { BAY_X, HEIGHT, SHUTTER_LIFT, WIDTH, shift } from "./view";

interface Props {
  lang: Locale;
  base: React.ReactNode;
  timer: React.ReactNode;
  manifold: React.ReactNode;
  tank: React.ReactNode;
  /** One per bay. */
  shutters: React.ReactNode[];
  ejector: React.ReactNode;
  bays: React.ReactNode;
  /** Built at the world origin; drawn once per bay. */
  carriage: React.ReactNode;
  load: React.ReactNode;
  feed: React.ReactNode;
  lane: React.ReactNode;
  pusher: React.ReactNode;
  pucks: Record<Client, React.ReactNode>;
  exit: React.ReactNode;
  /** Clip outlines: what shows of a carriage leaving its port, and of a puck leaving the feed housing. */
  clips: { ports: string[]; feed: string };
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

const REST = poseAt(0);
const BAYS = BAY_X.map((_, bay) => bay);

export function ConnectionPoolLive(props: Props) {
  const text = figureText[props.lang];
  const still = useStillness();
  const id = React.useId();
  const portClip = (bay: number) => `${id}port${bay}`;
  const feedClip = `${id}feed`;

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

  const carriages = React.useRef<(SVGGElement | null)[]>([]);
  const shutters = React.useRef<(SVGGElement | null)[]>([]);
  const pucks = React.useRef<Partial<Record<Client, SVGGElement | null>>>({});
  const rod = React.useRef<SVGGElement>(null);
  const plate = React.useRef<SVGGElement>(null);
  const timer = React.useRef<SVGPathElement>(null);
  const load = React.useRef<SVGPathElement>(null);

  const draw = React.useCallback(
    (u: number) => {
      const pose = poseAt(u);
      for (const bay of BAYS) {
        const group = carriages.current[bay];
        if (group) {
          const parked = isParked(pose.carriages[bay]);
          group.style.display = parked ? "none" : "";
          if (!parked) group.setAttribute("transform", shift(BAY_X[bay], pose.carriages[bay]));
        }
        shutters.current[bay]?.setAttribute("transform", shift(0, 0, SHUTTER_LIFT * pose.shutters[bay]));
      }
      for (const client of CLIENTS) {
        const group = pucks.current[client];
        if (!group) continue;
        const place = pose.pucks[client];
        group.style.display = place ? "" : "none";
        if (!place) continue;
        // The clip belongs to the outer group, which never moves.
        if (inDoorway(place)) group.setAttribute("clip-path", `url(#${feedClip})`);
        else group.removeAttribute("clip-path");
        const inner = group.firstElementChild;
        inner?.setAttribute("transform", shift(place[0], place[1], place[2]));
        const solid = inner?.querySelector(".iso-solid");
        if (pose.lit === client) solid?.setAttribute("data-lit", "");
        else solid?.removeAttribute("data-lit");
      }
      writeSolid(rod.current, rodOf(pose.push));
      plate.current?.setAttribute("transform", shift(0, pose.push));
      timer.current?.setAttribute("d", timerNeedle(pose.wait));
      load.current?.setAttribute("d", loadNeedle(pose.busy));
    },
    [feedClip],
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
    const wait = calm ? 2.6 : goal === LAST_STEP ? 3.6 : goal === 0 ? 1.4 : 1;
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

  return (
    <>
      <Plate fig={text.fig} title={text.title} hint={text.hint} readout={text.readout(STEPS[0])} keys={text.keys}>
        <div
          ref={anchor}
          className="cp-stage"
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
              {BAYS.map((bay) => (
                <clipPath key={bay} id={portClip(bay)}>
                  <path d={props.clips.ports[bay]} />
                </clipPath>
              ))}
              <clipPath id={feedClip}>
                <path d={props.clips.feed} />
              </clipPath>
            </defs>
            {props.base}
            {props.timer}
            <path ref={timer} className="iso-line cp-needle" data-tone="hi" data-free="" d={timerNeedle(REST.wait)} />
            {props.manifold}
            {BAYS.map((bay) => (
              <g
                key={bay}
                ref={(node) => {
                  shutters.current[bay] = node;
                }}
                transform={shift(0, 0, SHUTTER_LIFT * REST.shutters[bay])}
              >
                {props.shutters[bay]}
              </g>
            ))}
            {props.tank}
            {props.ejector}
            {props.bays}
            {BAYS.map((bay) => (
              <g key={bay} clipPath={`url(#${portClip(bay)})`}>
                <g
                  ref={(node) => {
                    carriages.current[bay] = node;
                  }}
                  transform={shift(BAY_X[bay], REST.carriages[bay])}
                  style={isParked(REST.carriages[bay]) ? { display: "none" } : undefined}
                >
                  {props.carriage}
                </g>
              </g>
            ))}
            {props.load}
            <path ref={load} className="iso-line cp-needle" data-tone="hi" data-free="" d={loadNeedle(REST.busy)} />
            {props.feed}
            {props.lane}
            <LiveSolid anchor={rod} paths={rodOf(REST.push)} tone="mid" />
            <g ref={plate}>{props.pusher}</g>
            {CLIENTS.map((client) => {
              const place = REST.pucks[client];
              return (
                <g
                  key={client}
                  ref={(node) => {
                    pucks.current[client] = node;
                  }}
                  style={place ? undefined : { display: "none" }}
                >
                  <g transform={place ? shift(place[0], place[1], place[2]) : undefined}>{props.pucks[client]}</g>
                </g>
              );
            })}
            {props.exit}
          </IsoFigure>
        </div>
      </Plate>

      <div className="cp-panel">
        <div className="cp-controls">
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
            className="cp-play"
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
          <span className="cp-step">{text.stepOf(step, LAST_STEP)}</span>
        </div>

        <p className="cp-say" aria-live={playing ? "off" : "polite"}>
          {saying}
        </p>

        <dl className="cp-state">
          <div>
            <dt>{text.connections}</dt>
            <dd>
              <ul className="cp-conns">
                {Array.from({ length: MAX }, (_, conn) => (
                  <li key={conn} data-state={now.holders[conn] === undefined ? "shut" : now.holders[conn] === null ? "idle" : "busy"}>
                    {text.connection(conn, now.holders[conn])}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt>{text.queue}</dt>
            <dd>{now.waiters.length ? now.waiters.map((waiter) => text.client(waiter.client)).join(" › ") : text.empty}</dd>
          </div>
          <div>
            <dt>{text.clock}</dt>
            <dd>{text.clockOf(now)}</dd>
          </div>
        </dl>

        <dl className="cp-io">
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

      <p className="cp-caption">{text.caption}</p>
    </>
  );
}
