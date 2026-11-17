import type { Locale } from "@/lib/i18n";
import type { LegendKey } from "../../iso/iso-kit";
import { CAPACITY, REFILL_MS, type Step } from "./model";

/** Every word of the figure, in both languages. */
export interface FigureText {
  fig: string;
  title: string;
  hint: string;
  /** Accessible description of the drawing. */
  label: string;
  /** Accessible name of the stepping control. */
  control: string;
  keys: LegendKey[];
  caption: string;
  prev: string;
  next: string;
  play: string;
  pause: string;
  reset: string;
  tokens: string;
  passed: string;
  rejected: string;
  discarded: string;
  /** The bucket's settings, under the counters. */
  settings: string;
  log: string;
  logEmpty: string;
  /** One line of the event log. */
  logLine: (step: Step) => string;
  stepOf: (index: number, last: number) => string;
  /** The card's readout, from the time the clock shows and the tokens in the tube. */
  readout: (ms: number, tokens: number) => string;
  describe: (step: Step, index: number, isLast: boolean) => string;
}

const RATE = 1000 / REFILL_MS;
const seconds = (ms: number, comma: boolean) => {
  const text = (ms / 1000).toFixed(1);
  return comma ? text.replace(".", ",") : text;
};

const en: FigureText = {
  fig: "Fig 3",
  title: "Token bucket",
  hint: "Click or ← → to step",
  label: `A token dispenser that models a token bucket rate limiter. A clock on the cabinet mints one token per second and a pusher slides it into a tube that holds ${CAPACITY}. When the tube is full the pusher sweeps the new token over the top into an overflow tray. Requests ride in on carriers along a track: a carrier passes the gate only if a token drops onto it from the bottom of the tube, otherwise a trap door takes it away.`,
  control: "Token bucket, step by step",
  keys: [
    { mark: "lit", label: "The token or request that is moving" },
    { mark: "raised", label: "Disc: a token" },
    { mark: "flat", label: "Square carrier: a request" },
  ],
  caption: `The tube is the bucket: it holds ${CAPACITY} tokens, and the clock adds one each second. A request passes only by taking the bottom token; with the tube empty it is rejected at once, it does not wait. A full tube lets a burst of ${CAPACITY} through back to back, and after that requests pass at the refill rate, one per second. A token that comes when the tube is full is lost, so quiet time never saves up more than ${CAPACITY}.`,
  prev: "Previous step",
  next: "Next step",
  play: "Play",
  pause: "Pause",
  reset: "Restart",
  tokens: "Tokens",
  passed: "Passed",
  rejected: "Rejected",
  discarded: "Discarded",
  settings: `Capacity ${CAPACITY} · refill ${RATE} token per second · requests do not wait`,
  log: "Events",
  logEmpty: "Nothing yet",
  logLine(step) {
    const at = `${seconds(step.t, false)} s`;
    if (step.outcome === "added") return `${at}  token added`;
    if (step.outcome === "discarded") return `${at}  token discarded`;
    if (step.outcome === "passed") return `${at}  request passed`;
    return `${at}  request rejected`;
  },
  stepOf: (index, last) => `Step ${index} of ${last}`,
  readout: (ms, tokens) => `t ${seconds(ms, false)} s · tokens ${tokens}/${CAPACITY} · ${RATE}/s`,
  describe(step, index, isLast) {
    const left = step.tokens === 1 ? "1 token is left" : `${step.tokens} tokens are left`;
    if (step.kind === "idle") {
      return `The bucket starts full: ${CAPACITY} tokens in the tube. The clock turns once a second and mints one token each turn.`;
    }
    if (step.outcome === "discarded") {
      return "One second: the clock mints a token, but the tube is full. The pusher sweeps it over the top into the overflow tray. It is discarded.";
    }
    if (step.outcome === "added") {
      if (isLast) return `Nothing more arrives, so the tube fills back up. It is full again: ${CAPACITY} tokens, ready for another burst.`;
      return `The clock mints a token and the tube has room, so it drops in. ${step.tokens === 1 ? "There is 1 token" : `There are ${step.tokens} tokens`} now.`;
    }
    if (step.outcome === "passed") {
      if (index === 2) return `A burst begins. The bottom token drops onto the request's carrier and the gate opens: it passes. ${left}.`;
      if (step.passed <= CAPACITY) return `Another request in the same burst takes a token and passes. ${left}.`;
      return `The request takes the token the clock just added, and passes. ${left}: the pace is now the refill rate.`;
    }
    if (step.rejected === 1) {
      return `The fifth request of the burst finds the tube empty. No token drops, the trap door opens and the request is rejected. The burst was ${CAPACITY}.`;
    }
    return "The tube is empty again, so this request is rejected. Under steady load only one request per second gets through.";
  },
};

