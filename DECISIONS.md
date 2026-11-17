# Decisions

What was decided during the build that `SPEC.md` does not cover, or that departs from it.

## Site

- **Next.js 16 conventions.** The locale redirect lives in `proxy.ts` (the `middleware` convention is deprecated in this version).
- **Cache Components is turned off.** The scaffold enables `cacheComponents` and `partialPrefetching`. With them, a locked or unknown beast URL answered 200 with a streamed "not found" instead of a real 404, and `dynamicParams = false` is not available. The site is fully static, so both flags were removed and the routes use `dynamicParams = false`.
- **URLs without a locale are redirected, not only `/`.** `/about` goes to `/en/about` or `/es/about` by the same rule as `/`. This keeps every 404 localized. URLs that already carry `/en` or `/es` are never redirected, as the SPEC requires.
- **Unknown URLs under a locale** are caught by `app/[lang]/[...rest]` and render the localized 404.
- **Theme script** is a plain inline `<script>` at the top of `<body>`, so it runs before first paint. Two alternatives were measured and rejected: `next/script` queues the code until the Next.js runtime loads (the wrong theme can flash), and the same script inside `<head>` caused an intermittent React hydration error (4 of 30 loads; 0 of 30 in `<body>`). In development only, the 404 page logs a React warning about this script tag; production is clean.
- **`@types/node` raised to 24** because Vitest 5 does not install with version 20.
- **Dev dependencies added:** Vitest, and `@vue/reactivity` (pinned at 3.5.45), which only the Vue reactivity figure's test uses to check its model against the real library. No runtime dependency was added beyond the scaffold.
- **Open Graph image** uses the default font of `next/og`, not Fraunces. Shipping the font file only for the social card was not worth it.
- **Favicon** is an SVG of the event loop glyph (`app/icon.svg`), replacing the scaffold's default.
- **Locked glyphs** are drawn in muted ink at reduced opacity instead of the rule color, which was nearly invisible in the dark theme.
- **Sticky figure only on tall screens.** The SPEC asks for a sticky figure from 1024 px. The figure block (card, legend, controls, code, console and caption) is about 920 px tall at desktop width, so it is sticky only when the viewport is at least 960 px high; on shorter screens it scrolls with the page instead of being cut off.
- **ESLint ignores** `.claude/`, `.agents/` and `components/iso/` (vendored Anatomy code).
- **About:** the bio is the author's text, lightly adapted and translated to English. Links are LinkedIn, GitHub and the portfolio. The draft badge moved from the page title to the two sections that are still drafts.

## Event loop figure

- **The object.** A pick-and-place dispatcher: a hub with an arm that turns one way (the loop), a long roller lane (tasks), a short one (microtasks), a press (the call stack) and a tray where finished units line up.
- **The press is the call stack.** The SPEC describes "a tower where tokens stack". Stacking loose tiles would have needed parts that appear from nowhere, so a call is one stroke of the press head on the running token: token alone is one frame, head down is two.
- **The counter is a dial gauge** that advances one mark per printed line. The order of execution is shown by the tray.
- **The arm waits over the microtask lane.** After placing a unit it parks at the microtask station, the first place it checks. A task is only reached by turning past it.
- **Tokens:** round for tasks (the script has a double ring, the timer callback a dot), square for the microtask.
- **Tray order.** The first unit to finish sits farthest from the press, so the tray reads right to left on screen. The caption says so.
- **The caption sits below the controls**, not directly under the card, to keep the controls next to the drawing.
- **A state row** (call stack, microtasks, tasks) was added to the panel under the card. The SPEC lists only the snippet and the console.
- **The kit's theme tokens are overridden** in `components/figures/figures.css` so figures take the site's paper and ink and follow `data-theme` on `<html>`. The kit files themselves are unmodified.
- **Painter's order is set by hand**, not with the skill's geometric audit (`kit/audit.mjs`). The audit is meant for figures with pipes, cables and round turned parts; this one has none. The line-end check runs and passes with 0.
- **Size:** 47 solids and about 470 paths, SVG only, no WebGL. Within Figure; no scope was cut.
- **Pointer:** a click or tap on the drawing advances one step (and restarts from the last one). There is no drag interaction.

