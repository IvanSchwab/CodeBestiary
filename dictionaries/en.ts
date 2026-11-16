export const en = {
  meta: {
    homeTitle: "Code Bestiary: a field guide to programming concepts",
    description:
      "A field guide to programming concepts. Each one is a beast with a written sheet and an interactive figure that shows how it works.",
    aboutTitle: "About",
    aboutDescription: "What Code Bestiary is, why it exists and how it is built.",
    notFoundTitle: "Page not found",
    titleTemplate: "%s | Code Bestiary",
  },
  nav: {
    home: "Code Bestiary, home",
    about: "About",
    main: "Main",
    language: "Language",
    languageNames: { en: "English", es: "Spanish" },
    toggleTheme: "Switch between light and dark theme",
    skipToContent: "Skip to content",
  },
  home: {
    eyebrow: "A field guide",
    title: "Code Bestiary",
    lead: "Every programming concept studied here is recorded as a beast: a written sheet that explains how it behaves, and an interactive figure to see it work.",
    cta: "Meet the event loop",
    gridTitle: "Specimens",
    progress: "{discovered} of {total} beasts discovered",
  },
  card: {
    numberPrefix: "No.",
    undiscovered: "Undiscovered",
    undiscoveredHint: "Not discovered yet",
  },
  beast: {
    draft: "Draft",
    draftHint: "This text is a draft and will be rewritten by the author.",
    stats: "Field data",
    habitat: "Habitat",
    ecosystem: "Ecosystem",
    danger: "Danger",
    dangerValue: "{value} of 5",
    behavior: "Behavior",
    dangers: "Dangers and confusions",
    sightings: "Sightings",
    sightingsPending: "Field notes pending.",
    sources: "Sources",
    figure: "Interactive figure",
    back: "All specimens",
  },
  about: {
    title: "About",
    whoTitle: "Who I am",
    whoPending: "Bio pending.",
    links: "Links",
    whatTitle: "What this is and why",
    what: [
      "Code Bestiary is a study log in the shape of a field guide. When a concept is studied in depth, it is recorded here as a beast, with a sheet that explains how it behaves and where it bites.",
      "Each beast also gets an interactive figure: a small machine whose mechanism is the concept. Explaining an idea well enough to build a working model of it is a good test of having understood it.",
      "Beasts that have not been studied yet stay on the grid as undiscovered specimens. They are the roadmap.",
    ],
    howTitle: "How it is built",
    how: [
      "The site is built with Next.js, TypeScript and Tailwind CSS, and every page is statically generated in English and Spanish. It uses no UI library, no analytics and no tracking.",
      "The figures are isometric SVG drawings built with the Anatomy skill and Claude Code. Each one is driven by a small model of the concept, and the model is tested against the real behavior it describes.",
    ],
    repo: "Source code on GitHub",
  },
  footer: {
    by: "Written and built by {author}.",
    source: "Source",
  },
  notFound: {
    title: "No specimen at this address",
    body: "The page does not exist, or the beast has not been discovered yet.",
    back: "Back to the bestiary",
  },
};

export type Dictionary = typeof en;
