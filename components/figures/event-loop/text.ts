import type { Locale } from "@/lib/i18n";
import type { LegendKey } from "../../iso/iso-kit";
import type { Step, TokenId } from "./model";

/** Every word of the figure, in both languages. The snippet itself is code and is not translated. */
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
  code: string;
  console: string;
  consoleEmpty: string;
  stack: string;
  microtasks: string;
  tasks: string;
  empty: string;
  stepOf: (index: number, last: number) => string;
  readout: (index: number, last: number, step: Step) => string;
  describe: (step: Step, isLast: boolean) => string;
  unit: Record<TokenId, string>;
}

const en: FigureText = {
  fig: "Fig 1",
  title: "Event loop",
  hint: "← → step · space play",
  label:
    "A pick-and-place machine that models the JavaScript event loop. A rotating arm carries one token at a time from a long task lane or a short microtask lane to a press, which stands for the call stack. Finished tokens line up on a tray in the order they ran.",
  control: "Event loop, step by step",
  keys: [
    { mark: "lit", label: "The code that is running" },
    { mark: "raised", label: "Round: a task (the script, the timer callback)" },
    { mark: "flat", label: "Square: a microtask (the promise callback)" },
  ],
  caption:
    "The arm is the loop. It turns one way and reaches the short microtask lane before the long task lane, so it takes a task only when no microtask is waiting. The press is the call stack: the head comes down once per call, and the dial counts the lines printed. The tray fills from its far end, so it reads script, promise callback, timer callback: the promise ran before the timer, even with a delay of 0.",
  prev: "Previous step",
  next: "Next step",
  play: "Play",
  pause: "Pause",
  reset: "Restart",
  code: "Code",
  console: "Console",
  consoleEmpty: "Nothing printed yet",
  stack: "Call stack",
  microtasks: "Microtasks",
  tasks: "Tasks",
  empty: "empty",
  stepOf: (index, last) => `Step ${index} of ${last}`,
  readout: (index, last, step) =>
    `step ${index}/${last} · stack ${step.stack.length} · micro ${step.microtasks.length} · tasks ${step.tasks.length}`,
  unit: { script: "script", timeout: "timer callback", promise: "promise callback" },
  describe(step, isLast) {
    const unit = step.token ? `the ${this.unit[step.token]}` : "";
    if (step.kind === "idle") {
      return "The script is the first task and waits on the task lane. Neither callback has been scheduled yet.";
    }
    if (step.kind === "take") {
      if (step.token === "script") return "The loop takes one task, the script, and puts it on the call stack.";
      if (step.from === "microtask") {
        return `The stack is empty, so the loop checks the microtasks first. It takes ${unit}, ahead of the timer that was scheduled before it.`;
      }
      return `No microtask is waiting, so the loop takes the next task: ${unit}.`;
    }
    if (step.kind === "call" && step.call) {
      if (step.call.kind === "log") return `console.log runs on top of ${unit} and prints "${step.call.text}".`;
      if (step.call.kind === "setTimeout") {
        return "setTimeout hands its callback to the timer. With a delay of 0 it goes straight to the task lane, but it does not run yet.";
      }
      return "The promise is already resolved, so then() puts its callback on the microtask lane.";
    }
    if (isLast) return "The timer callback returns. Both lanes and the stack are empty, and the loop waits for new tasks.";
    if (step.token === "script") return "The script ends and leaves the stack. The stack is empty.";
    return `${unit.charAt(0).toUpperCase()}${unit.slice(1)} returns. The microtask lane is empty now.`;
  },
};

const es: FigureText = {
  fig: "Fig 1",
  title: "Event loop",
  hint: "← → paso · espacio reproducir",
  label:
    "Una máquina de pick and place que modela el event loop de JavaScript. Un brazo giratorio lleva una ficha a la vez desde un carril largo de tareas o un carril corto de microtasks hasta una prensa, que representa el call stack. Las fichas terminadas se alinean en una bandeja en el orden en que se ejecutaron.",
  control: "Event loop, paso a paso",
  keys: [
    { mark: "lit", label: "El código que se está ejecutando" },
    { mark: "raised", label: "Redonda: una tarea (el script, el callback del temporizador)" },
    { mark: "flat", label: "Cuadrada: una microtask (el callback de la promesa)" },
  ],
  caption:
    "El brazo es el loop. Gira en un solo sentido y llega al carril corto de microtasks antes que al carril largo de tareas, así que solo toma una tarea cuando no hay ninguna microtask esperando. La prensa es el call stack: el cabezal baja una vez por cada llamada, y el dial cuenta las líneas impresas. La bandeja se llena desde el extremo más lejano, así que se lee script, callback de la promesa, callback del temporizador: la promesa se ejecutó antes que el temporizador, incluso con un retardo de 0.",
  prev: "Paso anterior",
  next: "Paso siguiente",
  play: "Reproducir",
  pause: "Pausar",
  reset: "Reiniciar",
  code: "Código",
  console: "Consola",
  consoleEmpty: "Todavía no se imprimió nada",
  stack: "Call stack",
  microtasks: "Microtasks",
  tasks: "Tareas",
  empty: "vacío",
  stepOf: (index, last) => `Paso ${index} de ${last}`,
  readout: (index, last, step) =>
    `paso ${index}/${last} · stack ${step.stack.length} · micro ${step.microtasks.length} · tareas ${step.tasks.length}`,
  unit: { script: "script", timeout: "callback del temporizador", promise: "callback de la promesa" },
  describe(step, isLast) {
    const unit = step.token ? `el ${this.unit[step.token]}` : "";
    if (step.kind === "idle") {
      return "El script es la primera tarea y espera en el carril de tareas. Ningún callback fue programado todavía.";
    }
    if (step.kind === "take") {
      if (step.token === "script") return "El loop toma una tarea, el script, y la pone en el call stack.";
      if (step.from === "microtask") {
        return `El stack está vacío, así que el loop revisa primero las microtasks. Toma ${unit}, antes que el temporizador que se programó primero.`;
      }
      return `No hay ninguna microtask esperando, así que el loop toma la siguiente tarea: ${unit}.`;
    }
    if (step.kind === "call" && step.call) {
      if (step.call.kind === "log") return `console.log se ejecuta sobre ${unit} e imprime "${step.call.text}".`;
      if (step.call.kind === "setTimeout") {
        return "setTimeout entrega su callback al temporizador. Con un retardo de 0 pasa directo al carril de tareas, pero todavía no se ejecuta.";
      }
      return "La promesa ya está resuelta, así que then() pone su callback en el carril de microtasks.";
    }
    if (isLast) {
      return "El callback del temporizador retorna. Los dos carriles y el stack están vacíos, y el loop espera nuevas tareas.";
    }
    if (step.token === "script") return "El script termina y sale del stack. El stack queda vacío.";
    return `${unit.charAt(0).toUpperCase()}${unit.slice(1)} retorna. El carril de microtasks queda vacío.`;
  },
};

export const figureText: Record<Locale, FigureText> = { en, es };

/** Name of a stack frame for display. */
export const frameName = (frame: string, text: FigureText) =>
  frame in text.unit ? text.unit[frame as TokenId] : frame;