## Vue reactivity figure

- **The object.** A trip-rod relay on a bench. Each ref is a rod with a knurled push grip (`count` and `show`); writing it pushes the rod (trigger). A drop pin couples a rod to the bar of whoever read it (track), so a push passes only where a pin is down. The computed `double` is a slider under a housing, with a pop-up flag (dirty) and a register cursor (cached value). The effect is a bell housing: a notice cocks the striker, a run rings the bell.
- **Pins have three positions.** Down is a link, up is none, half up is a link pending re-collection while the effect re-runs. Links the run does not read come out, so after `show = false` the computed loses its subscriber and releases `count`.
- **Dirty follows Vue 3.5.** A write that reaches no subscriber does not raise the flag: the computed notices it is stale on its next read, by version check. The last write of the script (`count = 3`) slides the rod alone.
- **Scope.** One ref per branch, one computed, one effect, three writes. No `reactive()` objects, scheduler, batching, `watch` or cleanup. The effect asking the computed whether it really changed is shown as a compute step.
- **The test runs the panel's script against the real `@vue/reactivity`**, through its `onTrack` and `onTrigger` hooks, and checks the full event order, the console output, the number of getter runs and the pending links per run, plus five more write sequences.
- **Size:** about 69 solids, SVG only. Painter's order is set by hand, as in the event loop; every moving part moves only along one axis, so no part changes its place in the order.

## Token bucket figure

- **The object.** A token dispenser over a request track. A cabinet with a clock dial is the refill clock: once per second of model time a token rises out of a port and a pusher slides it into a tube with four guide rods and a 4-mark level gauge (the bucket, capacity 4). If the tube is full, the pusher sweeps the token over the stack into a closed overflow tray: a discard.
- **Requests are square carriers** on a track below the tube. If there is a token, a latch drops the bottom one onto the carrier, a gate opens and the carrier leaves. If the tube is empty, the carrier sinks through a trap door at once: rejected requests do not wait.
- **Numbers.** Capacity 4, refill 1 token per second, whole tokens on a fixed clock; a refill goes before a request at the same instant. The script shows a discard, a burst of 5 (four pass, the fifth is rejected), two requests per second against one token per second, and a refill back to full, so the idle tour loops.
- **The test** compares the model with an independent lazy-refill token bucket written in the test, on the figure's script and on 100 seeded random runs, and checks the invariants: level within 0 and capacity, a burst from full equals the capacity, and the long-run pass rate equals the refill rate.
- **Size:** 50 solids, about 460 paths, SVG only. Painter's order is set by hand.
- **Panel styles are duplicated** from the event loop with a `tk-` prefix (`tb-` is taken by the kit's tube styles).

## Connection pool figure

- **The object.** A transfer bench in front of a shuttered manifold. The manifold has 3 ports, one per connection the pool may open, joined by a duct to a drum (the database). A shut port is a connection not opened yet; its shutter lifts the first time the port is needed and stays up (lazy creation up to the maximum).
- **Carriages are connections.** Each port has rails and a carriage: at the lane end it is idle, docked at the port it is busy. Clients are pucks numbered by die pips; they ride a carriage to its port and back, and leave on the right.
- **Queue and timeout.** Three seats on the lane hold waiters, oldest nearest the bench. A released carriage goes straight to the head of the line and is never idle in between. A dial gauge follows the oldest wait and drives an ejector that pushes the waiter into a reject pan at 30 s. A second gauge on the drum counts busy connections.
- **Numbers.** `max: 3`, acquire timeout 30 s, on an explicit clock. A timeout due at the same instant as a release is settled first. The script ends with client 2 never releasing, so its carriage stays docked: the leak.
- **The test** compares the model's full trace with an independent reference pool written in the test, on the figure's script and on 160 seeded random scripts, and checks the invariants (open never above max, nothing created while one is idle, oldest waiter served first).
- **Fig number follows the specimen number** ("Fig 4"), as the Vue reactivity figure does ("Fig 2").
- **Size:** 63 solids, about 570 paths at rest, SVG only. Painter's order is set by hand.
- **Panel styles are duplicated** from the event loop with a `cp-` prefix. A shared panel stylesheet is left for later.
