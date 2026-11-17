import type { DiscoveredBeast } from "@/lib/beasts";

export const vueReactivity: DiscoveredBeast = {
  slug: "vue-reactivity",
  number: 2,
  status: "discovered",
  name: { en: "Vue Reactivity", es: "Reactividad de Vue" },
  habitat: "frontend",
  ecosystem: { en: "Vue 3", es: "Vue 3" },
  danger: 3,
  // Written by Claude from the sources below and approved by the author.
  draft: false,
  sheet: {
    en: {
      tagline: "The system that remembers who read each value, so it knows who to tell when the value changes.",
      behavior: [
        "Vue's state lives in reactive sources: a `ref` wraps a single value behind `.value`, and `reactive()` wraps an object in a Proxy. Reading a source is not a plain read. If code is running inside an effect, such as a component's render, a `computed` or a `watchEffect`, the read is recorded: the source now knows that effect depends on it. This is called tracking.",
        "Writing a source does the reverse. The source walks its list of subscribers and notifies each one. This is called triggering. A component re-renders only when a source it actually read during its last render changes, which is why Vue rarely needs hints about what to update.",
        "A `computed` is both a subscriber and a source. It is lazy: it runs its getter only when someone reads it, and caches the result. When one of its dependencies changes, it does not recompute right away; it is marked stale and recomputes on the next read. If nobody reads it, the getter never runs again.",
        "Dependencies are collected again on every run. An effect that reads `a` only inside an `if` stops depending on `a` when the branch is not taken, and writes to `a` no longer reach it. The graph of who depends on what is not declared anywhere; it is whatever the last run happened to read.",
      ],
      dangers: [
        {
          title: "Destructuring cuts the wire",
          body: "Tracking happens on property access. `const { count } = state` copies the current value of a `reactive()` object into a plain variable, and that variable never updates. `toRefs()` keeps the connection, and a `ref` must be passed as the ref itself, not as its `.value`.",
        },
        {
          title: "Replacing a reactive object loses it",
          body: "`reactive()` tracks one object through its Proxy. Assigning a new object to the variable leaves the old Proxy behind, and whoever held it keeps the stale copy. A `ref` can be reassigned through `.value`, which is one reason the docs recommend `ref` as the default.",
        },
        {
          title: "Side effects in a computed",
          body: "A `computed` getter should only derive a value. Because it is lazy and cached, it runs when Vue decides, not when the code reads as if it would. Fetching, mutating other state or touching the DOM there leads to effects that run at odd times or not at all; that work belongs in a watcher.",
        },
        {
          title: "Reading too much makes an effect too sensitive",
          body: "Everything an effect reads becomes a dependency, including values read only for logging. Reading a whole deep object, or iterating a large array, subscribes the effect to every part of it, so unrelated changes cause re-runs.",
        },
      ],
      sightings: null,
    },
    es: {
      tagline: "El sistema que recuerda quién leyó cada valor, para saber a quién avisar cuando cambia.",
      behavior: [
        "El estado de Vue vive en fuentes reactivas: un `ref` envuelve un único valor detrás de `.value`, y `reactive()` envuelve un objeto en un Proxy. Leer una fuente no es una lectura común. Si el código se ejecuta dentro de un effect, como el render de un componente, un `computed` o un `watchEffect`, la lectura queda registrada: la fuente pasa a saber que ese effect depende de ella. Esto se llama tracking.",
        "Escribir una fuente hace lo inverso. La fuente recorre su lista de subscribers y avisa a cada uno. Esto se llama trigger. Un componente se vuelve a renderizar solo cuando cambia una fuente que realmente leyó en su último render, y por eso Vue casi nunca necesita indicaciones sobre qué actualizar.",
        "Un `computed` es a la vez subscriber y fuente. Es lazy: ejecuta su getter solo cuando alguien lo lee, y guarda el resultado en caché. Cuando cambia una de sus dependencias, no recalcula en el momento; queda marcado como desactualizado y recalcula en la próxima lectura. Si nadie lo lee, el getter no vuelve a ejecutarse.",
        "Las dependencias se recolectan de nuevo en cada ejecución. Un effect que lee `a` solo dentro de un `if` deja de depender de `a` cuando no entra en esa rama, y las escrituras en `a` ya no le llegan. El grafo de quién depende de qué no se declara en ningún lado: es lo que haya leído la última ejecución.",
      ],
      dangers: [
        {
          title: "Desestructurar corta el cable",
          body: "El tracking ocurre al acceder a una propiedad. `const { count } = state` copia el valor actual de un objeto `reactive()` en una variable común, y esa variable no se actualiza nunca. `toRefs()` mantiene la conexión, y un `ref` se pasa como el ref mismo, no como su `.value`.",
        },
        {
          title: "Reemplazar un objeto reactivo lo pierde",
          body: "`reactive()` sigue un objeto a través de su Proxy. Asignar un objeto nuevo a la variable deja atrás el Proxy anterior, y quien lo tenía conserva la copia vieja. Un `ref` se puede reasignar por `.value`, y esa es una de las razones por las que la documentación recomienda `ref` como opción por defecto.",
        },
        {
          title: "Efectos secundarios dentro de un computed",
          body: "El getter de un `computed` solo debería derivar un valor. Como es lazy y tiene caché, se ejecuta cuando Vue lo decide, no cuando el código parece indicarlo. Hacer fetch, modificar otro estado o tocar el DOM ahí produce efectos que ocurren en momentos raros o no ocurren; ese trabajo corresponde a un watcher.",
        },
        {
          title: "Leer de más vuelve sensible a un effect",
          body: "Todo lo que un effect lee pasa a ser una dependencia, incluso los valores leídos solo para un log. Leer un objeto profundo entero, o recorrer un array grande, suscribe el effect a cada parte, y cambios que no tienen relación provocan nuevas ejecuciones.",
        },
      ],
      sightings: null,
    },
  },
  sources: [
    {
      title: "Vue: Reactivity in Depth",
      url: "https://vuejs.org/guide/extras/reactivity-in-depth.html",
    },
    {
      title: "Vue: Reactivity Fundamentals",
      url: "https://vuejs.org/guide/essentials/reactivity-fundamentals.html",
    },
    {
      title: "Vue: Computed Properties",
      url: "https://vuejs.org/guide/essentials/computed.html",
    },
    {
      title: "Vue: Reactivity API, Core",
      url: "https://vuejs.org/api/reactivity-core.html",
    },
    {
      title: "vuejs/core: the @vue/reactivity package",
      url: "https://github.com/vuejs/core/tree/main/packages/reactivity",
    },
  ],
};
