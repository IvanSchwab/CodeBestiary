import type { DiscoveredBeast } from "@/lib/beasts";

export const eventLoop: DiscoveredBeast = {
  slug: "event-loop",
  number: 1,
  status: "discovered",
  name: { en: "Event Loop", es: "Event loop" },
  habitat: "runtime",
  ecosystem: { en: "JavaScript", es: "JavaScript" },
  danger: 3,
  // Drafted by Claude and approved by the author.
  draft: false,
  sheet: {
    en: {
      tagline: "The scheduler that decides what JavaScript runs next, one task at a time.",
      behavior: [
        "JavaScript runs on a single thread: one call stack, one thing at a time. Calling a function pushes a frame onto the stack, and returning pops it. Nothing else can run until the stack is empty.",
        "Work that cannot finish right away, such as a timer, a network response or a click, does not run in place. Its callback waits in a queue, and there are two kinds. The task queue (often called the macrotask queue) holds callbacks from `setTimeout`, events and I/O. The microtask queue holds promise reactions (`then`, `catch`, `finally` and the code after an `await`) and `queueMicrotask` callbacks.",
        "The event loop repeats one routine. It takes one task and runs it until the stack is empty. Then it runs every microtask in the queue, including any that were added along the way. Only after that does the browser get a chance to render, and the loop takes the next task.",
        "That routine explains the classic puzzle. The script itself is a task. While it runs, `setTimeout(fn, 0)` puts `fn` in the task queue and a resolved promise puts its callback in the microtask queue. When the script ends, the microtask queue is drained first, so the promise callback runs before the timer, even with a delay of zero.",
      ],
      dangers: [
        {
          title: "`setTimeout(fn, 0)` does not mean \"now\"",
          body: "It means \"no sooner than the next task\". The current script and every pending microtask run first. Browsers also clamp deeply nested timers to a minimum of about 4 ms.",
        },
        {
          title: "Microtasks can starve the loop",
          body: "The microtask queue is drained until it is empty. A microtask that keeps scheduling another microtask never lets the loop reach the next task, so timers, events and rendering all stall.",
        },
        {
          title: "A long task blocks everything",
          body: "The loop cannot interrupt a running task. A slow synchronous function freezes input and rendering until it returns. Splitting the work into several tasks lets input and rendering happen in between.",
        },
        {
          title: "`await` does not pause the thread",
          body: "It ends the function's current turn and schedules the rest as a microtask. Other code runs in between, so shared state may have changed by the time execution resumes.",
        },
      ],
      sightings: ["In PianoBar, notes for the practice metronome were first scheduled with `setTimeout`. While the Three.js studio was loading, the main thread stayed busy and the clicks arrived late and bunched together. The fix was to stop trusting timers for timing: a short loop now schedules notes a little ahead on the `AudioContext` clock, which keeps running even when the thread is blocked."],
    },
    es: {
      tagline: "El planificador que decide qué ejecuta JavaScript a continuación, una tarea a la vez.",
      behavior: [
        "JavaScript se ejecuta en un solo hilo: un call stack, una cosa a la vez. Llamar a una función apila un frame en el stack y retornar lo desapila. Nada más puede ejecutarse hasta que el stack queda vacío.",
        "El trabajo que no puede terminar de inmediato, como un temporizador, una respuesta de red o un clic, no se ejecuta en el lugar. Su callback espera en una cola, y hay dos tipos. La cola de tareas (conocida como cola de macrotasks) guarda los callbacks de `setTimeout`, de eventos y de I/O. La cola de microtasks guarda las reacciones de promesas (`then`, `catch`, `finally` y el código posterior a un `await`) y los callbacks de `queueMicrotask`.",
        "El event loop repite una rutina. Toma una tarea y la ejecuta hasta que el stack queda vacío. Después ejecuta todas las microtasks de la cola, incluidas las que se agregaron en el camino. Recién entonces el navegador tiene la oportunidad de renderizar, y el loop toma la tarea siguiente.",
        "Esa rutina explica el acertijo clásico. El script es en sí una tarea. Mientras se ejecuta, `setTimeout(fn, 0)` pone `fn` en la cola de tareas y una promesa resuelta pone su callback en la cola de microtasks. Cuando el script termina, primero se vacía la cola de microtasks, así que el callback de la promesa se ejecuta antes que el del temporizador, incluso con un retardo de cero.",
      ],
      dangers: [
        {
          title: "`setTimeout(fn, 0)` no significa «ahora»",
          body: "Significa «no antes de la próxima tarea». Primero se ejecutan el script actual y todas las microtasks pendientes. Además, los navegadores imponen un mínimo de unos 4 ms a los temporizadores muy anidados.",
        },
        {
          title: "Las microtasks pueden dejar al loop sin avanzar",
          body: "La cola de microtasks se vacía por completo. Una microtask que siempre programa otra microtask impide que el loop llegue a la tarea siguiente, y se detienen los temporizadores, los eventos y el renderizado.",
        },
        {
          title: "Una tarea larga bloquea todo",
          body: "El loop no puede interrumpir una tarea en ejecución. Una función síncrona lenta congela la entrada y el renderizado hasta que retorna. Dividir el trabajo en varias tareas permite que la entrada y el renderizado ocurran entre una y otra.",
        },
        {
          title: "`await` no pausa el hilo",
          body: "Termina el turno actual de la función y programa el resto como una microtask. Entre medio se ejecuta otro código, así que el estado compartido puede haber cambiado cuando la ejecución se reanuda.",
        },
      ],
      sightings: ["En PianoBar, las notas del metrónomo de práctica se programaban al principio con `setTimeout`. Mientras cargaba el estudio de Three.js, el main thread quedaba ocupado y los golpes llegaban tarde y amontonados. La solución fue dejar de confiar en los timers para el tiempo: ahora un loop corto programa las notas un poco antes sobre el reloj del `AudioContext`, que sigue corriendo aunque el hilo esté bloqueado."],
    },
  },
  sources: [
    {
      title: "MDN: JavaScript execution model",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model",
    },
    {
      title: "MDN: Using microtasks in JavaScript with queueMicrotask()",
      url: "https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide",
    },
    {
      title: "HTML Standard: Event loops",
      url: "https://html.spec.whatwg.org/multipage/webappapis.html#event-loops",
    },
    {
      title: "Jake Archibald: Tasks, microtasks, queues and schedules",
      url: "https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/",
    },
  ],
};
