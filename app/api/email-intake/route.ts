import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { auditEntries, incidents, integrationRuns, notifications } from "../../../db/schema";
import { analyseIncident } from "../../lib/triage-model";
import { reducePersonalInformation } from "../../lib/privacy";

type EmailEnv = { EMAIL_INGEST_TOKEN?: string };
function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function equalSecret(left: string, right: string) {
  if (!left || left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i++) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

export async function POST(request: Request) {
  const started = Date.now();
  const expected = (env as unknown as EmailEnv).EMAIL_INGEST_TOKEN?.trim() || "";
  const supplied = request.headers.get("x-triageng-ingest-token") || "";
  if (!equalSecret(expected, supplied)) return Response.json({ error: "Invalid intake credential" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const subject = clean(body.subject, 120), text = clean(body.text, 4000), sender = clean(body.sender, 180);
  if (subject.length < 4 || text.length < 20) return Response.json({ error: "Email subject and message are required" }, { status: 400 });
  const analysis = analyseIncident(`${subject} ${text}`);
  const { category, severity, confidence } = analysis;
  const id = `TNG-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const db = getDb();
  await db.insert(incidents).values({ id, title: subject, description: text, redactedDescription: reducePersonalInformation(text).redacted, category, severity, confidence, reporterEmail: sender || null, department: clean(body.department, 120) || "Email Intake", affectedSystem: clean(body.affectedSystem, 160) || "Unspecified", language: clean(body.language, 20) || "English", analysisExplanation: `${analysis.model} recommended ${category} from evidence: ${analysis.evidence.join(", ") || "no strong known token"}. Human review is required.` });
  await db.insert(integrationRuns).values({ id: crypto.randomUUID(), providerType: "Email Intake", operation: "Inbound report", status: "Accepted", responseCode: 202, detail: `Created ${id}`, initiatedBy: sender || "email-provider", durationMs: Date.now() - started });
  await db.insert(auditEntries).values({ incidentId: id, actorEmail: sender || "email-provider", action: "Incident received through authenticated email intake", newValue: JSON.stringify({ subject, category, severity }), reason: "Provider-authenticated inbound report" });
  await db.insert(notifications).values({ incidentId: id, type: severity === "Critical" ? "Critical" : "Incident", title: `${severity} email report received`, message: `${id}: ${subject}` });
  return Response.json({ accepted: true, incidentId: id }, { status: 202 });
}
