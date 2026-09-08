import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { authorize, mutationAllowed, writeAudit } from "../../../db/security";
import { integrationEndpoints } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

function clean(value: unknown, max = 500) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

function signingSecret() {
  return (env as unknown as { WEBHOOK_SIGNING_SECRET?: string }).WEBHOOK_SIGNING_SECRET?.trim() || "";
}

function safeHttpsEndpoint(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || host === "localhost" || host.endsWith(".local") || host === "::1") return false;
    if (/^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(host)) return false;
    const match = host.match(/^172\.(\d+)\./);
    if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return false;
    return true;
  } catch { return false; }
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!await authorize(user, "integration:manage")) return Response.json({ error: "Integration permission required" }, { status: 403 });
  const endpoints = await getDb().select().from(integrationEndpoints).orderBy(desc(integrationEndpoints.createdAt)).limit(100);
  return Response.json({ endpoints, providerStatus: { webhookSigning: "Credential required", email: "Provider required", imagePdfOcr: "Provider required", threatIntelligence: "Provider required" } });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!mutationAllowed(request)) return Response.json({ error: "Cross-site mutation rejected" }, { status: 403 });
  const member = await authorize(user, "integration:manage");
  if (!member) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const name = clean(body.name, 120), type = clean(body.type, 30), endpointUrl = clean(body.endpointUrl);
  if (!name || !["Webhook", "Email", "OCR", "Threat Intelligence"].includes(type)) return Response.json({ error: "Valid name and integration type required" }, { status: 400 });
  if (endpointUrl && !safeHttpsEndpoint(endpointUrl)) return Response.json({ error: "A public HTTPS endpoint is required" }, { status: 400 });
  const id = crypto.randomUUID();
  const row = { id, name, type, endpointUrl: endpointUrl || null, enabled: false, status: endpointUrl ? "Credential Required" : "Not Configured", createdBy: user.email, ownerEmail: user.email, approvalStatus: "Approved", riskClassification: type === "Webhook" ? "High" : "Moderate", dataSharingDescription: clean(body.dataSharingDescription, 500) || "No incident data sharing approved", keyId: clean(body.keyId, 80) || null };
  const db = getDb();
  await db.insert(integrationEndpoints).values(row);
  await writeAudit({ request, user, role: member.role, action: "Integration endpoint registered", targetResource: `integration:${id}`, newValue: { id, name, type, endpointConfigured: Boolean(endpointUrl), approvalStatus: row.approvalStatus, riskClassification: row.riskClassification }, reason: "Provider-neutral integration setup" });
  return Response.json({ endpoint: row }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!mutationAllowed(request)) return Response.json({ error: "Cross-site mutation rejected" }, { status: 403 });
  const member = await authorize(user, "integration:manage");
  if (!member) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const body = await request.json() as { id?: string; enabled?: boolean };
  if (!body.id || typeof body.enabled !== "boolean") return Response.json({ error: "Endpoint id and enabled state are required" }, { status: 400 });
  const db = getDb();
  const [endpoint] = await db.select().from(integrationEndpoints).where(eq(integrationEndpoints.id, body.id)).limit(1);
  if (!endpoint) return Response.json({ error: "Endpoint not found" }, { status: 404 });
  if (body.enabled && endpoint.type === "Webhook" && (!endpoint.endpointUrl || !safeHttpsEndpoint(endpoint.endpointUrl))) return Response.json({ error: "A safe public HTTPS endpoint is required" }, { status: 400 });
  if (body.enabled && endpoint.type === "Webhook" && !signingSecret()) return Response.json({ error: "Webhook signing credential has not been configured by the platform administrator" }, { status: 503 });
  if (body.enabled && endpoint.approvalStatus !== "Approved") return Response.json({ error: "Integration approval is required before enablement" }, { status: 409 });
  await db.update(integrationEndpoints).set({ enabled: body.enabled, status: body.enabled ? "Ready" : "Disabled", lastTestAt: body.enabled ? new Date().toISOString() : endpoint.lastTestAt, updatedAt: new Date().toISOString() }).where(eq(integrationEndpoints.id, body.id));
  await writeAudit({ request, user, role: member.role, action: body.enabled ? "Integration endpoint enabled" : "Integration endpoint disabled", targetResource: `integration:${body.id}`, previousValue: { enabled: endpoint.enabled }, newValue: { enabled: body.enabled }, reason: "Authorized integration state change" });
  return Response.json({ ok: true });
}
