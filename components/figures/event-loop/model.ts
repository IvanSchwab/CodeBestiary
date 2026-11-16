/**
 * Pure model of the event loop for one fixed script. No DOM, no geometry.
 * Everything the figure shows (motion, readout, code panel, console) is
 * derived from the steps this module produces, and model.test.ts checks its
 * output against the same script run by Node.
 */

/** The script the figure walks through, one statement per line. */
export const SNIPPET = [
  'console.log("start");',
  'setTimeout(() => console.log("timeout"), 0);',
  'Promise.resolve().then(() => console.log("promise"));',
  'console.log("end");',
] as const;

/** A unit of work the loop can run: the script itself or one of its callbacks. */
export type TokenId = "script" | "timeout" | "promise";

/** Which queue a unit waits in. */
export type Lane = "task" | "microtask";

export type Call =
  | { kind: "log"; text: string; line: number }
  | { kind: "setTimeout"; schedules: TokenId; line: number }
  | { kind: "then"; schedules: TokenId; line: number };

interface Unit {
  lane: Lane;
  /** Line of the snippet where this unit's code lives (null for the whole script). */
  line: number | null;
  calls: Call[];
}

/** The snippet above, described as the calls each unit makes. */
export const PROGRAM: Record<TokenId, Unit> = {
  script: {
    lane: "task",
    line: null,
    calls: [
      { kind: "log", text: "start", line: 0 },
      { kind: "setTimeout", schedules: "timeout", line: 1 },
      { kind: "then", schedules: "promise", line: 2 },
      { kind: "log", text: "end", line: 3 },
    ],
  },
  timeout: { lane: "task", line: 1, calls: [{ kind: "log", text: "timeout", line: 1 }] },
  promise: { lane: "microtask", line: 2, calls: [{ kind: "log", text: "promise", line: 2 }] },
};

export const TOKENS = Object.keys(PROGRAM) as TokenId[];

export type StepKind = "idle" | "take" | "call" | "return";

export interface Step {
  kind: StepKind;
  /** The unit being taken, running or returning. Null only while idle. */
  token: TokenId | null;
  /** For "take": the queue the loop took the unit from. */
  from: Lane | null;
  /** For "call": the call on top of the stack. */
  call: Call | null;
  /** Active line of the snippet, if any. */
  line: number | null;
  /** Call stack, bottom first. */
  stack: string[];
  /** Task queue (macrotasks), next first. */
  tasks: TokenId[];
  /** Microtask queue, next first. */
  microtasks: TokenId[];
  /** Units that finished, in the order they ran. */
  done: TokenId[];
  /** Console output so far. */
  output: string[];
}

/**
 * Runs the program the way the HTML event loop does: take one task, run it
 * until the stack is empty, then drain the microtask queue completely before
 * taking the next task. Every observable moment becomes a step.
 */
export function simulate(): Step[] {
  const tasks: TokenId[] = ["script"];
  const microtasks: TokenId[] = [];
  const done: TokenId[] = [];
  const output: string[] = [];
  const steps: Step[] = [];

  const snapshot = (
    kind: StepKind,
    token: TokenId | null,
    extra: Partial<Pick<Step, "from" | "call" | "line" | "stack">> = {},
  ) =>
    steps.push({
      kind,
      token,
      from: null,
      call: null,
      line: null,
      stack: [],
      ...extra,
      tasks: [...tasks],
      microtasks: [...microtasks],
      done: [...done],
      output: [...output],
    });

  snapshot("idle", null);

  for (;;) {
    // Microtasks always go first: a task is only taken when none is waiting.
    const from: Lane | null = microtasks.length ? "microtask" : tasks.length ? "task" : null;
    if (!from) break;
    const token = (from === "microtask" ? microtasks : tasks).shift() as TokenId;
    const unit = PROGRAM[token];

    snapshot("take", token, { from, line: unit.line, stack: [token] });

    for (const call of unit.calls) {
      if (call.kind === "log") output.push(call.text);
      else if (call.kind === "setTimeout") tasks.push(call.schedules);
      else microtasks.push(call.schedules);
      const frame = call.kind === "log" ? "console.log" : call.kind;
      snapshot("call", token, { call, line: call.line, stack: [token, frame] });
    }

    done.push(token);
    snapshot("return", token);
  }

  return steps;
}

export const STEPS = simulate();
export const LAST_STEP = STEPS.length - 1;
