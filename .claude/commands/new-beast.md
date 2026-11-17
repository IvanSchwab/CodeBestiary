---
description: Add a beast to the bestiary (or discover a locked one) with its sheet and Anatomy figure
argument-hint: <concept name>
---

Add the beast "$ARGUMENTS" to Code Bestiary. Read `CLAUDE.md` and `SPEC.md` first. Talk to the author in Rioplatense Spanish; code and commits are in English. Work through these steps in order.

## 1. Identify the entry

Look in `content/beasts/index.ts`. If the concept matches a locked beast, you will turn that entry into a discovered one and keep its slug and number. If it is new, propose a slug (kebab-case, English), the next free number, the names in English and Spanish and a habitat, and ask the author to confirm them. If no argument was given, ask which concept.

## 2. Draft the sheet

Ask the author whether he brings his own text. If he does, use it; if it comes in one language only, translate it (site Spanish is neutral, without voseo; technical terms stay in English) and show him the translation before using it.

Otherwise research the concept and write the sheet yourself, in English and Spanish, as a draft:

- a one-line tagline;
- behavior: 2 to 4 paragraphs;
- dangers and confusions: a title and a body for each;
- sources: real links you opened and checked, preferably specs and official docs;
- ecosystem and danger level (1 to 5).

Every claim must be backed by the sources. Leave `sightings: null`: they are the author's experience. Draft them only if he asks, from his real projects. Show him the full text in both languages and apply his changes.

## 3. Add or update the entry

Create `content/beasts/<slug>.ts` exporting a `DiscoveredBeast` (see `content/beasts/event-loop.ts`), with `draft: true` while the text is a draft. Set it to `false` only when the author wrote the text or approves it explicitly. Replace the locked entry in `content/beasts/index.ts` with it, or add it in number order. If the beast is new, add its glyph to `components/glyph.tsx` and, if needed, its habitat to `habitatLabels` and the `Habitat` type.

## 4. Build the figure with Anatomy

Invoke the `anatomy` skill and follow its `SKILL.md` for this concept:

- Size **Figure**: name it and build it without asking. If your estimate is larger, cut scope while keeping the core idea and note it in `DECISIONS.md`.
- React/Next.js path, in `components/figures/<slug>/`, with the same file layout as `components/figures/event-loop/`. Reuse the kit in `components/iso/` and the skin in `components/figures/figures.css`.
- A pure model with the true behavior and numbers, and a test that checks it against the real thing where that is possible.
- Monochrome, following the site theme in light and dark. No words in the drawing.
- Every text of the figure (title, hint, readout, legend, caption, control labels, screen-reader text) in English and Spanish through a `lang` prop.
- Keyboard control, an idle tour, stillness under reduced motion.

## 5. Wire it to the page

Register the figure in `components/figures/index.tsx` under the beast's slug. The beast page, the home grid, the progress counter and the sitemap pick it up from the data.

## 6. Verify

Run `npm run lint`, `npm test` and `npm run build`. Then verify as the Anatomy skill says: captures on desktop and at 390 px, in both themes and both languages, 4× close-ups of the mechanism, the line check at 0 and a clean console. Fix what you find.

## 7. Show it to the author

Start the site with `npm run dev` and give the author the URLs of the beast in both languages. Wait for their review and apply their changes.

## 8. Commit and push

Only after the author approves explicitly, commit (small, descriptive commits in English) and push. Do not commit or push before that.
