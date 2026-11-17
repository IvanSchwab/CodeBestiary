# Code Bestiary — SPEC

Documento de decisiones acordadas en la fase 1. La fase 2 se construye siguiendo este archivo. Lo que no esté cubierto acá se decide con criterio y se anota en `DECISIONS.md`.

## 1. Producto

- **Qué es:** un sitio donde cada concepto de programación estudiado es una "bestia" con una ficha y una figura interactiva hecha con la skill Anatomy. Pieza de portfolio y CV.
- **Audiencia:** foco completo en reclutadores y tech leads. Las explicaciones tienen que servirle también a otros devs y a gente que recién empieza: claras, sin dar nada por sabido, sin perder rigor.
- **Objetivo del primer minuto:** que el visitante llegue a una figura y juegue con ella.
- **Páginas:**
  - Home: `/[lang]`
  - Bestia: `/[lang]/beasts/[slug]` (solo para bestias descubiertas)
  - About: `/[lang]/about`
  - 404 con el mismo diseño, en el idioma de la URL.
- **Header:** nombre del sitio (link a la home), link a About, selector `EN / ES`, toggle de tema. **Footer:** una línea con autoría y link al repo.
- **Sin** búsqueda ni filtros. Cada bestia tiene una categoría ("hábitat") visible en la tarjeta y en la ficha; el modelo de datos queda listo para filtrar más adelante.
- **Progreso:** una línea arriba de la grilla ("1 de 6 bestias descubiertas" / "1 of 6 beasts discovered") y número de espécimen en cada tarjeta (`N.º 001`, `No. 001`).

## 2. Contenido

### Home
- Hero corto: título, una línea que explica el bestiario y un botón que lleva a la bestia del event loop.
- Debajo: contador de progreso y grilla de bestias, ordenada por número.

### Tarjetas
- **Descubierta:** número, glifo SVG, nombre, hábitat y descripción de una línea. Toda la tarjeta es un link.
- **Bloqueada:** número, glifo como silueta apagada, nombre visible, hábitat y etiqueta "No descubierta" / "Undiscovered". No es clickeable, no tiene página y no es un link (se anuncia como no disponible a lectores de pantalla).
- Cada bestia tiene un glifo SVG abstracto de línea, propio, que evoca el concepto. Diseñados a mano en SVG, sin imágenes externas.

### Ficha de una bestia
En este orden:
1. Encabezado: número, nombre, hábitat y descripción de una línea.
2. Stats: **hábitat**, **ecosistema** y **peligrosidad** (escala de 1 a 5, representada con marcas, con texto accesible "3 de 5").
3. **Comportamiento:** la explicación central, 2 a 4 párrafos.
4. **Peligros y confusiones:** errores típicos y malentendidos.
5. **Avistamientos:** dónde apareció el concepto en la práctica del autor.
6. **Fuentes:** lista de links para seguir leyendo (solo fuentes reales y verificables: MDN, especificación HTML, etc.).

No hay fecha de descubrimiento.

### Bestiario inicial

| N.º | Slug | Nombre (EN / ES) | Hábitat | Ecosistema | Estado |
|---|---|---|---|---|---|
| 001 | `event-loop` | Event Loop / Event loop | Runtime | JavaScript | Descubierta |
| 002 | `vue-reactivity` | Vue Reactivity / Reactividad de Vue | Frontend | Vue | Bloqueada |
| 003 | `token-bucket` | Token Bucket / Token bucket | Networking / Redes | HTTP APIs | Bloqueada |
| 004 | `connection-pool` | Connection Pool / Connection pool | Data / Datos | Databases | Bloqueada |
| 005 | `jwt-refresh-tokens` | JWT with Refresh Tokens / JWT con refresh tokens | Auth | Web | Bloqueada |
| 006 | `embeddings-vector-search` | Embeddings & Vector Search / Embeddings y búsqueda vectorial | AI / IA | Vector databases | Bloqueada |

Peligrosidad del event loop: **3 de 5** (aprobada por el autor). Las bloqueadas no muestran ecosistema ni peligrosidad.

### Autoría de los textos
- **Fichas:** las investiga y redacta Claude en inglés y español como **borrador**, con un badge discreto "Draft" / "Borrador" junto al título de la ficha, hasta que el autor las aprueba (o las reescribe). La del event loop fue la primera y ya está aprobada.
- **Avistamientos:** son experiencia del autor. Claude los redacta solo si el autor lo pide, a partir de sus proyectos reales, y como anécdotas ilustrativas. Si no hay, se publica un placeholder visible y marcado, en cursiva atenuada: "Field notes pending." / "Notas de campo pendientes."
- **Home y About:** el título, el tagline y las secciones "Qué es el proyecto" y "Cómo está hecho" los redactó Claude y el autor los aprobó, así que el About ya no lleva el badge de borrador. La home no lleva badge (es microcopy de interfaz); el reporte final lista todos los textos a reescribir.
- **Bio ("Quién soy"):** placeholder visible y marcado ("Bio pending." / "Bio pendiente."). No se inventa.
- En los datos, cada texto borrador lleva una marca (`draft: true`) para que quitar el badge sea cambiar un valor.

