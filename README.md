# Code Bestiary

A field guide to programming concepts. Every concept I study becomes a "beast": a written sheet that explains how it behaves, and an interactive figure that shows it working. The site is bilingual (English and Spanish).

The first beast is the JavaScript event loop. Its figure is a small pick-and-place machine: the arm is the loop, the press is the call stack, and two lanes hold tasks and microtasks.

## Stack

Next.js (App Router), TypeScript and Tailwind CSS, statically generated. The figures are isometric SVG drawings built with the [Anatomy](https://github.com/wheresryan22/anatomy) skill and Claude Code. No UI library, analytics or tracking.

## Run it

Requires Node 22.12 or newer (the project is developed on Node 24).

```sh
npm install
npm run dev      # http://localhost:3000
```

```sh
npm run lint
npm test         # checks the event loop model against Node
npm run build
```

Set `NEXT_PUBLIC_SITE_URL` to the public URL in production (for example `https://example.com`). It is the base for canonical URLs, hreflang, Open Graph and the sitemap. Without it the site falls back to the Vercel production URL when there is one, then to `http://localhost:3000`.

## Add a beast

With Claude Code, run:

```
/new-beast <concept>
```

The command asks for the text of the sheet, adds the entry, builds the figure with Anatomy, wires it to the page and waits for approval before committing.

By hand:

1. Add `content/beasts/<slug>.ts` (see `event-loop.ts`) and list it in `content/beasts/index.ts`.
2. Add its glyph in `components/glyph.tsx`.
3. Build its figure in `components/figures/<slug>/` and register it in `components/figures/index.tsx`.

`CLAUDE.md` describes the structure, the data model and the conventions. `SPEC.md` (in Spanish) records the product decisions.
