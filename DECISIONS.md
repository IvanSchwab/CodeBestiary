# Decisions

What was decided during the build that `SPEC.md` does not cover, or that departs from it.

## Site

- **Next.js 16 conventions.** The locale redirect lives in `proxy.ts` (the `middleware` convention is deprecated in this version).
- **Cache Components is turned off.** The scaffold enables `cacheComponents` and `partialPrefetching`. With them, a locked or unknown beast URL answered 200 with a streamed "not found" instead of a real 404, and `dynamicParams = false` is not available. The site is fully static, so both flags were removed and the routes use `dynamicParams = false`.
- **URLs without a locale are redirected, not only `/`.** `/about` goes to `/en/about` or `/es/about` by the same rule as `/`. This keeps every 404 localized. URLs that already carry `/en` or `/es` are never redirected, as the SPEC requires.
- **Unknown URLs under a locale** are caught by `app/[lang]/[...rest]` and render the localized 404.
- **Theme script** is loaded with `next/script` (`beforeInteractive`) so it runs before first paint.
- **`@types/node` raised to 24** because Vitest 5 does not install with version 20.
- **Vitest** is the only dependency added (dev only). No runtime dependency was added beyond the scaffold.
- **Open Graph image** uses the default font of `next/og`, not Fraunces. Shipping the font file only for the social card was not worth it.
- **Favicon** is an SVG of the event loop glyph (`app/icon.svg`), replacing the scaffold's default.
- **Locked glyphs** are drawn in muted ink at reduced opacity instead of the rule color, which was nearly invisible in the dark theme.
- **Sticky figure only on tall screens.** The SPEC asks for a sticky figure from 1024 px. The figure block (card, legend, controls, code and console) is about 840 px tall, so it is sticky only when the viewport is at least 820 px high; on shorter screens it scrolls with the page instead of being cut off.
- **ESLint ignores** `.claude/`, `.agents/` and `components/iso/` (vendored Anatomy code).
- **About links:** only GitHub for now. The author will provide the rest.

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
- **Size:** about 45 solids, SVG only, no WebGL. Within Figure; no scope was cut.
