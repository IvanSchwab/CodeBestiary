import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ACCESS_TTL,
  EPOCH,
  REFRESH_TTL,
  SCRIPT,
  SECRET,
  STEPS,
  SUBJECT,
  base64url,
  callApi,
  createAuthServer,
  hmacSha256,
  sha256,
  signJwt,
  simulate,
  type Action,
} from "./model";

/* An independent reference, built on Node's crypto. It imports nothing executable from model.ts. */

const b64u = (data: Buffer | string) => Buffer.from(data).toString("base64url");
const hs256 = (input: string, secret: string) => createHmac("sha256", secret).update(input).digest("base64url");

function refSign(claims: { sub: string; iat: number; exp: number; jti: string }, secret: string) {
  const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64u(JSON.stringify({ sub: claims.sub, iat: claims.iat, exp: claims.exp, jti: claims.jti }));
  return `${header}.${payload}.${hs256(`${header}.${payload}`, secret)}`;
}

function refVerify(token: string | null, secret: string, now: number): { status: number; reason: string | null } {
  if (!token) return { status: 401, reason: "missing" };
  const parts = token.split(".");
  if (parts.length !== 3) return { status: 401, reason: "malformed" };
  let header: { alg?: string };
  let payload: { exp?: number; sub?: string };
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return { status: 401, reason: "malformed" };
  }
  if (header.alg !== "HS256") return { status: 401, reason: "algorithm" };
  const expected = Buffer.from(hs256(`${parts[0]}.${parts[1]}`, secret));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { status: 401, reason: "signature" };
  if (typeof payload.exp !== "number") return { status: 401, reason: "malformed" };
  return now < payload.exp ? { status: 200, reason: null } : { status: 401, reason: "expired" };
}

/** Refresh tokens kept as a map from value to record, families as sets of values. */
class ReferenceAuth {
  private store = new Map<string, { family: number; sub: string; exp: number; spent: boolean; dead: boolean }>();
  private families = new Map<number, Set<string>>();
  private familyCount = 0;
  private accessCount = 0;
  constructor(private secret: string) {}

  private mint(sub: string, family: number, now: number) {
    this.accessCount += 1;
    const access = refSign({ sub, iat: now, exp: now + 15 * 60, jti: `a${this.accessCount}` }, this.secret);
    const refresh = randomBytes(32).toString("base64url");
    this.store.set(refresh, { family, sub, exp: now + 7 * 86400, spent: false, dead: false });
    this.families.get(family)?.add(refresh);
    return { access, refresh };
  }

  login(sub: string, now: number) {
    this.familyCount += 1;
    this.families.set(this.familyCount, new Set());
    return this.mint(sub, this.familyCount, now);
  }

  exchange(value: string, now: number): { status: number; reason: string | null; access?: string; refresh?: string } {
    const entry = this.store.get(value);
    if (!entry) return { status: 400, reason: "unknown" };
    if (entry.dead) return { status: 400, reason: "revoked" };
    if (entry.spent) {
      for (const sibling of this.families.get(entry.family) ?? []) this.store.get(sibling)!.dead = true;
      return { status: 400, reason: "reused" };
    }
    if (now >= entry.exp) return { status: 400, reason: "expired" };
    entry.spent = true;
    return { status: 200, reason: null, ...this.mint(entry.sub, entry.family, now) };
  }

  logout(value: string) {
    const entry = this.store.get(value);
    if (!entry) return false;
    for (const sibling of this.families.get(entry.family) ?? []) this.store.get(sibling)!.dead = true;
    return true;
  }

  familyOf(value: string) {
    return this.store.get(value)?.family ?? null;
  }

  deadOf(value: string) {
    return this.store.get(value)?.dead ?? false;
  }
}

/** Seeded generator, so a failure can be replayed. */
function prng(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 2 ** 32;
  };
}

