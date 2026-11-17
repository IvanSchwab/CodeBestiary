import type { Locale } from "@/lib/i18n";
import type { LegendKey } from "../../iso/iso-kit";
import { ACCESS_TTL, REFRESH_TTL, clockOf, type Step } from "./model";

/** Every word of the figure, in both languages. HTTP lines are code and are not translated. */
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
  client: string;
  server: string;
  clock: string;
  request: string;
  response: string;
  none: string;
  stepOf: (index: number, last: number) => string;
  readout: (step: Step) => string;
  /** What the client holds, for the panel. */
  holds: (step: Step) => string[];
  /** What the auth server knows, for the panel. */
  ledger: (step: Step) => string[];
  clockOf: (step: Step) => string;
  describe: (step: Step) => string;
}

const MINUTES = ACCESS_TTL / 60;
const DAYS = REFRESH_TTL / 86400;
const short = (token: string) => `${token.slice(0, 10)}…${token.slice(-6)}`;

/** The request a step stands for, as code. */
export function requestOf(step: Step): string {
  if (step.kind === "start") return "—";
  if (step.kind === "login") return "POST /login";
  if (step.kind === "call") return `GET /api/orders\nAuthorization: Bearer ${step.presented ? `A${step.presented.id}` : "—"}`;
  if (step.kind === "refresh" || step.kind === "replay") {
    return `POST /token\ngrant_type=refresh_token\nrefresh_token=R${step.presented?.id ?? "?"}`;
  }
  return "—";
}

/** The response a step got, as code. */
export function responseOf(step: Step): string {
  if (step.kind === "start" || step.kind === "clear") return "—";
  if (step.kind === "login" || (step.kind === "refresh" && step.status === 200)) {
    return `200 OK\naccess_token=A${step.access?.id} ${short(step.access!.token)}\nrefresh_token=R${step.refresh?.id}`;
  }
  if (step.kind === "call") return step.status === 200 ? "200 OK" : `401 Unauthorized\nerror="invalid_token" (${step.reason})`;
  return `400 Bad Request\nerror="invalid_grant" (${step.reason})`;
}

const stateWord = {
  en: { active: "active", used: "used", revoked: "revoked" },
  es: { active: "activo", used: "usado", revoked: "revocado" },
};

