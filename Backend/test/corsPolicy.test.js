import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedCorsOrigin, parseAllowedOrigins } from "../src/config/corsPolicy.js";

test("CORS permits only configured origins in production", () => {
  const allowed = parseAllowedOrigins("https://shop.example.com, https://admin.example.com/");
  assert.equal(isAllowedCorsOrigin("https://shop.example.com", allowed, "production"), true);
  assert.equal(isAllowedCorsOrigin("https://admin.example.com/", allowed, "production"), true);
  assert.equal(isAllowedCorsOrigin("https://evil.example", allowed, "production"), false);
  assert.equal(isAllowedCorsOrigin("https://anything.vercel.app", allowed, "production"), false);
});

test("CORS handles non-browser and local development requests deliberately", () => {
  const allowed = parseAllowedOrigins("https://shop.example.com");
  assert.equal(isAllowedCorsOrigin(undefined, allowed, "production"), true);
  assert.equal(isAllowedCorsOrigin("http://localhost:5173", allowed, "development"), true);
  assert.equal(isAllowedCorsOrigin("http://localhost:5173", allowed, "production"), false);
});
