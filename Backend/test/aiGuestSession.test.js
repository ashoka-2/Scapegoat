import assert from "node:assert/strict";
import test from "node:test";
import { ensureGuestSession, getGuestSessionHash } from "../src/utils/aiGuestSession.js";

const makeResponse = () => ({
  cookies: [],
  cookie(name, value, options) {
    this.cookies.push({ name, value, options });
  },
});

test("guest ownership is based on an opaque cookie, not caller-controlled visitorId", () => {
  const firstRequest = { cookies: {}, headers: { "x-visitor-id": "attacker-controlled-id" } };
  const firstResponse = makeResponse();
  const firstHash = ensureGuestSession(firstRequest, firstResponse);

  assert.equal(firstResponse.cookies.length, 1);
  assert.equal(firstResponse.cookies[0].options.httpOnly, true);
  assert.equal(firstHash, getGuestSessionHash({ cookies: { scapegoat_ai_guest: firstResponse.cookies[0].value } }));

  const impersonator = { cookies: {}, headers: { "x-visitor-id": "attacker-controlled-id" } };
  assert.equal(getGuestSessionHash(impersonator), null);
  assert.notEqual(ensureGuestSession(impersonator, makeResponse()), firstHash);
});

test("malformed and missing guest cookies cannot authorize a session", () => {
  assert.equal(getGuestSessionHash({ cookies: {} }), null);
  assert.equal(getGuestSessionHash({ cookies: { scapegoat_ai_guest: "short" } }), null);
});
