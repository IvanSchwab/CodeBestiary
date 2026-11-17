import type { Locale } from "@/lib/i18n";
import type { LegendKey } from "../../iso/iso-kit";
import { ACQUIRE_TIMEOUT, MAX, countsOf, type Step } from "./model";

/** Every word of the figure, in both languages. Method names are code and are not translated. */
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
  connections: string;
  queue: string;
  clock: string;
  call: string;
  result: string;
  empty: string;
  stepOf: (index: number, last: number) => string;
  readout: (step: Step) => string;
  /** One connection's state, for the panel. */
  connection: (conn: number, holder: number | null | undefined) => string;
  client: (client: number) => string;
  clockOf: (step: Step) => string;
  /** The call a step stands for, as code. */
  callOf: (step: Step) => string;
  resultOf: (step: Step) => string;
  describe: (step: Step) => string;
}

const callOf = (step: Step) => {
  const outcome = step.outcome;
  if (!outcome) return step.kind === "start" ? `new Pool({ max: ${MAX} })` : "—";
  if (outcome.kind === "idle" || outcome.kind === "handed") return `client${outcome.client}.release()`;
  if (outcome.kind === "timeout") return `pool.acquire()  // client ${outcome.client}, t = ${outcome.at - ACQUIRE_TIMEOUT} s`;
  return `pool.acquire()  // client ${outcome.client}`;
};

const en: FigureText = {
  fig: "Fig 4",
  title: "Connection pool",
  hint: "Click or ← → to step",
  label: `A transfer bench that models a database connection pool. A manifold at the back has ${MAX} shuttered ports, one per connection the pool may open, and a carriage on rails for each. Clients are pucks that arrive on a lane, ride a carriage to its port and give it back. When every carriage is away they wait in line beside a timer and an ejector.`,
  control: "Connection pool, step by step",
  keys: [
    { mark: "lit", label: "The client the step is about" },
    { mark: "raised", label: "Carriage: an open connection, idle at the lane or busy at its port" },
    { mark: "flat", label: "Shut port: a connection not opened yet" },
  ],
  caption: `Each port in the manifold is one connection the pool may open: ${MAX} ports, never more. A shutter lifts the first time its port is needed, and the carriage stays out from then on. A client rides a carriage to its port to use the database and gives it back at the lane, where the carriage waits for the next client instead of being put away. When every carriage is at its port, clients line up on the left and the oldest takes the next one that comes back. The timer follows the oldest waiter: at ${ACQUIRE_TIMEOUT} s the ejector pushes it off the lane. Pips number the clients and the ports; the gauge on the right counts busy connections.`,
  prev: "Previous step",
  next: "Next step",
  play: "Play",
  pause: "Pause",
  reset: "Restart",
  connections: "Connections",
  queue: "Waiting, oldest first",
  clock: "Clock",
  call: "Call",
  result: "Result",
  empty: "nobody",
  stepOf: (index, last) => `Step ${index} of ${last}`,
  readout(step) {
    const { open, busy, idle, waiting } = countsOf(step);
    return `open ${open}/${step.max} · busy ${busy} · idle ${idle} · waiting ${waiting}`;
  },
  connection(conn, holder) {
    if (holder === undefined) return `${conn + 1} not opened`;
    return holder === null ? `${conn + 1} idle` : `${conn + 1} client ${holder}`;
  },
  client: (client) => `client ${client}`,
  clockOf(step) {
    const waited = step.waiters.length ? ` · oldest wait ${step.oldestWait} s of ${step.timeout}` : "";
    return `t = ${step.at} s${waited}`;
  },
  callOf,
  resultOf(step) {
    const outcome = step.outcome;
    if (!outcome) return step.kind === "start" ? "0 connections open" : `connection ${step.holders.indexOf(step.leaked[0]) + 1} never released`;
    if (outcome.kind === "created") return `new connection ${outcome.conn + 1}`;
    if (outcome.kind === "reused") return `idle connection ${outcome.conn + 1}, reused`;
    if (outcome.kind === "queued") return `waits, position ${outcome.position}`;
    if (outcome.kind === "idle") return `connection ${outcome.conn + 1} is idle`;
    if (outcome.kind === "handed") return `connection ${outcome.conn + 1} → client ${outcome.to}`;
    return `error: timeout after ${outcome.waited} s`;
  },
  describe(step) {
    const outcome = step.outcome;
    if (step.kind === "start") {
      return `The pool starts empty. It may open up to ${step.max} connections, but it opens none until a client asks for one.`;
    }
    if (!outcome) {
      const client = step.leaked[0];
      const { open, busy } = countsOf(step);
      return `Client ${client} never released connection ${step.holders.indexOf(client) + 1}: a leak. The pool still counts it as busy, so only ${open - busy} of its ${open} connections are left for everyone else.`;
    }
    const conn = "conn" in outcome ? outcome.conn + 1 : 0;
    if (outcome.kind === "created") {
      const full = step.holders.length === step.max ? ` The pool is now at its maximum of ${step.max}.` : "";
      return `Client ${outcome.client} asks for a connection. None is idle and the pool is below its maximum, so it opens connection ${conn} and hands it over.${full}`;
    }
    if (outcome.kind === "reused") {
      return `Client ${outcome.client} asks for a connection. Connection ${conn} is idle, so the pool hands it over again. Nothing new is opened.`;
    }
    if (outcome.kind === "queued") {
      return `Client ${outcome.client} asks for a connection. All ${step.max} are busy and the pool is full, so it waits in line, in position ${outcome.position}.`;
    }
    if (outcome.kind === "idle") {
      return `Client ${outcome.client} releases connection ${conn}. It is not closed: it stays open and idle, ready for the next client.`;
    }
    if (outcome.kind === "handed") {
      return `Client ${outcome.client} releases connection ${conn}. It goes straight to client ${outcome.to}, the oldest in the line, which had waited ${outcome.waited} s.`;
    }
    return `Client ${outcome.client} has waited ${outcome.waited} s, the acquire timeout, and no connection came back. Its request fails with an error and it leaves the line.`;
  },
};

