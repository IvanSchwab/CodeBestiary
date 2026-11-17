/**
 * Pure model of JWT access tokens with rotating refresh tokens. No DOM, no
 * geometry, no timers: time is a number the caller passes in (seconds).
 *
 * Access tokens are real HS256 JWTs (RFC 7519): the SHA-256, HMAC and
 * base64url below are plain TypeScript, so the API's check runs the same in
 * the browser as in Node. model.test.ts compares every token with one built
 * by Node's crypto, and the whole trace with an independent reference server.
 *
 * The secret is a demo value and ships to the browser with this module. A
 * real signing key never leaves the servers that hold it.
 */

/** Seconds an access token lives. */
export const ACCESS_TTL = 15 * 60;
/** Seconds a refresh token lives. */
export const REFRESH_TTL = 7 * 24 * 60 * 60;
/** The shared HS256 key of the auth server and the API. */
export const SECRET = "code-bestiary-demo-secret";
/** Unix time of the scenario's t = 0 (2026-01-01T00:00:00Z). */
export const EPOCH = 1_767_225_600;
/** Whose tokens the scenario issues. */
export const SUBJECT = "user-42";

/* SHA-256 (FIPS 180-4), HMAC (RFC 2104) and base64url (RFC 4648, no padding). */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
  0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
  0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
  0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
  0xc67178f2,
]);

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

export function sha256(message: Uint8Array): Uint8Array {
  const length = message.length;
  const blocks = Math.ceil((length + 9) / 64);
  const padded = new Uint8Array(blocks * 64);
  padded.set(message);
  padded[length] = 0x80;
  const bits = length * 8;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bits / 2 ** 32));
  view.setUint32(padded.length - 4, bits >>> 0);

  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  for (let block = 0; block < blocks; block++) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(block * 64 + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    h[0] += a;
    h[1] += b;
    h[2] += c;
    h[3] += d;
    h[4] += e;
    h[5] += f;
    h[6] += g;
    h[7] += hh;
  }
  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  h.forEach((word, i) => outView.setUint32(i * 4, word));
  return out;
}

export function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  const block = new Uint8Array(64);
  block.set(key.length > 64 ? sha256(key) : key);
  const inner = new Uint8Array(64 + message.length);
  const outer = new Uint8Array(64 + 32);
  for (let i = 0; i < 64; i++) {
    inner[i] = block[i] ^ 0x36;
    outer[i] = block[i] ^ 0x5c;
  }
  inner.set(message, 64);
  outer.set(sha256(inner), 64);
  return sha256(outer);
}

export const utf8 = (text: string) => new TextEncoder().encode(text);

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function base64url(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let c = 0; c < chars; c++) out += ALPHABET[(n >>> (18 - c * 6)) & 63];
  }
  return out;
}

/** Strict decoder: returns null for anything that is not canonical unpadded base64url. */
export function fromBase64url(text: string): Uint8Array | null {
  if (text.length % 4 === 1) return null;
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of text) {
    const value = ALPHABET.indexOf(char);
    if (value < 0) return null;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 0xff);
    }
  }
  // Leftover bits must be zero, or two strings would decode to the same bytes.
  if (buffer & ((1 << bits) - 1)) return null;
  return new Uint8Array(bytes);
}

/* JWT, HS256 only. */

export interface Claims {
  sub: string;
  /** Issued at, Unix seconds. */
  iat: number;
  /** Expiry, Unix seconds: the token is valid while now < exp. */
  exp: number;
  /** Token id, unique per access token. */
  jti: string;
}

const HEADER = base64url(utf8(JSON.stringify({ alg: "HS256", typ: "JWT" })));

const mac = (input: string, secret: string) => base64url(hmacSha256(utf8(secret), utf8(input)));

export function signJwt(claims: Claims, secret = SECRET): string {
  const payload = base64url(utf8(JSON.stringify({ sub: claims.sub, iat: claims.iat, exp: claims.exp, jti: claims.jti })));
  return `${HEADER}.${payload}.${mac(`${HEADER}.${payload}`, secret)}`;
}

export type Rejection = "missing" | "malformed" | "algorithm" | "signature" | "expired";
export type Verdict = { ok: true; claims: Claims } | { ok: false; reason: Rejection };

function parse(segment: string): unknown {
  const bytes = fromBase64url(segment);
  if (!bytes) return null;
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return null;
  }
}

/**
 * What the API does with a bearer token, using nothing but the key and its
 * own clock: no call to the auth server, no database. The signature is
 * checked before the claims are trusted.
 */
