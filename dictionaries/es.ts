import type { Dictionary } from "./en";

export const es: Dictionary = {
  meta: {
    homeTitle: "Code Bestiary: una guía de campo de conceptos de programación",
    description:
      "Una guía de campo de conceptos de programación. Cada uno es una bestia con una ficha escrita y una figura interactiva que muestra cómo funciona.",
    aboutTitle: "Acerca de",
    aboutDescription: "Qué es Code Bestiary, por qué existe y cómo está hecho.",
    notFoundTitle: "Página no encontrada",
    titleTemplate: "%s | Code Bestiary",
  },
  nav: {
    home: "Code Bestiary, inicio",
    about: "Acerca de",
    main: "Principal",
    language: "Idioma",
    languageNames: { en: "Inglés", es: "Español" },
    toggleTheme: "Cambiar entre tema claro y oscuro",
    skipToContent: "Saltar al contenido",
  },
  home: {
    eyebrow: "Una guía de campo",
    title: "Code Bestiary",
    lead: "Cada concepto de programación estudiado se registra aquí como una bestia: una ficha escrita que explica cómo se comporta y una figura interactiva para verlo funcionar.",
    cta: "Conocer el event loop",
    gridTitle: "Especímenes",
    progress: "{discovered} de {total} bestias descubiertas",
  },
  card: {
    numberPrefix: "N.º",
    undiscovered: "No descubierta",
    undiscoveredHint: "Aún no descubierta",
  },
  beast: {
    draft: "Borrador",
    draftHint: "Este texto es un borrador y será reescrito por el autor.",
    stats: "Datos de campo",
    habitat: "Hábitat",
    ecosystem: "Ecosistema",
    danger: "Peligrosidad",
    dangerValue: "{value} de 5",
    behavior: "Comportamiento",
    dangers: "Peligros y confusiones",
    sightings: "Avistamientos",
    sightingsPending: "Notas de campo pendientes.",
    sources: "Fuentes",
    figure: "Figura interactiva",
    back: "Todos los especímenes",
  },
  about: {
    title: "Acerca de",
    whoTitle: "Quién soy",
    who: [
      "Soy desarrollador full-stack y me interesa entender el problema antes de escribir código. Lo que más me atrae de este trabajo es la lógica de negocio: cómo funciona un sistema por dentro, qué reglas lo gobiernan y cómo llevarlas a una interfaz que alguien use sin pensar.",
      "Me especializo en software para el sector inmobiliario, un rubro que conozco desde adentro y donde quedan muchos procesos por resolver. Construí PIA Gestión, una plataforma multi-tenant en producción, desde la arquitectura de la base de datos hasta la interfaz.",
      "Trabajo sobre todo con Vue, React, TypeScript, Supabase y PostgreSQL. Cuido los detalles que no se ven: la seguridad, la estructura del código y que lo construido se pueda mantener. Vivo en Buenos Aires. Code Bestiary es el registro de lo que sigo aprendiendo.",
    ],
    portfolio: "Portfolio",
    links: "Enlaces",
    whatTitle: "Qué es y por qué",
    what: [
      "Code Bestiary es un registro de estudio con forma de guía de campo. Cuando un concepto se estudia a fondo, se registra aquí como una bestia, con una ficha que explica cómo se comporta y dónde muerde.",
      "Cada bestia tiene además una figura interactiva: una pequeña máquina cuyo mecanismo es el concepto. Explicar una idea lo suficientemente bien como para construir un modelo que funcione es una buena prueba de haberla entendido.",
      "El bestiario crece a medida que se estudian conceptos nuevos. Cada bestia nueva se numera en el orden en que fue capturada.",
    ],
    howTitle: "Cómo está hecho",
    how: [
      "El sitio está construido con Next.js, TypeScript y Tailwind CSS, y todas las páginas se generan de forma estática en inglés y en español. No usa librerías de UI, analytics ni tracking.",
      "Las figuras son dibujos SVG isométricos construidos con la skill Anatomy y Claude Code. Cada una se mueve a partir de un pequeño modelo del concepto, y el modelo se prueba contra el comportamiento real que describe.",
    ],
    repo: "Código fuente en GitHub",
  },
  footer: {
    by: "Escrito y construido por {author}.",
    source: "Código",
  },
  notFound: {
    title: "No hay ningún espécimen en esta dirección",
    body: "La página no existe o la bestia todavía no fue descubierta.",
    back: "Volver al bestiario",
  },
};
