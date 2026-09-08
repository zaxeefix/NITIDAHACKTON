import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureWorkspaceUser } from "../../../db/authorization";
import { authorize, canTransition, incidentStates, mutationAllowed, requestWithinLimit, writeAudit } from "../../../db/security";
import { incidents, notifications } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";
import { analyseIncident } from "../../lib/triage-model";
import { reducePersonalInformation } from "../../lib/privacy";

function clean(value: unknown, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function extractIndicators(text: string) {
  const matches = [
    ...(text.match(/https?:\/\/[^\s<>"]+/gi) || []),
    ...(text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || []),
    ...(text.match(/\b[a-f0-9]{32,64}\b/gi) || []),
    ...(text.match(/\b[a-z0-9.-]+\.(?:com|net|org|ng|io|top|xyz)\b/gi) || []),
  ];
  return [...new Set(matches.map(value => value.replace(/[),.;]+$/, "")))].slice(0, 20);
}

function similarity(a: string, b: string) {
  const tokens = (value: string) => value.toLowerCase().match(/[a-z0-9]{2,}/g) || [];
  const counts = (values: string[]) => values.reduce<Record<string, number>>((all, token) => ({ ...all, [token]: (all[token] || 0) + 1 }), {});
  const left = counts(tokens(a)), right = counts(tokens(b));
  const dot = Object.entries(left).reduce((sum, [token, count]) => sum + count * (right[token] || 0), 0);
  const norm = (values: Record<string, number>) => Math.sqrt(Object.values(values).reduce((sum, count) => sum + count * count, 0));
  return dot / (norm(left) * norm(right) || 1);
}

function severityRecommendation(categorySeverity: string, confidence: number, relatedCount: number) {
  const impactByBand: Record<string, number> = { Critical: 95, High: 75, Medium: 50, Low: 25, Informational: 10 };
  const impact = impactByBand[categorySeverity] ?? 50;
  const urgency = categorySeverity === "Critical" ? 100 : categorySeverity === "High" ? 75 : categorySeverity === "Medium" ? 50 : 25;
  const assetImportance = 60;
  const similarReports = Math.min(100, relatedCount * 20);
  const evidenceReliability = Math.max(0, Math.min(100, confidence));
  const score = Math.round(.30 * impact + .25 * urgency + .20 * assetImportance + .15 * similarReports + .10 * evidenceReliability);
  const band = score >= 75 ? "Critical" : score >= 50 ? "High" : score >= 25 ? "Medium" : "Low";
  return { score, band, factors: { impact, urgency, assetImportance, similarReports, evidenceReliability }, weights: { impact: .30, urgency: .25, assetImportance: .20, similarReports: .15, evidenceReliability: .10 } };
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const member = await authorize(user, "incident:read");
  if (!member) return Response.json({ error: "Incident permission required" }, { status: 403 });
  const rows = member.role === "Reporter"
    ? await getDb().select().from(incidents).where(eq(incidents.reporterEmail, user.email)).orderBy(desc(incidents.createdAt)).limit(200)
    : await getDb().select().from(incidents).orderBy(desc(incidents.createdAt)).limit(200);
  return Response.json({ incidents: rows.map(row => member.role === "Reporter" ? { ...row, description: row.redactedDescription } : row) });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!mutationAllowed(request) || !requestWithinLimit(request)) return Response.json({ error: "Request rejected by security policy" }, { status: 403 });
  await ensureWorkspaceUser(user);
  const member = await authorize(user, "incident:create");
  if (!member) return Response.json({ error: "Incident creation permission required" }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const title = clean(body.title, 120);
  const description = clean(body.description);
  if (title.length < 8 || description.length < 20) {
    return Response.json({ error: "Title and a detailed description are required" }, { status: 400 });
  }
  const clientReference = clean(body.clientReference, 40);
  const id = /^TNG-LOCAL-\d{4}-[A-Z0-9]{8}$/.test(clientReference) ? clientReference : `TNG-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const analysis = analyseIncident(`${title} ${description}`);
  const indicators = extractIndicators(`${title} ${description}`);
  const db = getDb();
  const [alreadySynced] = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
  if (alreadySynced) return Response.json({ incident: alreadySynced, synchronised: true }, { status: 200 });
  const existingIncidents = await db.select({ id: incidents.id, title: incidents.title, description: incidents.description }).from(incidents).orderBy(desc(incidents.createdAt)).limit(100);
  const duplicate = existingIncidents.map(item => ({ id: item.id, score: similarity(`${title} ${description}`, `${item.title} ${item.description}`) })).sort((a, b) => b.score - a.score)[0];
  const duplicateOf = duplicate && duplicate.score >= 0.20 ? duplicate.id : null;
  const severity = severityRecommendation(analysis.severity, analysis.confidence, duplicateOf ? 1 : 0);
  const row = {
    id, title, description,
    redactedDescription: reducePersonalInformation(description).redacted,
    category: analysis.category,
    severity: severity.band,
    confidence: analysis.confidence,
    indicatorsJson: JSON.stringify(indicators),
    duplicateOf,
    relatedCount: duplicateOf ? 1 : 0,
    analysisExplanation: `${analysis.model} recommended ${analysis.category} from evidence: ${analysis.evidence.join(", ") || "no strong known token"}. Severity ${severity.score}/100 (${severity.band}) uses S = 0.30I + 0.25U + 0.20A + 0.15C + 0.10R with I=${severity.factors.impact}, U=${severity.factors.urgency}, A=${severity.factors.assetImportance}, C=${severity.factors.similarReports}, R=${severity.factors.evidenceReliability}. Extracted ${indicators.length} technical indicator${indicators.length === 1 ? "" : "s"}.${duplicateOf ? ` Possible duplicate of ${duplicateOf}.` : " No strong duplicate match."} This is an AI recommendation with synthetic-data limitations; human confirmation is required.`,
    department: clean(body.department, 120) || "Unspecified",
    affectedSystem: clean(body.affectedSystem, 160) || "Unspecified",
    language: clean(body.language, 20) || "English",
    reporterEmail: user.email,
    status: "Submitted",
  };
  await db.insert(incidents).values(row);
  await writeAudit({ request, user, role: member.role, incidentId: id, action: "Incident submitted and explainable analysis created", targetResource: `incident:${id}`, newValue: { title, department: row.department, category: row.category, severity: row.severity, confidence: row.confidence, indicators, duplicateOf, status: "Submitted" }, reason: "Incident intake" });
  await db.insert(notifications).values({ incidentId: id, type: row.severity === "Critical" ? "Critical" : "Incident", title: `${row.severity} incident received`, message: `${id}: ${title}` });
  const [created] = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
  return Response.json({ incident: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!mutationAllowed(request) || !requestWithinLimit(request)) return Response.json({ error: "Request rejected by security policy" }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const id = clean(body.id, 40);
  const reason = clean(body.reason, 500);
  if (!id || reason.length < 10) return Response.json({ error: "Incident id and a reason are required" }, { status: 400 });
  const db = getDb();
  const requestedPermission = body.originalRevealed ? "incident:read-original" : body.redactionStatus ? "redaction:approve" : body.assignedAnalyst ? "incident:assign" : body.status === "Closed" ? "incident:close" : body.status === "Reopened" ? "incident:reopen" : "incident:correct";
  const member = await authorize(user, requestedPermission, id);
  if (!member) return Response.json({ error: "Permission denied" }, { status: 403 });
  const [existing] = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
  if (!existing) return Response.json({ error: "Incident not found" }, { status: 404 });
  const changes: Partial<typeof incidents.$inferInsert> = { updatedAt: new Date().toISOString() };
  const categories = ["Phishing","Account takeover","Malware","Ransomware","Data exposure","Unauthorised access","Payment fraud","Denial of service","Lost or stolen device","Insider threat","Vulnerability report","Benign or non-security enquiry","Ambiguous report","Harmless technical failure","Business Email Compromise","Other","Unclassified"];
  const severities = ["Informational","Low","Medium","High","Critical"];
  if (body.category) {
    const category = clean(body.category, 80);
    if (!categories.includes(category)) return Response.json({ error: "Invalid incident category" }, { status: 400 });
    changes.category = category;
  }
  if (body.severity) {
    const severity = clean(body.severity, 24);
    if (!severities.includes(severity)) return Response.json({ error: "Invalid incident severity" }, { status: 400 });
    changes.severity = severity;
  }
  if (body.status) {
    const status = clean(body.status, 40);
    if (!incidentStates.includes(status as never) || !canTransition(existing.status, status)) return Response.json({ error: `Invalid transition from ${existing.status} to ${status}` }, { status: 409 });
    changes.status = status;
  }
  if (body.assignedAnalyst) {
    const assignedAnalyst = clean(body.assignedAnalyst, 160) === "self" ? user.email : clean(body.assignedAnalyst, 160);
    const assignedAt = new Date();
    const targetMinutes: Record<string, number> = { Critical: 15, High: 60, Medium: 240, Low: 1440, Informational: 2880 };
    changes.assignedAnalyst = assignedAnalyst;
    changes.assignedAt = assignedAt.toISOString();
    changes.slaDueAt = new Date(assignedAt.getTime() + (targetMinutes[existing.severity] || 240) * 60000).toISOString();
  }
  if (body.redactedDescription) changes.redactedDescription = clean(body.redactedDescription);
  if (body.redactionStatus) changes.redactionStatus = clean(body.redactionStatus, 40);
  if (body.closureSummary) changes.closureSummary = clean(body.closureSummary, 2000);
  if (changes.status === "Closed") changes.closedAt = new Date().toISOString();
  if (changes.status && changes.status !== "Closed" && existing.status === "Closed") {
    changes.closedAt = null;
    changes.closureSummary = null;
  }
  await db.update(incidents).set(changes).where(eq(incidents.id, id));
  const auditAction = body.originalRevealed ? "Original report revealed" : changes.status ? "Incident status changed" : "Incident updated";
  await writeAudit({ request, user, role: member.role, incidentId: id, action: auditAction, targetResource: `incident:${id}`, previousValue: body.originalRevealed ? null : existing, newValue: body.originalRevealed ? { access: "Original content viewed" } : changes, reason });
  if (changes.assignedAnalyst) await db.insert(notifications).values({ recipientEmail: changes.assignedAnalyst, incidentId: id, type: "Assignment", title: "Incident assigned", message: `${id} has been assigned with an SLA deadline.` });
  const [updated] = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
  return Response.json({ incident: updated });
}
