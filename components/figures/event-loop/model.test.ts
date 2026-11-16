import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { SNIPPET, STEPS, simulate } from "./model";

/** Runs the figure's snippet in a real Node process and returns what it prints. */
function runInNode(): string[] {
  const stdout = execFileSync(process.execPath, ["-e", SNIPPET.join("\n")], { encoding: "utf8" });
  return stdout.trim().split("\n");
}

describe("event loop model", () => {
  it("prints the same lines, in the same order, as Node running the snippet", () => {
    const real = runInNode();
    expect(real).toEqual(["start", "end", "promise", "timeout"]);
    expect(STEPS.at(-1)?.output).toEqual(real);
  });

  it("runs the promise callback before the timer callback", () => {
    expect(STEPS.at(-1)?.done).toEqual(["script", "promise", "timeout"]);
  });

  it("only takes a task when no microtask is waiting and the stack is empty", () => {
    STEPS.forEach((step, index) => {
      if (step.kind !== "take") return;
      const before = STEPS[index - 1];
      expect(before.stack).toEqual([]);
      if (step.from === "task") expect(before.microtasks).toEqual([]);
    });
  });

  it("ends with every queue and the stack empty", () => {
    const last = STEPS.at(-1);
    expect(last?.stack).toEqual([]);
    expect(last?.tasks).toEqual([]);
    expect(last?.microtasks).toEqual([]);
  });

  it("is deterministic", () => {
    expect(simulate()).toEqual(STEPS);
  });
});
