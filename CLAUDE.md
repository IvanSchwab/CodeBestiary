# Code Bestiary

@AGENTS.md

A bilingual (English and Spanish) portfolio site where every programming concept the author studies is a "beast": a written sheet plus an interactive figure built with the Anatomy skill. `SPEC.md` (in Spanish) records the product decisions; `DECISIONS.md` records what was decided outside it. Read both before changing behavior or design.

Talk to the author in Rioplatense Spanish. Code, commits and technical names are in English.

## Commands

- `npm run dev`: dev server.
- `npm run lint`, `npm test`, `npm run build`: all three must pass before a commit.

## Structure

```
app/[lang]/                 root layout, home, about, 404, Open Graph image
app/[lang]/beasts/[slug]/   beast page (discovered beasts only)
app/sitemap.ts, robots.ts
proxy.ts                    adds /en or /es to URLs without a locale
dictionaries/               interface strings: en.ts is the shape, es.ts must match it
content/beasts/             the bestiary: index.ts (order, locked entries) and one file per discovered beast
lib/                        i18n.ts (locales), beasts.ts (data model), site.ts (URL, metadata)
components/                 site components; glyph.tsx holds one SVG glyph per beast
components/iso/             the Anatomy kit, copied in unmodified. Do not edit or lint it.
components/figures/         figures.css (site skin for figures), index.tsx (slug → figure)
components/figures/<slug>/  one Anatomy figure per beast
.claude/skills/anatomy/     the Anatomy skill
```

## Data model

`lib/beasts.ts` defines it. A beast is `LockedBeast` (slug, number, name, habitat) or `DiscoveredBeast`, which adds `ecosystem`, `danger` (1 to 5), `draft`, `sources` and a `sheet` per language: `tagline`, `behavior` (paragraphs), `dangers` (title and body) and `sightings` (`null` renders a marked placeholder). Backticks in sheet text render as inline code.

- Locked beasts show on the home grid with their name and a faded glyph. They have no page and no link.
- `draft: true` shows the "Draft" badge. Set it to `false` only when the author wrote or approved the text.
- Sources must be real, verifiable links.

## Bilingual system

- Locales are `en` and `es`, both prefixed in the URL. English is the default and the hreflang `x-default`. Slugs are not translated.
- `proxy.ts` only redirects URLs that have no locale: saved choice (`NEXT_LOCALE` cookie, written by the language switch) first, then `Accept-Language`.
- Every user-facing string exists in both languages: interface strings in `dictionaries/`, beast text in the beast's `sheet`, figure text in the figure's `text.ts`.
- Spanish on the site is neutral, with no voseo and an impersonal voice. Technical terms (call stack, microtask) stay in English.
- Every page sets title, description, canonical, hreflang and Open Graph through `pageMetadata` in `lib/site.ts`.

## Design conventions

- Naturalist field guide: warm paper, dark ink, thin rules, specimen numbers, museum-label captions. Sober ornament.
- No emojis in the interface. No gamer, neon or pixel-art look. No loud gradients or glass effects.
- Fonts: Fraunces (headings), Source Serif 4 (text), JetBrains Mono (code, numbers, labels), through `next/font`.
- Colors are tokens in `app/globals.css`, with one accent (oxide red). Light and dark themes both ship; the toggle sets `data-theme` on `<html>`. Never hard-code a color in a component.
- Beast page: two columns from 1024 px (sheet left, figure right and sticky on tall screens); one column below, figure first. Everything must work at 390 px.
- Honor `prefers-reduced-motion`, keep focus visible, keep contrast at WCAG AA.
- No UI component libraries, analytics or tracking. Other dependencies are allowed when needed if they are free and scale; note each one in `DECISIONS.md`.

## Figures

- Built with the Anatomy skill, following its `SKILL.md`. Size is always **Figure** (one mechanism, 40 to 80 parts). If the estimate is larger, cut scope, keep the core idea and note it in `DECISIONS.md`.
- A figure is a physical machine whose mechanism is the concept. It is monochrome and follows the site theme through `components/figures/figures.css`; words stay out of the drawing.
- File layout follows `references/react.md` of the skill. `components/figures/event-loop/` is the reference: `model.ts` (pure model, with a test against real behavior), `view.ts`, `geometry.ts`, `pose.ts`, `art.tsx` (server), `live.tsx` (the one client component), `text.ts` (both languages), `figure.tsx`.
- A figure takes a `lang` prop and is registered in `components/figures/index.tsx`.
- Verify as the skill says: captures on desktop and at 390 px, both themes, both languages, 4× close-ups, the line check at 0 and a clean console.

## Adding a beast

Use `/new-beast <concept>`. It asks the author for the sheet text (never write it for them), updates the entry, builds the figure with Anatomy, wires it to the page, and commits only after the author approves.
