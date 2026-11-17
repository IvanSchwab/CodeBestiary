import type { DiscoveredBeast } from "@/lib/beasts";

export const tokenBucket: DiscoveredBeast = {
  slug: "token-bucket",
  number: 3,
  status: "discovered",
  name: { en: "Token Bucket", es: "Token bucket" },
  habitat: "networking",
  ecosystem: { en: "APIs and networks", es: "APIs y redes" },
  danger: 2,
  // Written by Claude from the sources below and approved by the author.
  draft: false,
  sheet: {
    en: {
      tagline: "A rate limiter that allows short bursts but holds the long-run pace to a fixed rate.",
      behavior: [
        "A token bucket guards a resource with two numbers: a capacity and a refill rate. The bucket holds up to `capacity` tokens, and tokens are added at a fixed rate, for example one per second. A token that arrives when the bucket is full is discarded; the bucket never holds more than its capacity.",
        "Each request must take a token to pass. If there is one, the request goes through and the bucket has one fewer. If the bucket is empty, the request is rejected, usually with an HTTP `429 Too Many Requests`, or held until a token arrives, depending on the implementation.",
        "The two numbers control different things. The capacity is the largest burst: a client that was quiet long enough to fill the bucket can send that many requests at once. The refill rate is the sustained limit: once the bucket is empty, requests pass at exactly the refill rate, no faster.",
        "Implementations rarely add tokens on a timer. They store the token count and the time of the last update, and on each request compute how many tokens would have arrived since then, capped at the capacity. That makes the bucket a few bytes of state per client, which is why it is common in API gateways and in services like Stripe and Amazon API Gateway.",
      ],
      dangers: [
        {
          title: "Capacity is not the rate",
          body: "A bucket of 100 tokens refilled at 10 per second allows 100 requests in the first instant and then 10 per second. Treating the capacity as the per-second limit lets bursts through that the downstream service may not handle.",
        },
        {
          title: "Token bucket and leaky bucket are not the same",
          body: "A token bucket lets bursts pass as long as tokens remain. A leaky bucket used as a queue smooths output to a constant rate and delays bursts instead. The names are similar and are often swapped, but they shape traffic differently.",
        },
        {
          title: "One bucket per process is not a global limit",
          body: "With several servers behind a load balancer, each keeping its own bucket, the real limit is the per-server limit times the number of servers. A shared limit needs shared state, such as a counter in Redis, with the latency and failure modes that brings.",
        },
        {
          title: "Rejections need a way back",
          body: "A client that gets a `429` and retries immediately only empties the bucket again. A `Retry-After` header and retries with backoff and jitter let clients wait for tokens instead of competing for them.",
        },
      ],
      sightings: ["The contact form on the Pia landing page needed a limit against spam bots. With `@upstash/ratelimit` on the table, token bucket and sliding window were compared side by side. A bucket allows short bursts, which makes sense for an API, but for a form that sends emails a strict ceiling was better: `slidingWindow(5, '1 h')` per IP."],
    },
    es: {
      tagline: "Un rate limiter que permite ráfagas cortas pero sostiene a largo plazo un ritmo fijo.",
      behavior: [
        "Un token bucket protege un recurso con dos números: una capacidad y una tasa de recarga. El bucket guarda hasta `capacity` tokens, y los tokens se agregan a una tasa fija, por ejemplo uno por segundo. Un token que llega con el bucket lleno se descarta; el bucket nunca supera su capacidad.",
        "Cada request debe tomar un token para pasar. Si hay uno, la request pasa y el bucket queda con uno menos. Si el bucket está vacío, la request se rechaza, en general con un HTTP `429 Too Many Requests`, o queda en espera hasta que llegue un token, según la implementación.",
        "Los dos números controlan cosas distintas. La capacidad es la ráfaga máxima: un cliente que estuvo inactivo el tiempo suficiente para llenar el bucket puede enviar esa cantidad de requests de una vez. La tasa de recarga es el límite sostenido: con el bucket vacío, las requests pasan exactamente a la tasa de recarga, no más rápido.",
        "Las implementaciones casi nunca agregan tokens con un temporizador. Guardan la cantidad de tokens y el momento de la última actualización, y en cada request calculan cuántos tokens habrían llegado desde entonces, con la capacidad como tope. Así el bucket ocupa unos pocos bytes por cliente, y por eso es habitual en API gateways y en servicios como Stripe y Amazon API Gateway.",
      ],
      dangers: [
        {
          title: "La capacidad no es la tasa",
          body: "Un bucket de 100 tokens que se recarga a 10 por segundo permite 100 requests en el primer instante y después 10 por segundo. Tomar la capacidad como límite por segundo deja pasar ráfagas que el servicio de atrás quizás no soporte.",
        },
        {
          title: "Token bucket y leaky bucket no son lo mismo",
          body: "Un token bucket deja pasar ráfagas mientras queden tokens. Un leaky bucket usado como cola suaviza la salida a una tasa constante y, en cambio, demora las ráfagas. Los nombres se parecen y suelen confundirse, pero moldean el tráfico de forma distinta.",
        },
        {
          title: "Un bucket por proceso no es un límite global",
          body: "Con varios servidores detrás de un balanceador, cada uno con su propio bucket, el límite real es el límite por servidor multiplicado por la cantidad de servidores. Un límite compartido necesita estado compartido, como un contador en Redis, con la latencia y los modos de falla que eso implica.",
        },
        {
          title: "Los rechazos necesitan un camino de vuelta",
          body: "Un cliente que recibe un `429` y reintenta en el acto solo vuelve a vaciar el bucket. Un header `Retry-After` y los reintentos con backoff y jitter permiten que los clientes esperen tokens en lugar de competir por ellos.",
        },
      ],
      sightings: ["El formulario de contacto de la landing de Pia necesitaba un límite contra bots de spam. Con `@upstash/ratelimit` sobre la mesa, se compararon token bucket y sliding window. Un bucket permite ráfagas cortas, que tienen sentido en una API, pero para un formulario que manda mails convenía un techo estricto: `slidingWindow(5, '1 h')` por IP."],
    },
  },
  sources: [
    {
      title: "Wikipedia: Token bucket",
      url: "https://en.wikipedia.org/wiki/Token_bucket",
    },
    {
      title: "Stripe: Scaling your API with rate limiters",
      url: "https://stripe.com/blog/rate-limiters",
    },
    {
      title: "AWS: Throttle requests to your REST APIs in API Gateway",
      url: "https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html",
    },
    {
      title: "MDN: 429 Too Many Requests",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429",
    },
    {
      title: "RFC 2697: A Single Rate Three Color Marker",
      url: "https://www.rfc-editor.org/rfc/rfc2697",
    },
  ],
};
