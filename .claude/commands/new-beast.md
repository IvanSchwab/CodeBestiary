---
description: Add a beast to the bestiary (or discover a locked one) with its sheet and Anatomy figure
argument-hint: <concept name>
---

Add the beast "$ARGUMENTS" to Code Bestiary. Read `CLAUDE.md` and `SPEC.md` first. Talk to the author in Rioplatense Spanish; code and commits are in English. Work through these steps in order.

## 1. Identify the entry

Look in `content/beasts/index.ts`. If the concept matches a locked beast, you will turn that entry into a discovered one and keep its slug and number. If it is new, propose a slug (kebab-case, English), the next free number, the names in English and Spanish and a habitat, and ask the author to confirm them. If no argument was given, ask which concept.

## 2. Ask for the sheet text

Ask the author for the text of the sheet. **Never write it yourself**, not even as a draft or a suggestion to fill a gap. The sheet needs:

- a one-line tagline;
- behavior: 2 to 4 paragraphs;
- dangers and confusions: a title and a body for each;
- sightings: where they met the concept in practice (optional; without it the page shows the "field notes pending" placeholder);
- sources: real links;
- ecosystem and danger level (1 to 5).

If the text comes in one language only, translate it to the other (site Spanish is neutral, without voseo; technical terms stay in English) and show the author the translation to review before using it. If something is missing, ask for it. Do not fill it in.

## 3. Add or update the entry

Create `content/beasts/<slug>.ts` exporting a `DiscoveredBeast` (see `content/beasts/event-loop.ts`), with `draft: false` because the author wrote the text. Replace the locked entry in `content/beasts/index.ts` with it, or add it in number order. If the beast is new, add its glyph to `components/glyph.tsx` and, if needed, its habitat to `habitatLabels` and the `Habitat` type.

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