describe("HS256 primitives", () => {
  it("SHA-256 and HMAC match Node's crypto on random inputs", () => {
    const random = prng(7);
    for (let run = 0; run < 300; run++) {
      const length = Math.floor(random() * 300);
      const message = Uint8Array.from({ length }, () => Math.floor(random() * 256));
      const key = Uint8Array.from({ length: Math.floor(random() * 130) }, () => Math.floor(random() * 256));
      expect(Buffer.from(sha256(message)).toString("hex")).toBe(createHash("sha256").update(message).digest("hex"));
      expect(Buffer.from(hmacSha256(key, message)).toString("hex")).toBe(createHmac("sha256", key).update(message).digest("hex"));
      expect(base64url(message)).toBe(Buffer.from(message).toString("base64url"));
    }
  });

  it("builds JWTs byte for byte equal to ones built with createHmac", () => {
    const claims = { sub: SUBJECT, iat: EPOCH, exp: EPOCH + ACCESS_TTL, jti: "a1" };
    expect(signJwt(claims)).toBe(refSign(claims, SECRET));
  });

  it("lets a token through until the second before exp, and rejects it at exp", () => {
    const token = signJwt({ sub: SUBJECT, iat: EPOCH, exp: EPOCH + ACCESS_TTL, jti: "a1" });
    expect(callApi(token, EPOCH + ACCESS_TTL - 1)).toEqual({ status: 200, sub: SUBJECT });
    expect(callApi(token, EPOCH + ACCESS_TTL)).toEqual({ status: 401, reason: "expired" });
    expect(refVerify(token, SECRET, EPOCH + ACCESS_TTL - 1).status).toBe(200);
    expect(refVerify(token, SECRET, EPOCH + ACCESS_TTL).reason).toBe("expired");
  });

  it("rejects tampered tokens on the signature, before looking at exp", () => {
    const token = signJwt({ sub: SUBJECT, iat: EPOCH, exp: EPOCH + ACCESS_TTL, jti: "a1" });
    const [header, , signature] = token.split(".");
    // The payload re-encoded with a later exp under the old signature.
    const longer = b64u(JSON.stringify({ sub: SUBJECT, iat: EPOCH, exp: EPOCH + 30 * 86400, jti: "a1" }));
    const forged = `${header}.${longer}.${signature}`;
    expect(callApi(forged, EPOCH + 60)).toEqual({ status: 401, reason: "signature" });
    expect(refVerify(forged, SECRET, EPOCH + 60).reason).toBe("signature");
    // Even an expired forgery fails on the signature, not on exp.
    expect(callApi(forged, EPOCH + 40 * 86400)).toEqual({ status: 401, reason: "signature" });
    // "alg": "none" with no signature.
    const none = `${b64u(JSON.stringify({ alg: "none", typ: "JWT" }))}.${longer}.`;
    expect(callApi(none, EPOCH + 60)).toEqual({ status: 401, reason: "algorithm" });
    expect(refVerify(none, SECRET, EPOCH + 60).reason).toBe("algorithm");
    // Signed with another key.
    const other = refSign({ sub: SUBJECT, iat: EPOCH, exp: EPOCH + ACCESS_TTL, jti: "a1" }, "another-secret");
    expect(callApi(other, EPOCH + 60)).toEqual({ status: 401, reason: "signature" });
    // A changed character in the middle of the signature.
    const middle = Math.floor(signature.length / 2);
    const flipped = signature.slice(0, middle) + (signature[middle] === "A" ? "B" : "A") + signature.slice(middle + 1);
    expect(callApi(`${header}.${token.split(".")[1]}.${flipped}`, EPOCH + 60)).toEqual({ status: 401, reason: "signature" });
  });
});

/** The script played against the reference, as the trace the figure shows. */
function referenceTrace(script: Action[]) {
  const auth = new ReferenceAuth(SECRET);
  let access: string | null = null;
  let refresh: string | null = null;
  let stolen: string | null = null;
  const trace: { kind: string; at: number; status: number | null; reason: string | null; access: string | null }[] = [];
  for (const action of script) {
    const now = EPOCH + action.at;
    let status: number | null = null;
    let reason: string | null = null;
    if (action.kind === "login") {
      ({ access, refresh } = auth.login(SUBJECT, now));
      stolen ??= refresh;
      status = 200;
    } else if (action.kind === "call") {
      ({ status, reason } = refVerify(access, SECRET, now));
    } else if (action.kind === "refresh" || action.kind === "replay") {
      const result = auth.exchange(action.kind === "replay" ? stolen! : refresh!, now);
      ({ status, reason } = result);
      if (action.kind === "refresh" && result.access) {
        access = result.access;
        refresh = result.refresh!;
      }
    } else {
      access = null;
      refresh = null;
    }
    trace.push({ kind: action.kind, at: action.at, status, reason, access });
  }
  return trace;
}