const es: FigureText = {
  fig: "Fig 3",
  title: "Token bucket",
  hint: "Clic o ← → para avanzar",
  label: `Un dispensador de fichas que modela un rate limiter de tipo token bucket. Un reloj en el gabinete genera un token por segundo y un empujador lo desliza a un tubo con capacidad para ${CAPACITY}. Cuando el tubo está lleno, el empujador barre el token nuevo por arriba hacia una bandeja de desborde. Las solicitudes llegan en carros por una vía: un carro pasa la compuerta solo si le cae un token desde el fondo del tubo; si no, una trampilla lo retira.`,
  control: "Token bucket, paso a paso",
  keys: [
    { mark: "lit", label: "El token o la solicitud en movimiento" },
    { mark: "raised", label: "Disco: un token" },
    { mark: "flat", label: "Carro cuadrado: una solicitud" },
  ],
  caption: `El tubo es el bucket: guarda ${CAPACITY} tokens y el reloj agrega uno por segundo. Una solicitud pasa solo si toma el token del fondo; con el tubo vacío se rechaza en el acto, no espera. Un tubo lleno deja pasar un burst de ${CAPACITY} seguidas, y después las solicitudes pasan al ritmo de recarga, una por segundo. El token que llega con el tubo lleno se pierde, así que el tiempo sin tráfico nunca acumula más de ${CAPACITY}.`,
  prev: "Paso anterior",
  next: "Paso siguiente",
  play: "Reproducir",
  pause: "Pausar",
  reset: "Reiniciar",
  tokens: "Tokens",
  passed: "Pasan",
  rejected: "Rechazos",
  discarded: "Descartes",
  settings: `Capacidad ${CAPACITY} · recarga ${RATE} token por segundo · las solicitudes no esperan`,
  log: "Eventos",
  logEmpty: "Nada todavía",
  logLine(step) {
    const at = `${seconds(step.t, true)} s`;
    if (step.outcome === "added") return `${at}  token agregado`;
    if (step.outcome === "discarded") return `${at}  token descartado`;
    if (step.outcome === "passed") return `${at}  solicitud aceptada`;
    return `${at}  solicitud rechazada`;
  },
  stepOf: (index, last) => `Paso ${index} de ${last}`,
  readout: (ms, tokens) => `t ${seconds(ms, true)} s · tokens ${tokens}/${CAPACITY} · ${RATE}/s`,
  describe(step, index, isLast) {
    const left = step.tokens === 1 ? "Queda 1 token" : `Quedan ${step.tokens} tokens`;
    if (step.kind === "idle") {
      return `El bucket empieza lleno: ${CAPACITY} tokens en el tubo. El reloj da una vuelta por segundo y genera un token en cada vuelta.`;
    }
    if (step.outcome === "discarded") {
      return "Pasa un segundo: el reloj genera un token, pero el tubo está lleno. El empujador lo barre por arriba hacia la bandeja de desborde. Se descarta.";
    }
    if (step.outcome === "added") {
      if (isLast) return `No llega nada más, así que el tubo se vuelve a llenar. Está lleno otra vez: ${CAPACITY} tokens, listo para otro burst.`;
      return `El reloj genera un token y el tubo tiene lugar, así que entra. ${step.tokens === 1 ? "Hay 1 token" : `Hay ${step.tokens} tokens`} ahora.`;
    }
    if (step.outcome === "passed") {
      if (index === 2) return `Empieza un burst. El token del fondo cae sobre el carro de la solicitud y la compuerta se abre: pasa. ${left}.`;
      if (step.passed <= CAPACITY) return `Otra solicitud del mismo burst toma un token y pasa. ${left}.`;
      return `La solicitud toma el token que el reloj acaba de agregar y pasa. ${left}: el ritmo ahora es el de recarga.`;
    }
    if (step.rejected === 1) {
      return `La quinta solicitud del burst encuentra el tubo vacío. No cae ningún token, se abre la trampilla y la solicitud se rechaza. El burst fue de ${CAPACITY}.`;
    }
    return "El tubo está vacío otra vez, así que esta solicitud se rechaza. Con carga sostenida pasa solo una solicitud por segundo.";
  },
};

export const figureText: Record<Locale, FigureText> = { en, es };
