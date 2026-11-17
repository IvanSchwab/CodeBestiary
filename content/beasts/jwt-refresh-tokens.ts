import type { DiscoveredBeast } from "@/lib/beasts";

export const jwtRefreshTokens: DiscoveredBeast = {
  slug: "jwt-refresh-tokens",
  number: 5,
  status: "discovered",
  name: { en: "JWT with Refresh Tokens", es: "JWT con refresh tokens" },
  habitat: "auth",
  ecosystem: { en: "OAuth 2.0 and web APIs", es: "OAuth 2.0 y APIs web" },
  danger: 4,
  // Written by Claude from the sources below and approved by the author.
  draft: false,
  sheet: {
    en: {
      tagline: "A short-lived pass that any server can check, and a long-lived key that only the issuer can redeem.",
      behavior: [
        "A JWT is a signed JSON document in three base64url parts: a header, a payload of claims (who the user is, `exp` for when the token expires) and a signature. Any server that holds the key can verify the signature and read the claims without asking a database. That makes JWTs fast to check and easy to use across services.",
        "That same independence is the problem. A valid JWT stays valid until its `exp`, and nothing on the API side can take it back early. So access tokens are kept short-lived, from a few minutes to an hour. When one expires, the API answers `401` and the client needs a new one.",
        "The refresh token is how the client gets it without asking the user to log in again. It lives longer, is sent only to the auth server's token endpoint and is checked against the server's records, so the server can revoke it. The client exchanges it for a new access token and keeps working.",
        "With refresh token rotation, each exchange also returns a new refresh token and invalidates the old one, while the server remembers which tokens belong to the same session. If an already-used refresh token shows up again, someone else holds a copy. The server cannot tell which side is the thief, so it revokes the whole session and the user logs in again.",
      ],
      dangers: [
        {
          title: "Logout does not kill the access token",
          body: "Deleting the token on the client or revoking the session on the server leaves any copy of the access token valid until `exp`. Short expiry is what limits the damage; a denylist checked on every request works, but gives up the stateless check that made JWTs attractive.",
        },
        {
          title: "The payload is readable",
          body: "A JWT is signed, not encrypted. Anyone holding it can decode the claims with a base64 decoder. Secrets and personal data that do not need to travel do not belong in the payload.",
        },
        {
          title: "Trusting the header to pick the algorithm",
          body: "Libraries that accepted `alg: none`, or let an attacker switch from RS256 to HS256 and sign with the public key, have caused real breaches. The verifier should fix the expected algorithm and key, and check `exp`, `iss` and `aud`, as RFC 8725 recommends.",
        },
        {
          title: "Where the refresh token is stored",
          body: "A refresh token in `localStorage` is readable by any script on the page, so a single XSS can steal the session. An `HttpOnly`, `Secure`, `SameSite` cookie keeps it out of reach of JavaScript, at the cost of handling CSRF on the refresh endpoint.",
        },
      ],
      sightings: null,
    },
    es: {
      tagline: "Un pase de corta duración que cualquier servidor puede verificar, y una llave de larga duración que solo el emisor puede canjear.",
      behavior: [
        "Un JWT es un documento JSON firmado en tres partes en base64url: un header, un payload con claims (quién es el usuario, `exp` para el momento en que vence) y una firma. Cualquier servidor que tenga la clave puede verificar la firma y leer los claims sin consultar una base de datos. Eso hace que los JWT sean rápidos de verificar y fáciles de usar entre servicios.",
        "Esa misma independencia es el problema. Un JWT válido sigue siéndolo hasta su `exp`, y nada del lado de la API puede invalidarlo antes. Por eso los access tokens tienen una vida corta, de unos minutos a una hora. Cuando uno vence, la API responde `401` y el cliente necesita otro.",
        "El refresh token es la forma de conseguirlo sin pedirle al usuario que vuelva a iniciar sesión. Dura más, solo se envía al endpoint de tokens del servidor de autenticación y se verifica contra los registros del servidor, así que el servidor puede revocarlo. El cliente lo canjea por un access token nuevo y sigue trabajando.",
        "Con refresh token rotation, cada canje devuelve también un refresh token nuevo e invalida el anterior, y el servidor recuerda qué tokens pertenecen a la misma sesión. Si un refresh token ya usado vuelve a aparecer, alguien más tiene una copia. El servidor no puede saber de qué lado está el robo, así que revoca la sesión entera y el usuario vuelve a iniciar sesión.",
      ],
      dangers: [
        {
          title: "Cerrar sesión no invalida el access token",
          body: "Borrar el token en el cliente o revocar la sesión en el servidor deja cualquier copia del access token válida hasta `exp`. Lo que limita el daño es la expiración corta; una lista de tokens revocados consultada en cada request funciona, pero resigna la verificación sin estado que hacía atractivos a los JWT.",
        },
        {
          title: "El payload se puede leer",
          body: "Un JWT está firmado, no cifrado. Quien lo tenga puede decodificar los claims con un decodificador de base64. Los secretos y los datos personales que no necesitan viajar no deberían ir en el payload.",
        },
        {
          title: "Dejar que el header elija el algoritmo",
          body: "Librerías que aceptaban `alg: none`, o que permitían pasar de RS256 a HS256 y firmar con la clave pública, causaron vulneraciones reales. El verificador debería fijar el algoritmo y la clave esperados, y comprobar `exp`, `iss` y `aud`, como recomienda la RFC 8725.",
        },
        {
          title: "Dónde se guarda el refresh token",
          body: "Un refresh token en `localStorage` es legible por cualquier script de la página, así que un solo XSS alcanza para robar la sesión. Una cookie `HttpOnly`, `Secure` y `SameSite` lo deja fuera del alcance de JavaScript, a cambio de tener que cuidar el CSRF en el endpoint de refresh.",
        },
      ],
      sightings: null,
    },
  },
  sources: [
    {
      title: "RFC 7519: JSON Web Token (JWT)",
      url: "https://www.rfc-editor.org/rfc/rfc7519",
    },
    {
      title: "RFC 8725: JSON Web Token Best Current Practices",
      url: "https://www.rfc-editor.org/rfc/rfc8725",
    },
    {
      title: "RFC 9700: Best Current Practice for OAuth 2.0 Security (refresh token rotation)",
      url: "https://www.rfc-editor.org/rfc/rfc9700",
    },
    {
      title: "Auth0: Refresh Token Rotation",
      url: "https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation",
    },
    {
      title: "Supabase: User sessions",
      url: "https://supabase.com/docs/guides/auth/sessions",
    },
  ],
};
