import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("local development identity is explicit and production fail-closed", () => {
  const source = read("app/chatgpt-auth.ts");
  assert.match(source, /TRIAGENG_LOCAL_DEV !== "true"/);
  assert.match(source, /TRIAGENG_ENVIRONMENT !== "development"/);
  assert.match(read("app/page.tsx"), /Development mode: local test identity is active/);
});

test("central permissions deny missing roles and protect critical actions", () => {
  const source = read("db/security.ts");
  for (const permission of ["incident:read-original", "redaction:approve", "routing:approve", "delivery:retry", "role:manage", "audit:export", "retention:manage", "model:manage"])
    assert.ok(source.includes(`"${permission}"`), permission);
  assert.match(source, /if \(!member \|\| member\.status !== "Active"/);
  assert.match(source, /member\.role === "Reporter"/);
});

test("administration surfaces and configuration APIs are administrator-scoped", () => {
  const page = read("app/page.tsx");
  const security = read("db/security.ts");
  const rules = read("app/api/rules/route.ts");
  const providers = read("app/api/providers/route.ts");
  assert.match(page, /"Users & Roles": \["Administrator"\]/);
  assert.match(page, /"Integration Centre": \["Administrator"\]/);
  assert.match(page, /Settings: \["Administrator"\]/);
  assert.match(security, /"role:manage","integration:manage","delivery:retry"/);
  assert.ok((rules.match(/requireRole\(user, \["Administrator"\]\)/g) || []).length >= 3);
  assert.ok((providers.match(/requireRole\(user, \["Administrator"\]\)/g) || []).length >= 2);
});

test("uploads verify content signatures, randomize keys, hash and quarantine", () => {
  const source = read("app/api/attachments/route.ts");
  assert.match(source, /detectedType\(bytes\)/);
  assert.match(source, /crypto\.randomUUID\(\)/);
  assert.match(source, /SHA-256/);
  assert.match(source, /Scan Pending/);
  assert.match(source, /Quarantined/);
  assert.match(source, /file\.size > 10 \* 1024 \* 1024/);
});

test("audit chain stores previous and current event hashes", () => {
  const source = read("db/security.ts");
  assert.match(source, /previousEventHash/);
  assert.match(source, /eventHash/);
  assert.match(source, /verifyAuditChain/);
  assert.match(read("app/api/audit/route.ts"), /integrity: await verifyAuditChain/);
});

test("NIST lifecycle, human routing and no automatic closure remain enforced", () => {
  const security = read("db/security.ts"), routing = read("app/api/routing/route.ts");
  for (const state of ["Submitted", "Awaiting review", "Containment in progress", "Eradication in progress", "Recovery in progress", "Routing pending approval", "Closed", "False positive"])
    assert.ok(security.includes(`"${state}"`), state);
  assert.match(routing, /authorize\(user, "routing:approve"\)/);
  assert.match(routing, /redactionStatus !== "Approved"/);
  assert.doesNotMatch(read("app/lib/triage-model.ts"), /status\s*:\s*["']Closed["']/);
});

test("forward migration preserves prior migrations and adds security indexes", () => {
  const files = readdirSync(new URL("../drizzle/", import.meta.url)).filter(name => /^\d{4}.*\.sql$/.test(name));
  assert.equal(files.at(-1), "0011_nist_security_controls.sql");
  const migration = read("drizzle/0011_nist_security_controls.sql");
  assert.match(migration, /ADD `event_hash`/);
  assert.match(migration, /ADD `sha256`/);
  assert.match(migration, /CREATE UNIQUE INDEX `idx_audit_entries_event_id`/);
  assert.match(migration, /UPDATE `incidents` SET `status` = 'Awaiting review'/);
});

test("worker applies security headers and bounded API requests", () => {
  const source = read("worker/index.ts");
  for (const header of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy"])
    assert.ok(source.includes(header), header);
  assert.match(source, /11 \* 1024 \* 1024/);
});

test("webhook delivery has signatures, timeout, redirect refusal and dead-letter limit", () => {
  const source = read("app/api/deliveries/route.ts");
  assert.match(source, /HMAC/);
  assert.match(source, /AbortSignal\.timeout\(10000\)/);
  assert.match(source, /redirect: "error"/);
  assert.match(source, /Dead Letter/);
  assert.match(source, /maxAttempts/);
});