### About
1. Quién soy (placeholder) + links: GitHub y los que el autor confirme en el setup.
2. Qué es el proyecto y por qué: se estudia un concepto, se documenta como bestia y se construye su figura.
3. Cómo está hecho: stack, figuras construidas con la skill Anatomy y Claude Code, link al repo.

Sin link al CV.

## 3. Diseño

- **Dirección:** guía de campo naturalista / lámina científica. Papel cálido, tinta oscura, filetes finos, números de espécimen, etiquetas tipo ficha de museo.
- **Ornamento:** sobrio con detalles. Filetes, numeración, versalitas, alguna viñeta tipográfica. Sin texturas pesadas ni ilustraciones.
- **Prohibido:** emojis en la interfaz; estética gamer, neón, pixel art o referencias a juegos de colección de criaturas. Tampoco gradientes llamativos ni glassmorphism (por coherencia con la dirección).
- **Tipografías** (con `next/font`, autoalojadas, sin pedidos a terceros en runtime):
  - Títulos: **Fraunces**
  - Texto: **Source Serif 4**
  - Código, números de espécimen y etiquetas: **JetBrains Mono**
- **Tema:** claro y oscuro con toggle en el header. En la primera visita sigue `prefers-color-scheme`; si la persona usa el toggle, se recuerda en `localStorage`. Sin parpadeo al cargar (script inline mínimo antes del primer render). El claro es la identidad principal y el que se usa en Open Graph.
- **Paleta** (un solo acento; valores de partida, se ajustan en la fase 2 si no cumplen contraste WCAG AA):

  | Token | Claro | Oscuro |
  |---|---|---|
  | Fondo (papel) | `#F4EFE4` | `#171411` |
  | Superficie | `#FBF8F1` | `#201C18` |
  | Tinta | `#1F1B16` | `#EDE6D8` |
  | Tinta atenuada | `#6B6257` | `#A39A8B` |
  | Filetes | `#D9D0BF` | `#3A332C` |
  | Acento (rojo óxido) | `#A6402A` | `#D9765A` |

- **Animación fuera de la figura:** mínima. Hover en tarjetas y transiciones suaves. Se respeta `prefers-reduced-motion`.
- **Página de bestia, desktop (≥ 1024 px):** dos columnas. Ficha a la izquierda (~42 %) y figura **sticky** a la derecha (~58 %) mientras se scrollea. El bloque sticky (tarjeta de la figura + controles + snippet y consola) tiene que entrar en el alto del viewport; si no entra, se compacta el snippet/consola antes que achicar la figura.
- **Página de bestia, mobile y tablet (< 1024 px):** una columna: encabezado, figura, ficha.
- **Mobile:** todo el sitio se diseña y verifica a 390 px de ancho.
- **Accesibilidad:** HTML semántico, foco visible, navegación completa con teclado, contraste AA, `lang` correcto en `<html>`.

## 4. Idiomas

- Bilingüe desde el inicio: inglés (`en`) y español (`es`).
- **URLs:** los dos idiomas con prefijo: `/en/...` y `/es/...`. Los slugs no se traducen.
- **Idioma por defecto:** inglés. Es el fallback y el `x-default` de hreflang.
- **Detección:** solo en la raíz `/`. Orden: cookie de preferencia, después `Accept-Language` (español si lo prefiere el navegador, si no inglés). Los links directos a `/en/...` o `/es/...` nunca redirigen.
- **Cookie:** `NEXT_LOCALE`, funcional, se escribe solo cuando la persona usa el selector. No hay otras cookies.
- **Selector:** `EN / ES` en el header, con el activo resaltado. Lleva a la misma página en el otro idioma. Sin banderas.
- **Español del sitio:** neutro, sin voseo, redacción impersonal en las fichas. Los términos técnicos (call stack, microtask, macrotask) quedan en inglés.
- **Implementación:** segmento `[lang]` con diccionarios tipados por idioma; el contenido de las bestias también es por idioma. Se sigue la guía de i18n de la versión de Next.js instalada (nombres de archivos y APIs según su documentación, no de memoria).
- **Metadata por idioma:** `title`, `description`, Open Graph (con `og:locale`), `canonical` y `hreflang` (`en`, `es`, `x-default`) en todas las páginas. `sitemap.xml` y `robots.txt` generados.

## 5. Figura del event loop

- **Skill:** Anatomy, siguiendo su `SKILL.md`. **Tamaño: Figure** (un mecanismo, 40 a 80 piezas, SVG, como mucho una capa WebGL; acá no se prevé ninguna). Se construye sin pedir aprobación. Si la estimación supera Figure, se recorta el alcance conservando la idea central y se anota en `DECISIONS.md`.
- **Qué explica:** cómo el event loop ejecuta el call stack, la cola de microtasks y la de macrotasks, y por qué una promesa resuelta corre antes que un `setTimeout` de 0.
- **Objeto:** un **despachador con brazo giratorio** sobre un banco de trabajo.
  - Torre donde se apilan fichas: el call stack.
  - Brazo giratorio: el loop.
  - Canaleta corta prioritaria: la cola de microtasks. El brazo la vacía entera antes de seguir.
  - Cinta larga: la cola de macrotasks. El brazo toma una sola ficha por vuelta.
  - Contador mecánico: el orden de salida.
  - El detalle del diseño de piezas lo define la fase 2 según la skill.
