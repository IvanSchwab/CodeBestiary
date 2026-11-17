import type { DiscoveredBeast } from "@/lib/beasts";

export const connectionPool: DiscoveredBeast = {
  slug: "connection-pool",
  number: 4,
  status: "discovered",
  name: { en: "Connection Pool", es: "Connection pool" },
  habitat: "data",
  ecosystem: { en: "PostgreSQL", es: "PostgreSQL" },
  danger: 3,
  // Written by Claude from the sources below and approved by the author.
  draft: false,
  sheet: {
    en: {
      tagline: "A fixed set of open database connections, lent out and taken back instead of opened for every query.",
      behavior: [
        "Opening a database connection is expensive. For PostgreSQL it means a network handshake, authentication and a new server process for each connection. Doing that for every query would spend more time connecting than querying, so applications keep a pool: a small set of connections that stay open and are reused.",
        "A client asks the pool for a connection, uses it and gives it back. If an idle connection is available, the pool lends it at once. If not, and the pool is below its maximum, it opens a new one. Pools create connections lazily, so a quiet application holds only the ones it has needed.",
        "When every connection is busy and the pool is at its maximum, new requests wait in line, usually first in, first out. Each returned connection goes to the next one waiting. A waiter that is not served within the acquire timeout fails with an error instead of waiting forever.",
        "The maximum is a deliberate limit, not a target. The database has its own ceiling (PostgreSQL's `max_connections` is typically 100) shared by every instance of the application, and past a point more connections only add contention. The HikariCP guide suggests starting near twice the database's CPU cores and measuring from there.",
      ],
      dangers: [
        {
          title: "A connection that is never returned",
          body: "If code takes a connection and an error path skips the release, that connection is lost to the pool. A few leaks are enough to leave every request waiting. Releasing in a `finally` block, or using `pool.query()` for single queries, prevents it.",
        },
        {
          title: "No timeout means waiting forever",
          body: "In node-postgres, `connectionTimeoutMillis` defaults to 0, which means no timeout. When the pool runs dry, requests hang instead of failing, and the problem looks like a slow server rather than an exhausted pool.",
        },
        {
          title: "Bigger is not faster",
          body: "Raising the maximum past what the database can run in parallel adds context switching and lock contention, and can make every query slower. When queries queue, the fix is usually a faster query or a shorter transaction, not more connections.",
        },
        {
          title: "Serverless multiplies pools",
          body: "Every instance of a serverless function creates its own pool. A traffic spike that starts hundreds of instances can exhaust `max_connections`. An external pooler such as PgBouncer or Supavisor shares a few real connections among all of them.",
        },
      ],
      sightings: null,
    },
    es: {
      tagline: "Un conjunto fijo de conexiones abiertas a la base de datos, que se prestan y se devuelven en lugar de abrirse en cada consulta.",
      behavior: [
        "Abrir una conexión a la base de datos es caro. En PostgreSQL implica un handshake de red, autenticación y un proceso nuevo en el servidor por cada conexión. Hacer eso en cada consulta llevaría más tiempo en conectar que en consultar, así que las aplicaciones mantienen un pool: un conjunto chico de conexiones que quedan abiertas y se reutilizan.",
        "Un cliente le pide una conexión al pool, la usa y la devuelve. Si hay una conexión idle, el pool la presta en el acto. Si no hay y el pool está por debajo de su máximo, abre una nueva. Los pools crean conexiones de forma lazy, así que una aplicación con poca actividad mantiene solo las que necesitó.",
        "Cuando todas las conexiones están en uso y el pool llegó a su máximo, las nuevas solicitudes esperan en fila, por lo general en orden de llegada. Cada conexión devuelta pasa a la siguiente en espera. Una solicitud que no se atiende dentro del timeout de adquisición falla con un error en lugar de esperar para siempre.",
        "El máximo es un límite deliberado, no una meta. La base de datos tiene su propio techo (el `max_connections` de PostgreSQL suele ser 100), compartido por todas las instancias de la aplicación, y a partir de cierto punto más conexiones solo suman contención. La guía de HikariCP sugiere empezar cerca del doble de los núcleos de CPU de la base de datos y medir desde ahí.",
      ],
      dangers: [
        {
          title: "Una conexión que nunca se devuelve",
          body: "Si el código toma una conexión y un camino de error se saltea la devolución, esa conexión se pierde para el pool. Unas pocas fugas alcanzan para dejar todas las solicitudes en espera. Devolverla en un bloque `finally`, o usar `pool.query()` para consultas sueltas, lo evita.",
        },
        {
          title: "Sin timeout se espera para siempre",
          body: "En node-postgres, `connectionTimeoutMillis` vale 0 por defecto, lo que significa sin timeout. Cuando el pool se agota, las solicitudes quedan colgadas en lugar de fallar, y el problema parece un servidor lento y no un pool agotado.",
        },
        {
          title: "Más grande no es más rápido",
          body: "Subir el máximo por encima de lo que la base de datos puede ejecutar en paralelo suma cambios de contexto y contención de locks, y puede volver más lenta cada consulta. Cuando las consultas hacen fila, la solución suele ser una consulta más rápida o una transacción más corta, no más conexiones.",
        },
        {
          title: "Serverless multiplica los pools",
          body: "Cada instancia de una función serverless crea su propio pool. Un pico de tráfico que levanta cientos de instancias puede agotar `max_connections`. Un pooler externo como PgBouncer o Supavisor reparte unas pocas conexiones reales entre todas.",
        },
      ],
      sightings: null,
    },
  },
  sources: [
    {
      title: "node-postgres: Pooling",
      url: "https://node-postgres.com/features/pooling",
    },
    {
      title: "node-postgres: pg.Pool",
      url: "https://node-postgres.com/apis/pool",
    },
    {
      title: "HikariCP: About Pool Sizing",
      url: "https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing",
    },
    {
      title: "PostgreSQL: Connections and Authentication (max_connections)",
      url: "https://www.postgresql.org/docs/current/runtime-config-connection.html",
    },
    {
      title: "PgBouncer: Features",
      url: "https://www.pgbouncer.org/features.html",
    },
    {
      title: "Supabase: Connect to your database",
      url: "https://supabase.com/docs/guides/database/connecting-to-postgres",
    },
  ],
};
