import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { authorize, writeAudit } from "../../../db/security";
import { auditEntries, incidents } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

function csvCell(value: unknown) {
  const raw = value == null ? "" : String(value);
  const text = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${text.replace(/"/g, '""')}"`;
}

function csv(rows: unknown[][]) {
  return rows.map(row => row.map(csvCell).join(",")).join("\r\n");
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const type = new URL(request.url).searchParams.get("type") || "incidents";
  const permission = type === "audit" ? "audit:export" : "incident:export";
  const member = await authorize(user, permission);
  if (!member) return Response.json({ error: "Export permission required" }, { status: 403 });
  const db = getDb();
  let output: string;
  let filename: string;
  if (type === "audit") {
    const rows = await db.select().from(auditEntries).orderBy(desc(auditEntries.createdAt)).limit(5000);
    output = csv([["Time", "Actor", "Action", "Incident", "Reason", "Previous", "New", "Connection"], ...rows.map(row => [row.createdAt, row.actorEmail, row.action, row.incidentId, row.reason, row.previousValue, row.newValue, row.connectionState])]);
    filename = "triageng-audit-log.csv";
  } else {
    const rows = await db.select().from(incidents).orderBy(desc(incidents.createdAt)).limit(5000);
    output = csv([["Incident ID", "Title", "Category", "Severity", "Confidence", "Department", "Affected System", "Status", "Assigned Analyst", "SLA Due", "Created", "Closed", "Closure Summary"], ...rows.map(row => [row.id, row.title, row.category, row.severity, row.confidence, row.department, row.affectedSystem, row.status, row.assignedAnalyst, row.slaDueAt, row.createdAt, row.closedAt, row.closureSummary])]);
    filename = "triageng-incidents.csv";
  }
  await writeAudit({ request, user, role: member.role, action: type === "audit" ? "Audit export generated" : "Incident export generated", targetResource: `export:${type}`, newValue: { filename, recordLimit: 5000 }, reason: "Authorized operational export" });
  return new Response(output, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