export function verifyJwt(token: string | null, secret: string, now: number): Verdict {
  if (!token) return { ok: false, reason: "missing" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [header, payload, signature] = parts;
  const head = parse(header) as { alg?: unknown } | null;
  const body = parse(payload) as Partial<Claims> | null;
  if (!head || !body) return { ok: false, reason: "malformed" };
  // The algorithm is fixed by the API, never taken from the token ("alg": "none" fails here).
  if (head.alg !== "HS256") return { ok: false, reason: "algorithm" };
  if (signature !== mac(`${header}.${payload}`, secret)) return { ok: false, reason: "signature" };
  if (typeof body.exp !== "number" || typeof body.sub !== "string") return { ok: false, reason: "malformed" };
  if (!(now < body.exp)) return { ok: false, reason: "expired" };
  return { ok: true, claims: body as Claims };
}

/** Reads the claims of a token without checking it, for display. */
export function claimsOf(token: string): Claims {
  return parse(token.split(".")[1]) as Claims;
}

/* The auth server: the only place refresh tokens are known. */

export type RefreshState = "active" | "used" | "revoked";

export interface RefreshRecord {
  /** The opaque value the client holds. */
  token: string;
  /** Issue order, from 1. */
  id: number;
  /** Every refresh token descends from one login: its family. */
  family: number;
  sub: string;
  exp: number;
  used: boolean;
  revoked: boolean;
}

export const stateOf = (record: RefreshRecord): RefreshState =>
  record.revoked ? "revoked" : record.used ? "used" : "active";

export type GrantError = "unknown" | "expired" | "reused" | "revoked";

export interface Tokens {
  access: string;
  refresh: string;
  /** Id of the new refresh token. */
  id: number;
  family: number;
}

export type Grant = ({ ok: true } & Tokens) | { ok: false; error: GrantError; family: number | null };

export interface AuthServer {
  /** Checks credentials (not modelled) and starts a new family. */
  login(sub: string, now: number): Tokens;
  /** The token endpoint: grant_type=refresh_token. Accepts any presented value. */
  refresh(token: string, now: number): Grant;
  /** Logout: revokes the family of a refresh token. Access tokens are not affected. */
  logout(token: string): boolean;
  records(): RefreshRecord[];
}

export function createAuthServer(secret = SECRET, accessTtl = ACCESS_TTL, refreshTtl = REFRESH_TTL): AuthServer {
  const records: RefreshRecord[] = [];
  let families = 0;
  let accessCount = 0;

  const issue = (sub: string, family: number, now: number): Tokens => {
    accessCount += 1;
    const access = signJwt({ sub, iat: now, exp: now + accessTtl, jti: `a${accessCount}` }, secret);
    const id = records.length + 1;
    // Opaque to the client. Here derived from the key so the model stays deterministic;
    // a real server draws 256 random bits.
    const token = `rt_${base64url(hmacSha256(utf8(secret), utf8(`refresh:${id}`))).slice(0, 32)}`;
    records.push({ token, id, family, sub, exp: now + refreshTtl, used: false, revoked: false });
    return { access, refresh: token, id, family };
  };

  const revokeFamily = (family: number) => {
    for (const record of records) if (record.family === family) record.revoked = true;
  };

  return {
    login(sub, now) {
      families += 1;
      return issue(sub, families, now);
    },
    refresh(token, now) {
      const record = records.find((candidate) => candidate.token === token);
      if (!record) return { ok: false, error: "unknown", family: null };
      if (record.revoked) return { ok: false, error: "revoked", family: record.family };
      if (record.used) {
        // A refresh token is good for one exchange. Seeing it twice means two
        // parties hold it, and the server cannot tell which one is the thief:
        // every token of the family dies, including the legitimate newest one.
        revokeFamily(record.family);
        return { ok: false, error: "reused", family: record.family };
      }
      if (!(now < record.exp)) return { ok: false, error: "expired", family: record.family };
      // Rotation: the presented token is spent and a new one replaces it.
      record.used = true;
      return { ok: true, ...issue(record.sub, record.family, now) };
    },
    logout(token) {
      const record = records.find((candidate) => candidate.token === token);
      if (!record) return false;
      revokeFamily(record.family);
      return true;
    },
    records: () => records.map((record) => ({ ...record })),
  };
}

/** The API: a protected resource that checks the bearer token locally. */
export type ApiResponse = { status: 200; sub: string } | { status: 401; reason: Rejection };

export function callApi(token: string | null, now: number, secret = SECRET): ApiResponse {
  const verdict = verifyJwt(token, secret, now);
  return verdict.ok ? { status: 200, sub: verdict.claims.sub } : { status: 401, reason: verdict.reason };
}

/* The scripted scenario the figure walks through. */

export type ActionKind = "login" | "call" | "refresh" | "replay" | "clear";

export interface Action {
  /** Seconds since login. */
  at: number;
  kind: ActionKind;
}

const min = (minutes: number, seconds = 0) => minutes * 60 + seconds;

/**
 * One login, a few API calls, an expiry, a refresh with rotation, and an
 * attacker who copied the first refresh token at login and replays it after
 * the client has already exchanged it.
 */
export const SCRIPT: Action[] = [
  { at: min(0), kind: "login" },
  { at: min(2), kind: "call" },
  { at: min(9), kind: "call" },
  { at: min(16), kind: "call" },
  { at: min(16, 1), kind: "refresh" },
  { at: min(16, 2), kind: "call" },
  { at: min(22), kind: "call" },
  { at: min(25), kind: "replay" },
  { at: min(27), kind: "call" },
  { at: min(32), kind: "call" },
  { at: min(32, 1), kind: "refresh" },
  { at: min(32, 2), kind: "clear" },
];

/** Where a token is in a step. */
export type Place = "unissued" | "client" | "server" | "bin";

export interface Step {
  kind: "start" | ActionKind;
  /** Seconds since login. */
  at: number;
  /** HTTP status of the response, null for steps without a request. */
  status: number | null;
  /** Why a request failed. */
  reason: Rejection | GrantError | null;
  /** Which token the step presented: access ids and refresh ids count from 1. */
  presented: { type: "access" | "refresh"; id: number; stolen?: boolean } | null;
  /** The client's tokens after the step. */
  access: { id: number; token: string; exp: number } | null;
  refresh: { id: number; token: string } | null;
  /** Where each access token (index = id − 1) and each refresh token is. */
  cards: Place[];
  tags: Place[];
  /** What the auth server knows: every refresh token it issued. */
  records: { id: number; family: number; state: RefreshState }[];
  /** exp (seconds since login) of the last access token the API read, or null before the first call. */
  readExp: number | null;
}

/** Runs a script against an auth server and an API, and records every observable moment. */
export function simulate(script: Action[] = SCRIPT, secret = SECRET): Step[] {
  const server = createAuthServer(secret);
  const steps: Step[] = [];
  const cards: Place[] = [];
  const tags: Place[] = [];
  let access = null as Step["access"];
  let refresh = null as Step["refresh"];
  let stolen: string | null = null;
  let readExp: number | null = null;

  const snapshot = (kind: Step["kind"], at: number, rest: Pick<Step, "status" | "reason" | "presented">) => {
    steps.push({
      kind,
      at,
      ...rest,
      access: access && { ...access },
      refresh: refresh && { ...refresh },
      cards: [...cards],
      tags: [...tags],
      records: server.records().map((record) => ({ id: record.id, family: record.family, state: stateOf(record) })),
      readExp,
    });
  };

  const take = (tokens: Tokens) => {
    if (access) cards[access.id - 1] = "bin";
    if (refresh) tags[refresh.id - 1] = "server";
    cards.push("client");
    tags.push("client");
    access = { id: cards.length, token: tokens.access, exp: claimsOf(tokens.access).exp - EPOCH };
    refresh = { id: tokens.id, token: tokens.refresh };
  };

  snapshot("start", 0, { status: null, reason: null, presented: null });
  for (const action of script) {
    const now = EPOCH + action.at;
    if (action.kind === "login") {
      const tokens = server.login(SUBJECT, now);
      take(tokens);
      // The attacker copies the refresh token on its way to the client.
      stolen = stolen ?? tokens.refresh;
      snapshot("login", action.at, { status: 200, reason: null, presented: null });
    } else if (action.kind === "call") {
      const presented = access ? { type: "access" as const, id: access.id } : null;
      if (access) readExp = claimsOf(access.token).exp - EPOCH;
      const response = callApi(access?.token ?? null, now, secret);
      snapshot("call", action.at, {
        status: response.status,
        reason: response.status === 200 ? null : response.reason,
        presented,
      });
    } else if (action.kind === "refresh") {
      if (!refresh) throw new Error("no refresh token to present");
      const presented = { type: "refresh" as const, id: refresh.id };
      const grant = server.refresh(refresh.token, now);
      if (grant.ok) take(grant);
      snapshot("refresh", action.at, {
        status: grant.ok ? 200 : 400,
        reason: grant.ok ? null : grant.error,
        presented,
      });
    } else if (action.kind === "replay") {
      if (!stolen) throw new Error("nothing to replay");
      const record = server.records().find((candidate) => candidate.token === stolen);
      const grant = server.refresh(stolen, now);
      snapshot("replay", action.at, {
        status: grant.ok ? 200 : 400,
        reason: grant.ok ? null : grant.error,
        presented: { type: "refresh", id: record?.id ?? 0, stolen: true },
      });
    } else {
      if (access) cards[access.id - 1] = "bin";
      if (refresh) tags[refresh.id - 1] = "bin";
      access = null;
      refresh = null;
      snapshot("clear", action.at, { status: null, reason: null, presented: null });
    }
  }
  return steps;
}

export const STEPS = simulate();
export const LAST_STEP = STEPS.length - 1;
/** How many access tokens and refresh tokens the scenario issues. */
export const CARD_COUNT = STEPS[LAST_STEP].cards.length;
export const TAG_COUNT = STEPS[LAST_STEP].tags.length;

/** "16:01" for 961 seconds. */
export const clockOf = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
