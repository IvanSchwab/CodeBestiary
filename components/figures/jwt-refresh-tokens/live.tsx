"use client";

import * as React from "react";
import type { Locale } from "@/lib/i18n";
import type { Point3, SolidPaths, Tone } from "../../iso/iso-kit";
import { IsoFigure, Plate } from "../../iso/react/draw";
import { useInView, useLoop, useReadout, useStillness } from "../../iso/react/live";
import { CARD_COUNT, LAST_STEP, STEPS, TAG_COUNT } from "./model";
import { attackerAtFace, cardAtFace, drawerOf, expHand, nowHand, poseAt, secondsInto, tagAtFace, type Pose } from "./pose";
import { figureText, requestOf, responseOf } from "./text";
import { BAR_DROP, DRAWER_OPEN, FLAG_H, HEIGHT, STUB_H, WIDTH, shift } from "./view";

interface Props {
  lang: Locale;
  base: React.ReactNode;
  cabinet: React.ReactNode;
  /** One per rack slot, built standing at full height. */
  stubs: React.ReactNode[];
  bar: React.ReactNode;
  cabinetFront: React.ReactNode;
  lanes: React.ReactNode;
  /** Built at the world origin: one per refresh token, one per access token. */
  tags: React.ReactNode[];
  cards: React.ReactNode[];
  attacker: React.ReactNode;
  binFront: React.ReactNode;
  lock: React.ReactNode;
  flag: React.ReactNode;
  panel: React.ReactNode;
  hood: React.ReactNode;
  /** Clip outlines: what shows of a token in front of the cabinet, of a stub above the rack, of the flag above the locker. */
  clips: { card: string; tag: string; attacker: string; stubs: string[]; flag: string };
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
const REST_DRAWER = drawerOf(0);
const CARD_IDS = Array.from({ length: CARD_COUNT }, (_, index) => index);
const TAG_IDS = Array.from({ length: TAG_COUNT }, (_, index) => index);

/** Marks the first solid of a group as the lit accent, or clears it. */
function light(group: Element | null | undefined, on: boolean) {
  const solid = group?.querySelector(".iso-solid");
  if (on) solid?.setAttribute("data-lit", "");
  else solid?.removeAttribute("data-lit");
}

/** Places a token: hidden at home, clipped at the cabinet's face, moved by its inner group. */
function place(outer: SVGGElement | null, point: Point3 | null, clip: string, atFace: (point: Point3) => boolean) {
  if (!outer) return;
  outer.style.display = point ? "" : "none";
  if (!point) return;
  if (atFace(point)) outer.setAttribute("clip-path", `url(#${clip})`);
  else outer.removeAttribute("clip-path");
  outer.firstElementChild?.setAttribute("transform", shift(point[0], point[1], point[2]));
}

const lift = (share: number, height: number) => shift(0, 0, -(1 - share) * height);

export function JwtRefreshTokensLive(props: Props) {
  const text = figureText[props.lang];
  const still = useStillness();
  const id = React.useId();
  const clipId = (name: string) => `${id}${name}`;

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
  const tags = React.useRef<(SVGGElement | null)[]>([]);
  const attacker = React.useRef<SVGGElement>(null);
  const stubs = React.useRef<(SVGGElement | null)[]>([]);
  const bar = React.useRef<SVGGElement>(null);
  const flag = React.useRef<SVGGElement>(null);
  const panel = React.useRef<SVGGElement>(null);
  const floor = React.useRef<SVGGElement>(null);
  const left = React.useRef<SVGGElement>(null);
  const load = React.useRef<SVGGElement>(null);
  const right = React.useRef<SVGGElement>(null);
  const now = React.useRef<SVGPathElement>(null);
  const exp = React.useRef<SVGPathElement>(null);
  const stage = React.useRef<SVGSVGElement | null>(null);

  const draw = React.useCallback(
    (u: number) => {
      const pose: Pose = poseAt(u);
      const lit = pose.lit;
      CARD_IDS.forEach((index) => {
        place(cards.current[index], pose.cards[index], clipId("card"), cardAtFace);
        light(cards.current[index], lit?.kind === "card" && lit.id === index + 1);
      });
      TAG_IDS.forEach((index) => {
        place(tags.current[index], pose.tags[index], clipId("tag"), tagAtFace);
        light(tags.current[index], lit?.kind === "tag" && lit.id === index + 1);
      });
      place(attacker.current, pose.attacker, clipId("attacker"), attackerAtFace);
      light(attacker.current, lit?.kind === "attacker");
      pose.stubs.forEach((share, slot) => {
        const group = stubs.current[slot];
        if (!group) return;
        group.style.display = share < 0.005 ? "none" : "";
        group.firstElementChild?.setAttribute("transform", lift(share, STUB_H));
      });
      bar.current?.setAttribute("transform", shift(0, 0, -pose.bar * BAR_DROP));
      light(bar.current, lit?.kind === "bar");
      if (flag.current) {
        flag.current.style.display = pose.flag < 0.005 ? "none" : "";
        flag.current.firstElementChild?.setAttribute("transform", lift(pose.flag, FLAG_H));
      }
      panel.current?.setAttribute("transform", shift(0, pose.drawer * DRAWER_OPEN));
      const parts = drawerOf(pose.drawer);
      writeSolid(floor.current, parts.floor);
      writeSolid(left.current, parts.left);
      writeSolid(load.current, parts.load);
      writeSolid(right.current, parts.right);
      now.current?.setAttribute("d", nowHand(pose.now));
      exp.current?.setAttribute("d", expHand(pose.exp));
      stage.current?.setAttribute("data-shown", String(Math.round(u * 100) / 100));
    },
    // clipId only depends on the stable id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],
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
  React.useEffect(() => {
    stage.current = anchor.current?.querySelector("svg") ?? null;
    draw(shown.current);
  }, [draw, anchor]);

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

  const current = STEPS[step];
  const saying = text.describe(current);
  const holds = text.holds(current);
  const ledger = text.ledger(current);

  return (
    <>
      <Plate fig={text.fig} title={text.title} hint={text.hint} readout={text.readout(STEPS[0])} keys={text.keys}>
        <div
          ref={anchor}
          className="jw-stage"
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
              {(["card", "tag", "attacker", "flag"] as const).map((name) => (
                <clipPath key={name} id={clipId(name)}>
                  <path d={props.clips[name]} />
                </clipPath>
              ))}
              {props.clips.stubs.map((d, slot) => (
                <clipPath key={slot} id={clipId(`stub${slot}`)}>
                  <path d={d} />
                </clipPath>
              ))}
            </defs>
            {props.base}
            {props.cabinet}
            {props.stubs.map((art, slot) => (
              <g key={slot} clipPath={`url(#${clipId(`stub${slot}`)})`}>
                <g
                  ref={(node) => {
                    stubs.current[slot] = node;
                  }}
                  style={REST.stubs[slot] < 0.005 ? { display: "none" } : undefined}
                >
                  <g transform={lift(REST.stubs[slot], STUB_H)}>{art}</g>
                </g>
              </g>
            ))}
            <g ref={bar} transform={shift(0, 0, -REST.bar * BAR_DROP)}>
              {props.bar}
            </g>
            {props.cabinetFront}
            {props.lanes}
            {REST.tags.map((point, index) => (
              <g
                key={index}
                ref={(node) => {
                  tags.current[index] = node;
                }}
                style={point ? undefined : { display: "none" }}
              >
                <g transform={point ? shift(point[0], point[1], point[2]) : undefined}>{props.tags[index]}</g>
              </g>
            ))}
            {REST.cards.map((point, index) => (
              <g
                key={index}
                ref={(node) => {
                  cards.current[index] = node;
                }}
                style={point ? undefined : { display: "none" }}
              >
                <g transform={point ? shift(point[0], point[1], point[2]) : undefined}>{props.cards[index]}</g>
              </g>
            ))}
            <g ref={attacker} style={REST.attacker ? undefined : { display: "none" }}>
              <g>{props.attacker}</g>
            </g>
            {props.binFront}
            {props.lock}
            <path ref={exp} className="iso-line jw-hand-exp" data-tone="mid" data-free="" d={expHand(REST.exp)} />
            <path ref={now} className="iso-line jw-hand" data-tone="hi" data-free="" d={nowHand(REST.now)} />
            <g clipPath={`url(#${clipId("flag")})`}>
              <g ref={flag} style={REST.flag < 0.005 ? { display: "none" } : undefined}>
                <g transform={lift(REST.flag, FLAG_H)}>{props.flag}</g>
              </g>
            </g>
            <LiveSolid anchor={floor} paths={REST_DRAWER.floor} tone="lo" />
            <LiveSolid anchor={left} paths={REST_DRAWER.left} tone="mid" />
            <LiveSolid anchor={load} paths={REST_DRAWER.load} tone="hi" />
            <LiveSolid anchor={right} paths={REST_DRAWER.right} tone="mid" />
            <g ref={panel}>{props.panel}</g>
            {props.hood}
          </IsoFigure>
        </div>
      </Plate>

      <div className="jw-panel">
        <div className="jw-controls">
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
            className="jw-play"
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
          <span className="jw-step">{text.stepOf(step, LAST_STEP)}</span>
        </div>

        <p className="jw-say" aria-live={playing ? "off" : "polite"}>
          {saying}
        </p>

        <dl className="jw-state">
          <div>
            <dt>{text.client}</dt>
            <dd>{holds.length ? holds.map((line) => <span key={line}>{line}</span>) : text.none}</dd>
          </div>
          <div>
            <dt>{text.server}</dt>
            <dd>{ledger.length ? ledger.map((line) => <span key={line}>{line}</span>) : text.none}</dd>
          </div>
          <div>
            <dt>{text.clock}</dt>
            <dd>{text.clockOf(current)}</dd>
          </div>
        </dl>

        <dl className="jw-io">
          <div>
            <dt>{text.request}</dt>
            <dd translate="no">
              <code>{requestOf(current)}</code>
            </dd>
          </div>
          <div>
            <dt>{text.response}</dt>
            <dd translate="no">
              <code>{responseOf(current)}</code>
            </dd>
          </div>
        </dl>
      </div>

      <p className="jw-caption">{text.caption}</p>
    </>
  );
}
