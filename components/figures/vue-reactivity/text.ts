import type { Locale } from "@/lib/i18n";
import type { LegendKey } from "../../iso/iso-kit";
import { STEPS, type SourceId, type Step } from "./model";

/** Every word of the figure, in both languages. The script itself is code and is not translated. */
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
  none: string;
  subscribersOf: (source: SourceId) => string;
  stepOf: (index: number, last: number) => string;
  readout: (index: number, last: number, step: Step) => string;
  describe: (step: Step, index: number) => string;
}

const isFirstRun = (index: number) => !STEPS.slice(0, index).some((step) => step.kind === "run");

const linkCount = (step: Step) => Object.values(step.links).filter((level) => level !== "off").length;
const shortDouble = (step: Step) => (step.double === null ? "–" : String(step.double));

const en: FigureText = {
  fig: "Fig 2",
  title: "Vue reactivity",
  hint: "Click or ← → to step",
  label:
    "A trip-rod relay that models Vue reactivity. Each ref is a rod with a push grip; writing the ref pushes the rod. A drop pin couples a rod to the bar of the code that read it. The computed is a slider with a flag and a register, and the effect is a bell that rings when it runs.",
  control: "Vue reactivity, step by step",
  keys: [
    { mark: "lit", label: "The part at work" },
    { mark: "raised", label: "Pin down: the source has this subscriber" },
    { mark: "dim", label: "Pin up: no link, a push does not pass" },
  ],
  caption:
    "Each ref is a rod: writing it pushes the rod (trigger). Reading a source while code runs drops a pin that couples the rod to that code's bar (track), so the next push reaches it. The computed is a slider: a push raises its flag (dirty) and passes on to the bell, but its register only moves when the computed is read and recomputes. When the effect runs again its pins rise halfway, and the ones the run does not read come out: after show = false, the push from count reaches nothing.",
  prev: "Previous step",
  next: "Next step",
  play: "Play",
  pause: "Pause",
  reset: "Restart",
  code: "Code",
  console: "Console",
  consoleEmpty: "Nothing printed yet",
  none: "none",
  subscribersOf: (source) => `Subscribers of ${source}`,
  stepOf: (index, last) => `Step ${index} of ${last}`,
  readout: (index, last, step) =>
    `step ${index}/${last} · count ${step.refs.count} · double ${shortDouble(step)} · links ${linkCount(step)}`,
  describe(step, index) {
    if (step.kind === "idle") {
      return "Nothing has run yet. Every pin is up, so no source has a subscriber, and the flag of the computed is up because it has never computed.";
    }
    if (step.kind === "write") {
      if (step.source === "count" && step.notified.length === 0) {
        return "count.value = 3 pushes the count rod, but its pin is up and the rod slides alone. Nobody is notified and nothing runs: double still holds 4 and will check count the next time it is read.";
      }
      if (step.source === "count") {
        return "count.value = 2 pushes the count rod. Its pin is down, so it carries the slider of double: the flag goes up (dirty) and the slider trips the effect. Nothing is computed yet.";
      }
      return "show.value = false pushes the show rod, and its pin passes the push to the effect.";
    }
    if (step.kind === "compute") {
      if (step.asked === "check") {
        return "Before running, the effect asks double whether it really changed. The getter runs again, reads count and stores 4. It changed, so the effect runs.";
      }
      return "double is dirty, so its getter runs: it reads count.value, the pin drops into the count rod, and the register stores 2. The flag goes down.";
    }
    if (step.kind === "run") {
      if (isFirstRun(index)) return "effect() runs its function at once. The bell rings.";
      return "The effect runs again. Its pins rise halfway: each link has to be confirmed by this run, or it comes out.";
    }
    if (step.kind === "read") {
      if (step.source === "show") return `It reads show.value (${step.refs.show}): the pin into the show rod drops. track(effect, show).`;
      if (step.cached) return "It reads double.value. The flag is down, so double returns the cached 4 without running its getter.";
      return "It reads double.value: the pin into the slider drops. The flag is up, so double has to compute.";
    }
    if (step.kind === "log") {
      const printed = step.output.at(-1);
      return `console.log prints ${printed}.`;
    }
    if (step.released.length) {
      return "The run ends without reading double, so its pin comes out. double has no subscriber left and lets go of count too.";
    }
    return "The run ends. Every link it read stays in.";
  },
};