- **Snippet fijo:**
  ```js
  console.log("start");
  setTimeout(() => console.log("timeout"), 0);
  Promise.resolve().then(() => console.log("promise"));
  console.log("end");
  ```
  Salida: `start`, `end`, `promise`, `timeout`.
- **Interacción:** Siguiente, Anterior, Reproducir/Pausar y Reiniciar, con botones reales y teclado. Recorrido automático en reposo mientras nadie la toca (como indica la skill); quieta con `prefers-reduced-motion`; se detiene fuera de pantalla.
- **Alrededor de la tarjeta:** la tarjeta de Anatomy lleva `Fig 1`, título, hint y readout en vivo. Debajo, en HTML: los controles, el snippet con la línea activa resaltada y la salida de consola acumulada, sincronizados con el paso. Las palabras quedan fuera del dibujo.
- **Bilingüe:** título, hint, readout, leyenda, caption, etiquetas de controles y textos para lectores de pantalla en los dos idiomas, mediante una prop `lang`. El código del snippet no se traduce.
- **Tema:** la figura usa los temas claro y oscuro propios de Anatomy y sigue el toggle del sitio. Es **monocroma** (tonos de papel y un único acento), como exige la skill: el rojo óxido es del sitio, no de la figura. Los tokens de la tarjeta se alinean con el papel del sitio en la medida en que el kit lo permita.
- **Ubicación:** `components/figures/event-loop/`, con el kit de Anatomy copiado en `components/iso/`. Estructura de archivos según `references/react.md` de la skill (modelo puro, geometría, arte en server component, un único componente cliente).
- **Verdad del modelo:** la secuencia de pasos vive en un módulo puro sin DOM. Un test ejecuta el snippet real en Node, captura la salida y la compara con la que produce el modelo.

## 6. Técnico

- **Stack:** Next.js (última versión estable, App Router) + TypeScript + Tailwind CSS + ESLint. Generación estática de todas las páginas.
- **Runtime local:** Node 24, npm.
- **Dependencias:** se pueden sumar las que hagan falta siempre que sean gratuitas (open source) y escalables. Cada una se anota en `DECISIONS.md` con su motivo. Siguen prohibidas las librerías de componentes de UI, analytics y tracking.
- **Tests:** Vitest (devDependency), solo para la lógica de la figura. Script `npm test`.
- **URL del sitio:** `NEXT_PUBLIC_SITE_URL` define la base absoluta para `metadataBase`, hreflang, Open Graph y sitemap. Si no está definida, se usa la URL de producción que expone Vercel cuando exista y, si no, `http://localhost:3000`. Documentado en el README.
- **Imagen Open Graph:** generada con `next/og` (incluido en Next.js), en tema claro, con el título por idioma.
- **Modelo de datos:** bestias en archivos TypeScript tipados dentro del repo (sin CMS ni base de datos): campos comunes (slug, número, estado, hábitat, ecosistema, peligrosidad, fuentes) y contenido por idioma.
- **Repo:** `IvanSchwab/CodeBestiary` en GitHub (ya existe, vacío), como `origin`. Nombre del paquete: `code-bestiary`.
- **Idioma del repo:** código, commits, `README.md`, `CLAUDE.md` y `DECISIONS.md` en inglés. Este `SPEC.md` queda en español.

## 7. Deploy

- **Sin deploy por ahora.** No se usa la CLI de Vercel ni se importa el proyecto. El sitio queda listo para deployar en Vercel sin configuración extra (solo definir `NEXT_PUBLIC_SITE_URL`). El reporte final deja los pasos.

## 8. Verificación antes de terminar

- `npm run lint`, `npm test` y `npm run build` sin errores.
- Revisión visual con capturas, como indica Anatomy (capturas completas y recortes de cerca, leyendo cada PNG), en la matriz completa: **2 idiomas × 2 temas × desktop y mobile (390 px)**, para home, bestia y About.
- Figura: recortes a 4× sobre el sujeto y el mecanismo en los dos temas, varios momentos del recorrido, el chequeo de líneas de la skill en cero y consola del navegador sin errores ni warnings.
- Orden de ejecución de la figura verificado contra Node.
- Comparación final contra este SPEC.

## 9. Flujo para las próximas bestias

- `CLAUDE.md`, `README.md` y el comando `/new-beast` según el brief.
- `/new-beast <concepto>` usa siempre tamaño **Figure** y las convenciones de este SPEC, investiga y redacta la ficha como borrador (`draft: true`) salvo que el autor traiga su texto, la quita de borrador solo con su aprobación explícita, y commitea y pushea solo después de la aprobación.
