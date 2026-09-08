import { and, eq, lt, notInArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { requireRole } from "../../../db/authorization";
import { auditEntries, incidents, notifications } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function POST() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const member = await requireRole(user, ["Administrator", "Senior Analyst", "Analyst"]);
  if (!member) return Response.json({ error: "Analyst permission required" }, { status: 403 });
  const db = getDb();
  const overdue = await db.select().from(incidents).where(and(lt(incidents.slaDueAt, new Date().toISOString()), notInArray(incidents.status, ["Closed", "Routed", "Escalated"])));
  for (const incident of overdue) {
    await db.update(incidents).set({ status: "Escalated", updatedAt: new Date().toISOString() }).where(eq(incidents.id, incident.id));
    await db.insert(notifications).values({ recipientEmail: incident.assignedAnalyst, incidentId: incident.id, type: "SLA", title: "SLA overdue — escalated", message: `${incident.id} exceeded its ${incident.severity} response target.` });
    await db.insert(auditEntries).values({ incidentId: incident.id, actorEmail: user.email, action: "SLA escalation", previousValue: incident.status, newValue: "Escalated", reason: "Response target exceeded" });
  }
  return Response.json({ escalated: overdue.length });
}