const es: FigureText = {
  fig: "Fig 4",
  title: "Connection pool",
  hint: "Clic o ← → para avanzar",
  label: `Un banco de transferencia que modela un connection pool de base de datos. Un colector al fondo tiene ${MAX} puertos con persiana, uno por cada conexión que el pool puede abrir, y un carro sobre rieles para cada uno. Los clientes son fichas que llegan por un carril, viajan en un carro hasta su puerto y lo devuelven. Cuando todos los carros están ocupados, esperan en fila junto a un temporizador y un eyector.`,
  control: "Connection pool, paso a paso",
  keys: [
    { mark: "lit", label: "El cliente del que trata el paso" },
    { mark: "raised", label: "Carro: una conexión abierta, idle junto al carril o en uso en su puerto" },
    { mark: "flat", label: "Puerto cerrado: una conexión todavía sin abrir" },
  ],
  caption: `Cada puerto del colector es una conexión que el pool puede abrir: ${MAX} puertos, nunca más. La persiana se levanta la primera vez que el puerto hace falta, y desde entonces el carro queda afuera. Un cliente viaja en un carro hasta su puerto para usar la base de datos y lo devuelve junto al carril, donde el carro espera al siguiente cliente en lugar de guardarse. Cuando todos los carros están en su puerto, los clientes hacen fila a la izquierda y el más antiguo toma el primero que vuelve. El temporizador sigue al que más lleva esperando: a los ${ACQUIRE_TIMEOUT} s el eyector lo saca del carril. Los puntos numeran clientes y puertos; el medidor de la derecha cuenta las conexiones en uso.`,
  prev: "Paso anterior",
  next: "Paso siguiente",
  play: "Reproducir",
  pause: "Pausar",
  reset: "Reiniciar",
  connections: "Conexiones",
  queue: "En espera, del más antiguo al más nuevo",
  clock: "Reloj",
  call: "Llamada",
  result: "Resultado",
  empty: "nadie",
  stepOf: (index, last) => `Paso ${index} de ${last}`,
  readout(step) {
    const { open, busy, idle, waiting } = countsOf(step);
    return `abiertas ${open}/${step.max} · en uso ${busy} · idle ${idle} · en espera ${waiting}`;
  },
  connection(conn, holder) {
    if (holder === undefined) return `${conn + 1} sin abrir`;
    return holder === null ? `${conn + 1} idle` : `${conn + 1} cliente ${holder}`;
  },
  client: (client) => `cliente ${client}`,
  clockOf(step) {
    const waited = step.waiters.length ? ` · espera más larga ${step.oldestWait} s de ${step.timeout}` : "";
    return `t = ${step.at} s${waited}`;
  },
  callOf,
  resultOf(step) {
    const outcome = step.outcome;
    if (!outcome) return step.kind === "start" ? "0 conexiones abiertas" : `conexión ${step.holders.indexOf(step.leaked[0]) + 1} nunca liberada`;
    if (outcome.kind === "created") return `conexión ${outcome.conn + 1} nueva`;
    if (outcome.kind === "reused") return `conexión ${outcome.conn + 1} idle, reutilizada`;
    if (outcome.kind === "queued") return `espera, posición ${outcome.position}`;
    if (outcome.kind === "idle") return `la conexión ${outcome.conn + 1} queda idle`;
    if (outcome.kind === "handed") return `conexión ${outcome.conn + 1} → cliente ${outcome.to}`;
    return `error: timeout tras ${outcome.waited} s`;
  },
  describe(step) {
    const outcome = step.outcome;
    if (step.kind === "start") {
      return `El pool empieza vacío. Puede abrir hasta ${step.max} conexiones, pero no abre ninguna hasta que un cliente la pide.`;
    }
    if (!outcome) {
      const client = step.leaked[0];
      const { open, busy } = countsOf(step);
      return `El cliente ${client} nunca liberó la conexión ${step.holders.indexOf(client) + 1}: un leak. El pool la sigue contando como en uso, así que solo quedan ${open - busy} de sus ${open} conexiones para todos los demás.`;
    }
    const conn = "conn" in outcome ? outcome.conn + 1 : 0;
    if (outcome.kind === "created") {
      const full = step.holders.length === step.max ? ` El pool llega a su máximo de ${step.max}.` : "";
      return `El cliente ${outcome.client} pide una conexión. No hay ninguna idle y el pool está por debajo de su máximo, así que se abre la conexión ${conn} y se le entrega.${full}`;
    }
    if (outcome.kind === "reused") {
      return `El cliente ${outcome.client} pide una conexión. La conexión ${conn} está idle, así que el pool la entrega otra vez. No se abre nada nuevo.`;
    }
    if (outcome.kind === "queued") {
      return `El cliente ${outcome.client} pide una conexión. Las ${step.max} están en uso y el pool está lleno, así que espera en la fila, en la posición ${outcome.position}.`;
    }
    if (outcome.kind === "idle") {
      return `El cliente ${outcome.client} libera la conexión ${conn}. No se cierra: queda abierta e idle, lista para el siguiente cliente.`;
    }
    if (outcome.kind === "handed") {
      return `El cliente ${outcome.client} libera la conexión ${conn}. Pasa directo al cliente ${outcome.to}, el más antiguo de la fila, que llevaba ${outcome.waited} s esperando.`;
    }
    return `El cliente ${outcome.client} lleva ${outcome.waited} s esperando, el timeout de acquire, y no volvió ninguna conexión. Su pedido falla con un error y sale de la fila.`;
  },
};

export const figureText: Record<Locale, FigureText> = { en, es };