const en: FigureText = {
  fig: "Fig 5",
  title: "JWT with refresh tokens",
  hint: "Click or ← → to step",
  label:
    "A bench with two machines and nothing joining them. At the back, an issuing cabinet stands for the auth server: it hands out access cards and refresh tags, and keeps a rack with one stub per refresh tag, under a bar that can press the whole row down. At the front, a locker with a card reader and a clock stands for the API: it opens its drawer for a card whose signature and expiry check out. The client keeps its card and tag on a tray between them, and an attacker's copied tag comes in through a hood at the front.",
  control: "JWT with refresh tokens, step by step",
  keys: [
    { mark: "lit", label: "The token or part the step is about" },
    { mark: "raised", label: "Card: an access token (header, claims, signature). Tag: a refresh token" },
    { mark: "flat", label: "Stub: the server's record of a tag. Half down is used; gone is revoked" },
  ],
  caption: `The reader locker never talks to the cabinet. It checks a card with what it has: the shared key (the seal on both machines) and its own clock. The long hand is the time, the short hand the card's exp: once the long hand has passed it, the card is refused with 401. Access cards live ${MINUTES} minutes; tags ${DAYS} days, and only the cabinet takes them. Each exchange spends the tag (its stub drops halfway) and issues a new card and a new tag. When a spent tag comes back, two parties hold it and the cabinet cannot tell which is the thief, so the bar comes down on the whole family. The card already out keeps working until its exp: a JWT cannot be called back.`,
  prev: "Previous step",
  next: "Next step",
  play: "Play",
  pause: "Pause",
  reset: "Restart",
  client: "Client holds",
  server: "Auth server stores",
  clock: "Clock",
  request: "Request",
  response: "Response",
  none: "nothing",
  stepOf: (index, last) => `Step ${index} of ${last}`,
  readout(step) {
    const t = `t ${clockOf(step.at)}`;
    if (step.kind === "start") return `${t} · no tokens`;
    if (step.kind === "login") return `${t} · A1 exp ${clockOf(step.access!.exp)} · R1`;
    if (step.kind === "call") return `${t} · exp ${clockOf(step.readExp ?? 0)} · ${step.status}`;
    if (step.kind === "refresh") return step.status === 200 ? `${t} · rotated R${step.presented?.id} → R${step.refresh?.id}` : `${t} · R${step.presented?.id} ${step.reason} · 400`;
    if (step.kind === "replay") return `${t} · R1 reused · family revoked`;
    return `${t} · log in again`;
  },
  holds(step) {
    const list: string[] = [];
    if (step.access) list.push(`access A${step.access.id} · exp ${clockOf(step.access.exp)}`);
    if (step.refresh) list.push(`refresh R${step.refresh.id}`);
    return list;
  },
  ledger: (step) => step.records.map((record) => `R${record.id} ${stateWord.en[record.state]}`),
  clockOf: (step) => `t = ${clockOf(step.at)}`,
  describe(step) {
    const id = step.presented?.id;
    switch (step.kind) {
      case "start":
        return "Nobody is logged in. The cabinet has issued nothing, and the client's tray is empty.";
      case "login":
        return `The user logs in. The cabinet issues access card A1, signed with the key and valid for ${MINUTES} minutes, and refresh tag R1, whose stub it keeps in its rack.`;
      case "call":
        if (step.status === 200) {
          const revoked = step.records.length > 0 && step.records.every((record) => record.state === "revoked");
          return revoked
            ? `A${id} still opens the drawer: its signature is good and its exp has not passed. The family was revoked at the cabinet, but the reader never asks the cabinet.`
            : `The client calls the API with A${id}. The reader checks the signature with the key and exp against its own clock, without asking the cabinet, and opens the drawer.`;
        }
        return `A${id} has expired: the clock has passed its exp. The reader refuses it with 401 and the flag goes up.`;
      case "refresh":
        if (step.status === 200) {
          return `The client sends R${id} to the cabinet. The stub shows it unused, so the cabinet spends it (the stub drops halfway) and issues A${step.access?.id} and R${step.refresh?.id}: rotation. The expired card goes in the bin.`;
        }
        return `The client sends R${id}, but its whole family has been revoked. The cabinet answers 400 invalid_grant and issues nothing.`;
      case "replay":
        return "An attacker who copied R1 at login sends it to the cabinet. R1 is already spent: two parties hold it, so the cabinet revokes every tag of the family, R2 included.";
      default:
        return "The client has no valid token left and drops both. The user has to log in again, which starts a new family.";
    }
  },
};