describe("the figure's scenario", () => {
  it("matches the reference step for step, with the same access tokens", () => {
    const reference = referenceTrace(SCRIPT);
    const model = STEPS.slice(1).map((step) => ({
      kind: step.kind,
      at: step.at,
      status: step.status,
      reason: step.reason,
      access: step.access?.token ?? null,
    }));
    expect(model).toEqual(reference);
  });

  it("tells the story the figure draws", () => {
    const outcomes = STEPS.slice(1).map((step) => `${step.kind} ${step.status ?? "-"} ${step.reason ?? ""}`.trim());
    expect(outcomes).toEqual([
      "login 200",
      "call 200",
      "call 200",
      "call 401 expired",
      "refresh 200",
      "call 200",
      "call 200",
      "replay 400 reused",
      // The family is revoked, but the access token in hand is still valid until its exp.
      "call 200",
      "call 401 expired",
      "refresh 400 revoked",
      "clear -",
    ]);
    const rotated = STEPS.find((step) => step.kind === "refresh" && step.status === 200)!;
    expect(rotated.records.map((record) => record.state)).toEqual(["used", "active"]);
    const replay = STEPS.find((step) => step.kind === "replay")!;
    expect(replay.records.map((record) => record.state)).toEqual(["revoked", "revoked"]);
    expect(STEPS.at(-1)?.access).toBeNull();
    expect(STEPS.at(-1)?.refresh).toBeNull();
  });

  it("is deterministic", () => {
    expect(simulate()).toEqual(STEPS);
  });
});

describe("random runs against the reference", () => {
  type Held = { model: string; ref: string; exp: number; family: number };

  it("agrees on every response and keeps every invariant", () => {
    let revokedButValid = 0;
    let reuses = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const random = prng(seed * 7919);
      const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];
      const model = createAuthServer(SECRET);
      const ref = new ReferenceAuth(SECRET);
      const access: Held[] = [];
      const refresh: { model: string; ref: string; spent: boolean }[] = [];
      let now = EPOCH;

      for (let move = 0; move < 40; move++) {
        now += Math.floor(random() * 8 * 60);
        if (random() < 0.06) now += REFRESH_TTL;
        const roll = random();
        if (roll < 0.12 || !refresh.length) {
          const sub = pick(["user-1", "user-2"]);
          const a = model.login(sub, now);
          const b = ref.login(sub, now);
          expect(a.access).toBe(b.access);
          access.push({ model: a.access, ref: b.access, exp: now + ACCESS_TTL, family: a.family });
          refresh.push({ model: a.refresh, ref: b.refresh, spent: false });
        } else if (roll < 0.5) {
          const held = pick(access);
          const tamper = random() < 0.15;
          let token = held.model;
          if (tamper) {
            const [header, , signature] = token.split(".");
            token = `${header}.${b64u(JSON.stringify({ sub: "admin", iat: now, exp: now + 86400, jti: "x" }))}.${signature}`;
          }
          const a = callApi(token, now);
          const b = refVerify(tamper ? token : held.ref, SECRET, now);
          expect({ status: a.status, reason: a.status === 200 ? null : a.reason }).toEqual(b);
          // An expired access token never passes, a tampered one never does.
          if (now >= held.exp || tamper) expect(a.status).toBe(401);
          else expect(a.status).toBe(200);
          const family = model.records().filter((record) => record.family === held.family);
          if (!tamper && a.status === 200 && family.every((record) => record.revoked)) revokedButValid += 1;
        } else if (roll < 0.94) {
          const index = Math.floor(random() * refresh.length);
          const held = refresh[index];
          const before = model.records();
          const family = before.find((record) => record.token === held.model)!.family;
          const a = model.refresh(held.model, now);
          const b = ref.exchange(held.ref, now);
          expect({ status: a.ok ? 200 : 400, reason: a.ok ? null : a.error }).toEqual({ status: b.status, reason: b.reason });
          // A used refresh token never refreshes again.
          if (held.spent) expect(a.ok).toBe(false);
          const after = model.records();
          if (!a.ok && a.error === "reused") {
            reuses += 1;
            // Every token of the family is revoked; other families are untouched.
            for (const record of after) {
              if (record.family === family) expect(record.revoked).toBe(true);
              else expect(record).toEqual(before.find((other) => other.id === record.id));
            }
          }
          if (a.ok) {
            held.spent = true;
            expect(after.find((record) => record.token === held.model)?.used).toBe(true);
            expect(a.access).toBe(b.access);
            access.push({ model: a.access, ref: b.access!, exp: now + ACCESS_TTL, family: a.family });
            refresh.push({ model: a.refresh, ref: b.refresh!, spent: false });
          }
        } else {
          const held = pick(refresh);
          expect(model.logout(held.model)).toBe(ref.logout(held.ref));
          const family = model.records().find((record) => record.token === held.model)!.family;
          for (const record of model.records()) if (record.family === family) expect(record.revoked).toBe(true);
          expect(ref.deadOf(held.ref)).toBe(true);
          expect(ref.familyOf(held.ref)).not.toBeNull();
        }
      }
    }
    // The runs reached the cases the invariants are about.
    expect(reuses).toBeGreaterThan(50);
    expect(revokedButValid).toBeGreaterThan(20);
  });
});