const es: FigureText = {
  fig: "Fig 2",
  title: "Reactividad de Vue",
  hint: "Clic o ← → para avanzar",
  label:
    "Un relé de varillas que modela la reactividad de Vue. Cada ref es una varilla con un pulsador; escribir el ref empuja la varilla. Un perno acopla la varilla con la barra del código que la leyó. El computed es un deslizador con una bandera y un registro, y el effect es una campana que suena cuando se ejecuta.",
  control: "Reactividad de Vue, paso a paso",
  keys: [
    { mark: "lit", label: "La pieza que trabaja" },
    { mark: "raised", label: "Perno abajo: la fuente tiene ese subscriber" },
    { mark: "dim", label: "Perno arriba: sin vínculo, el empuje no pasa" },
  ],
  caption:
    "Cada ref es una varilla: escribirlo empuja la varilla (trigger). Leer una fuente mientras corre un código baja un perno que acopla la varilla con la barra de ese código (track), y así el próximo empuje lo alcanza. El computed es un deslizador: un empuje levanta su bandera (dirty) y pasa hasta la campana, pero su registro solo se mueve cuando se lee el computed y se recalcula. Cuando el effect vuelve a ejecutarse, sus pernos suben hasta la mitad y salen los que la ejecución no lee: después de show = false, el empuje de count no llega a nada.",
  prev: "Paso anterior",
  next: "Paso siguiente",
  play: "Reproducir",
  pause: "Pausar",
  reset: "Reiniciar",
  code: "Código",
  console: "Consola",
  consoleEmpty: "Todavía no se imprimió nada",
  none: "ninguno",
  subscribersOf: (source) => `Subscribers de ${source}`,
  stepOf: (index, last) => `Paso ${index} de ${last}`,
  readout: (index, last, step) =>
    `paso ${index}/${last} · count ${step.refs.count} · double ${shortDouble(step)} · links ${linkCount(step)}`,
  describe(step, index) {
    if (step.kind === "idle") {
      return "Todavía no se ejecutó nada. Todos los pernos están arriba, así que ninguna fuente tiene subscribers, y la bandera del computed está levantada porque nunca se calculó.";
    }
    if (step.kind === "write") {
      if (step.source === "count" && step.notified.length === 0) {
        return "count.value = 3 empuja la varilla de count, pero su perno está arriba y la varilla se desliza sola. No se notifica a nadie y no se ejecuta nada: double sigue guardando 4 y revisará count la próxima vez que se lea.";
      }
      if (step.source === "count") {
        return "count.value = 2 empuja la varilla de count. Su perno está abajo, así que arrastra el deslizador de double: la bandera sube (dirty) y el deslizador dispara el effect. Todavía no se calcula nada.";
      }
      return "show.value = false empuja la varilla de show, y su perno pasa el empuje al effect.";
    }
    if (step.kind === "compute") {
      if (step.asked === "check") {
        return "Antes de ejecutarse, el effect le pregunta a double si de verdad cambió. El getter se ejecuta otra vez, lee count y guarda 4. Cambió, así que el effect se ejecuta.";
      }
      return "double está dirty, así que se ejecuta su getter: lee count.value, el perno baja en la varilla de count y el registro guarda 2. La bandera baja.";
    }
    if (step.kind === "run") {
      if (isFirstRun(index)) return "effect() ejecuta su función en el momento. Suena la campana.";
      return "El effect se ejecuta otra vez. Sus pernos suben hasta la mitad: cada vínculo tiene que confirmarse en esta ejecución, o sale.";
    }
    if (step.kind === "read") {
      if (step.source === "show") return `Lee show.value (${step.refs.show}): baja el perno en la varilla de show. track(effect, show).`;
      if (step.cached) return "Lee double.value. La bandera está abajo, así que double devuelve el 4 guardado sin ejecutar su getter.";
      return "Lee double.value: baja el perno en el deslizador. La bandera está arriba, así que double tiene que calcularse.";
    }
    if (step.kind === "log") {
      const printed = step.output.at(-1);
      return `console.log imprime ${printed}.`;
    }
    if (step.released.length) {
      return "La ejecución termina sin leer double, así que su perno sale. double se queda sin subscribers y también suelta count.";
    }
    return "La ejecución termina. Cada vínculo que leyó queda puesto.";
  },
};

export const figureText: Record<Locale, FigureText> = { en, es };