const es: FigureText = {
  fig: "Fig 5",
  title: "JWT con refresh tokens",
  hint: "Clic o ← → para avanzar",
  label:
    "Un banco con dos máquinas y nada que las una. Al fondo, un gabinete emisor representa al servidor de autenticación: entrega tarjetas de acceso y fichas de refresh, y guarda un estante con un talón por cada ficha, bajo una barra que puede hundir toda la fila. Adelante, un casillero con lector de tarjetas y un reloj representa a la API: abre su cajón ante una tarjeta con firma y vencimiento válidos. El cliente guarda su tarjeta y su ficha en una bandeja entre los dos, y la copia robada de un atacante entra por una campana al frente.",
  control: "JWT con refresh tokens, paso a paso",
  keys: [
    { mark: "lit", label: "El token o la pieza de la que trata el paso" },
    { mark: "raised", label: "Tarjeta: un access token (header, claims, firma). Ficha: un refresh token" },
    { mark: "flat", label: "Talón: el registro de una ficha en el servidor. A media altura está usado; si no se ve, revocado" },
  ],
  caption: `El casillero lector nunca consulta al gabinete. Revisa cada tarjeta con lo que tiene: la clave compartida (el sello de las dos máquinas) y su propio reloj. La aguja larga es la hora y la corta el exp de la tarjeta: cuando la larga la pasa, la tarjeta se rechaza con 401. Las tarjetas de acceso duran ${MINUTES} minutos; las fichas, ${DAYS} días, y solo las recibe el gabinete. Cada canje gasta la ficha (su talón baja a la mitad) y emite una tarjeta y una ficha nuevas. Si vuelve una ficha ya gastada, dos partes la tienen y el gabinete no puede saber cuál es la ladrona, así que la barra baja sobre toda la familia. La tarjeta que ya está afuera sigue sirviendo hasta su exp: un JWT no se puede retirar.`,
  prev: "Paso anterior",
  next: "Paso siguiente",
  play: "Reproducir",
  pause: "Pausar",
  reset: "Reiniciar",
  client: "El cliente tiene",
  server: "El servidor guarda",
  clock: "Reloj",
  request: "Pedido",
  response: "Respuesta",
  none: "nada",
  stepOf: (index, last) => `Paso ${index} de ${last}`,
  readout(step) {
    const t = `t ${clockOf(step.at)}`;
    if (step.kind === "start") return `${t} · sin tokens`;
    if (step.kind === "login") return `${t} · A1 exp ${clockOf(step.access!.exp)} · R1`;
    if (step.kind === "call") return `${t} · exp ${clockOf(step.readExp ?? 0)} · ${step.status}`;
    if (step.kind === "refresh") return step.status === 200 ? `${t} · rotation R${step.presented?.id} → R${step.refresh?.id}` : `${t} · R${step.presented?.id} ${step.reason === "revoked" ? "revocado" : step.reason} · 400`;
    if (step.kind === "replay") return `${t} · R1 reusado · familia revocada`;
    return `${t} · iniciar sesión otra vez`;
  },
  holds(step) {
    const list: string[] = [];
    if (step.access) list.push(`access A${step.access.id} · exp ${clockOf(step.access.exp)}`);
    if (step.refresh) list.push(`refresh R${step.refresh.id}`);
    return list;
  },
  ledger: (step) => step.records.map((record) => `R${record.id} ${stateWord.es[record.state]}`),
  clockOf: (step) => `t = ${clockOf(step.at)}`,
  describe(step) {
    const id = step.presented?.id;
    switch (step.kind) {
      case "start":
        return "No hay ninguna sesión iniciada. El gabinete no emitió nada y la bandeja del cliente está vacía.";
      case "login":
        return `Se inicia sesión. El gabinete emite la tarjeta de acceso A1, firmada con la clave y válida por ${MINUTES} minutos, y la ficha de refresh R1, cuyo talón guarda en su estante.`;
      case "call":
        if (step.status === 200) {
          const revoked = step.records.length > 0 && step.records.every((record) => record.state === "revoked");
          return revoked
            ? `A${id} todavía abre el cajón: la firma es válida y su exp no pasó. La familia se revocó en el gabinete, pero el lector nunca le pregunta al gabinete.`
            : `El cliente llama a la API con A${id}. El lector verifica la firma con la clave y el exp con su propio reloj, sin consultar al gabinete, y abre el cajón.`;
        }
        return `A${id} venció: el reloj pasó su exp. El lector la rechaza con 401 y se levanta la bandera.`;
      case "refresh":
        if (step.status === 200) {
          return `El cliente envía R${id} al gabinete. El talón la muestra sin usar, así que el gabinete la gasta (el talón baja a la mitad) y emite A${step.access?.id} y R${step.refresh?.id}: rotation. La tarjeta vencida va al cesto.`;
        }
        return `El cliente envía R${id}, pero toda su familia fue revocada. El gabinete responde 400 invalid_grant y no emite nada.`;
      case "replay":
        return "Un atacante que copió R1 al iniciar sesión la envía al gabinete. R1 ya estaba gastada: dos partes la tienen, así que el gabinete revoca todas las fichas de la familia, incluida R2.";
      default:
        return "Al cliente no le queda ningún token válido y descarta los dos. Hay que iniciar sesión otra vez, lo que crea una familia nueva.";
    }
  },
};

export const figureText: Record<Locale, FigureText> = { en, es };
