import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { authorize, mutationAllowed, writeAudit } from "../../../db/security";
import { auditEntries, deliveryQueue, integrationEndpoints } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

function signingSecret() { return (env as unknown as { WEBHOOK_SIGNING_SECRET?: string }).WEBHOOK_SIGNING_SECRET?.trim() || ""; }

function safeHttpsEndpoint(value: string) {
  try {
    const url = new URL(value), host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || host === "localhost" || host.endsWith(".local") || host === "::1") return false;
    if (/^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(host)) return false;
    const match = host.match(/^172\.(\d+)\./);
    return !(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
  } catch { return false; }
}

function hex(buffer: ArrayBuffer) { return [...new Uint8Array(buffer)].map(value => value.toString(16).padStart(2, "0")).join(""); }

async function hmac(payload: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!await authorize(user, "routing:approve")) return Response.json({ error: "Delivery permission required" }, { status: 403 });
  return Response.json({ deliveries: await getDb().select().from(deliveryQueue).orderBy(desc(deliveryQueue.createdAt)).limit(300) });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!mutationAllowed(request)) return Response.json({ error: "Cross-site mutation rejected" }, { status: 403 });
  const member = await authorize(user, "delivery:retry");
  if (!member) return Response.json({ error: "Senior Analyst permission required" }, { status: 403 });
  const body = await request.json() as { id?: string };
  if (!body.id) return Response.json({ error: "Delivery id required" }, { status: 400 });
  const db = getDb();
  const [delivery] = await db.select().from(deliveryQueue).where(eq(deliveryQueue.id, body.id)).limit(1);
  if (!delivery) return Response.json({ error: "Delivery not found" }, { status: 404 });
  if (delivery.attempts >= delivery.maxAttempts || delivery.status === "Dead Letter") return Response.json({ error: "Maximum retry count reached; delivery is in dead-letter state" }, { status: 409 });
  const attempts = delivery.attempts + 1;
  const nextAttemptAt = new Date(Date.now() + Math.min(60, 2 ** attempts) * 60000).toISOString(), secret = signingSecret();
  if (!delivery.endpointId) {
    await db.update(deliveryQueue).set({ attempts, status: "Awaiting Configuration", lastError: "No endpoint linked to routing rule", nextAttemptAt, updatedAt: new Date().toISOString() }).where(eq(deliveryQueue.id, delivery.id));
    return Response.json({ error: "No endpoint is linked to this delivery", attempts, nextAttemptAt }, { status: 409 });
  }
  const [endpoint] = await db.select().from(integrationEndpoints).where(eq(integrationEndpoints.id, delivery.endpointId)).limit(1);
  if (!endpoint || !endpoint.enabled || endpoint.type !== "Webhook" || !endpoint.endpointUrl || !safeHttpsEndpoint(endpoint.endpointUrl) || !secret) {
    await db.update(deliveryQueue).set({ attempts, status: "Awaiting Credential Validation", lastError: "Enabled HTTPS webhook and signing credential required", nextAttemptAt, updatedAt: new Date().toISOString() }).where(eq(deliveryQueue.id, delivery.id));
    return Response.json({ error: "Webhook endpoint or signing credential is not ready", attempts, nextAttemptAt }, { status: 409 });
  }
  const timestamp = new Date().toISOString(), signature = await hmac(`${timestamp}.${delivery.payloadJson}`, secret);
  try {
    const response = await fetch(endpoint.endpointUrl, { method: "POST", headers: { "content-type": "application/json", "x-triageng-signature": `sha256=${signature}`, "x-triageng-timestamp": timestamp, "x-triageng-delivery-id": delivery.id, "idempotency-key": delivery.id }, body: delivery.payloadJson, redirect: "error", signal: AbortSignal.timeout(10000) });
    const responseText = (await response.text()).slice(0, 4096);
    const responseBodyHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(responseText)));
    const status = response.ok ? "Delivered" : "Failed", deliveredAt = response.ok ? new Date().toISOString() : null;
    await db.update(deliveryQueue).set({ attempts, status, responseCode: response.status, responseBodyHash, deliveredAt, signatureAlgorithm: "HMAC-SHA256", lastError: response.ok ? null : `Remote endpoint returned HTTP ${response.status}`, nextAttemptAt: response.ok ? null : nextAttemptAt, updatedAt: new Date().toISOString() }).where(eq(deliveryQueue.id, delivery.id));
    await db.insert(auditEntries).values({ incidentId: delivery.incidentId, actorEmail: user.email, action: response.ok ? "Signed webhook delivered" : "Webhook delivery failed", previousValue: delivery.status, newValue: status, reason: `HTTP ${response.status}; receipt hash ${responseBodyHash}` });
    return Response.json({ ok: response.ok, status, responseCode: response.status, attempts, deliveredAt, nextAttemptAt: response.ok ? null : nextAttemptAt }, { status: response.ok ? 200 : 502 });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : "Webhook request failed";
    const dead = attempts >= delivery.maxAttempts;
    await db.update(deliveryQueue).set({ attempts, status: dead ? "Dead Letter" : "Failed", deadLetteredAt: dead ? new Date().toISOString() : null, lastError: message, nextAttemptAt: dead ? null : nextAttemptAt, signatureAlgorithm: "HMAC-SHA256", updatedAt: new Date().toISOString() }).where(eq(deliveryQueue.id, delivery.id));
    await writeAudit({ request, user, role: member.role, incidentId: delivery.incidentId, action: dead ? "Webhook delivery dead-lettered" : "Webhook delivery failed", targetResource: `delivery:${delivery.id}`, previousValue: { status: delivery.status, attempts: delivery.attempts }, newValue: { status: dead ? "Dead Letter" : "Failed", attempts }, reason: message, outcome: "Failure" });
    return Response.json({ error: "Webhook delivery failed", attempts, nextAttemptAt }, { status: 502 });
  }
}
