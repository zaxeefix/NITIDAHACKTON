import { env } from "cloudflare:workers";
import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureWorkspaceUser, requireRole } from "../../../db/authorization";
import { auditEntries, integrationRuns } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

type ProviderEnv = {
  EMAIL_INGEST_TOKEN?: string;
  EMAIL_INGEST_ADDRESS?: string;
  OCR_PROVIDER_URL?: string;
  OCR_PROVIDER_TOKEN?: string;
  THREAT_INTEL_URL?: string;
  THREAT_INTEL_TOKEN?: string;
  WEBHOOK_SIGNING_SECRET?: string;
};

function config() { return env as unknown as ProviderEnv; }
function safeProviderUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || host === "localhost" || host.endsWith(".local") || host === "::1") return false;
    if (/^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(host)) return false;
    const match = host.match(/^172\.(\d+)\./);
    return !(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
  } catch { return false; }
}

function readiness() {
  const c = config();
  return [
    { type: "Email Intake", configured: Boolean(c.EMAIL_INGEST_TOKEN && c.EMAIL_INGEST_ADDRESS), destination: c.EMAIL_INGEST_ADDRESS || "Not configured", capability: "Authenticated inbound reports" },
    { type: "Document OCR", configured: Boolean(c.OCR_PROVIDER_TOKEN && safeProviderUrl(c.OCR_PROVIDER_URL)), destination: c.OCR_PROVIDER_URL ? "Secure provider endpoint" : "Not configured", capability: "Image and PDF text extraction" },
    { type: "Threat Intelligence", configured: Boolean(c.THREAT_INTEL_TOKEN && safeProviderUrl(c.THREAT_INTEL_URL)), destination: c.THREAT_INTEL_URL ? "Secure provider endpoint" : "Not configured", capability: "Indicator reputation enrichment" },
    { type: "Signed Webhook", configured: Boolean(c.WEBHOOK_SIGNING_SECRET), destination: c.WEBHOOK_SIGNING_SECRET ? "Signing key available" : "Not configured", capability: "Approved incident delivery" },
  ];
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  await ensureWorkspaceUser(user);
  if (!await requireRole(user, ["Administrator"])) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const runs = await getDb().select().from(integrationRuns).orderBy(desc(integrationRuns.createdAt)).limit(25);
  return Response.json({ providers: readiness(), runs });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!await requireRole(user, ["Administrator"])) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const body = await request.json() as { type?: string };
  const provider = readiness().find(item => item.type === body.type);
  if (!provider) return Response.json({ error: "Unknown provider type" }, { status: 400 });
  const started = Date.now();
  let status = provider.configured ? "Configuration Verified" : "Credential Required";
  let responseCode: number | null = null;
  let detail = provider.configured ? `${provider.capability} is ready for a controlled workload test.` : "Required server-side endpoint or credential is missing.";
  const c = config();
  const target = body.type === "Document OCR" ? c.OCR_PROVIDER_URL : body.type === "Threat Intelligence" ? c.THREAT_INTEL_URL : undefined;
  const token = body.type === "Document OCR" ? c.OCR_PROVIDER_TOKEN : body.type === "Threat Intelligence" ? c.THREAT_INTEL_TOKEN : undefined;
  if (provider.configured && target && token) {
    try {
      const response = await fetch(target, { method: "HEAD", headers: { authorization: `Bearer ${token}`, "user-agent": "Triage247Ng-Provider-Test/1.0" }, signal: AbortSignal.timeout(8000), redirect: "error" });
      responseCode = response.status;
      status = response.ok || response.status === 405 ? "Reachable" : "Provider Rejected Test";
      detail = response.ok || response.status === 405 ? "The configured HTTPS provider is reachable; no incident data was transmitted." : `Provider returned HTTP ${response.status}; no incident data was transmitted.`;
    } catch { status = "Connection Failed"; detail = "The provider could not be reached within the controlled test window."; }
  }
  const run = { id: crypto.randomUUID(), providerType: provider.type, operation: "Configuration test", status, responseCode, detail, initiatedBy: user.email, durationMs: Date.now() - started };
  const db = getDb();
  await db.insert(integrationRuns).values(run);
  await db.insert(auditEntries).values({ actorEmail: user.email, action: "Provider configuration tested", newValue: JSON.stringify({ provider: provider.type, status, responseCode }), reason: "Controlled integration readiness check; no incident data transmitted" });
  return Response.json({ run }, { status: provider.configured ? 200 : 503 });
}
