import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { authorize, canTransition, mutationAllowed, writeAudit } from "../../../db/security";
import { deliveryQueue, incidents, notifications, routingDecisions, routingRules } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!await authorize(user, "routing:approve")) return Response.json({ error: "Routing permission required" }, { status: 403 });
  const rows = await getDb().select().from(routingDecisions).orderBy(desc(routingDecisions.createdAt)).limit(200);
  return Response.json({ routingDecisions: rows });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!mutationAllowed(request)) return Response.json({ error: "Cross-site mutation rejected" }, { status: 403 });
  const member = await authorize(user, "routing:approve");
  if (!member) return Response.json({ error: "Senior Analyst permission required" }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const incidentId = clean(body.incidentId, 40);
  const destination = clean(body.destination, 160);
  const reason = clean(body.reason);
  const fields = Array.isArray(body.fieldsShared) ? body.fieldsShared.map(x => clean(x, 80)).filter(Boolean) : [];
  if (!incidentId || !destination || reason.length < 10 || !fields.length) {
    return Response.json({ error: "Incident, destination, shared fields and a reason are required" }, { status: 400 });
  }
  const db = getDb();
  const [incident] = await db.select().from(incidents).where(eq(incidents.id, incidentId)).limit(1);
  if (!incident) return Response.json({ error: "Incident not found" }, { status: 404 });
  if (incident.redactionStatus !== "Approved") return Response.json({ error: "Privacy review must be approved before routing" }, { status: 409 });
  if (!canTransition(incident.status, "Routing pending approval") && incident.status !== "Routing pending approval") return Response.json({ error: `Incident cannot be routed from ${incident.status}` }, { status: 409 });
  if (incident.status !== "Routing pending approval") {
    await db.update(incidents).set({ status: "Routing pending approval", updatedAt: new Date().toISOString() }).where(eq(incidents.id, incidentId));
    await writeAudit({ request, user, role: member.role, incidentId, action: "Incident status changed", targetResource: `incident:${incidentId}`, previousValue: { status: incident.status }, newValue: { status: "Routing pending approval" }, reason });
  }
  await db.insert(routingDecisions).values({ incidentId, destination, reason, fieldsShared: JSON.stringify(fields), status: "Approved", approvedBy: user.email });
  await db.update(incidents).set({ status: "Routed", updatedAt: new Date().toISOString() }).where(eq(incidents.id, incidentId));
  await writeAudit({ request, user, role: member.role, incidentId, action: "Routing approved", targetResource: `routing:${incidentId}`, previousValue: { status: "Routing pending approval" }, newValue: { status: "Routed", destination, fields }, reason });
  await db.insert(notifications).values({ incidentId, type: "Routing", title: "Routing approved", message: `${incidentId} was approved for ${destination}.` });
  const [created] = await db.select().from(routingDecisions).orderBy(desc(routingDecisions.id)).limit(1);
  const rules = await db.select().from(routingRules).where(eq(routingRules.enabled, true));
  const severityRank: Record<string, number> = { Informational: 0, Low: 1, Medium: 2, High: 3, Critical: 4 };
  const rule = rules.find(item => (item.category === "Any" || item.category === incident.category) && (severityRank[incident.severity] || 0) >= (severityRank[item.minimumSeverity] || 0));
  const payload = { schemaVersion: "1.0", incident: { id: incident.id, category: incident.category, severity: incident.severity, confidence: incident.confidence, redactedDescription: incident.redactedDescription, indicators: JSON.parse(incident.indicatorsJson || "[]") }, routing: { destination, approvedBy: user.email, approvedAt: new Date().toISOString(), fields } };
  await db.insert(deliveryQueue).values({ id: crypto.randomUUID(), incidentId, routingDecisionId: created.id, endpointId: rule?.endpointId || null, destination: rule?.destination || destination, payloadJson: JSON.stringify(payload), status: rule?.endpointId ? "Awaiting Credential Validation" : "Awaiting Configuration" });
  return Response.json({ routingDecision: created }, { status: 201 });
}
