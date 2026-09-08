import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureWorkspaceUser } from "../../../db/authorization";
import { incidents } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  await ensureWorkspaceUser(user);
  const rows = await getDb().select().from(incidents).orderBy(desc(incidents.createdAt)).limit(1000);
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const open = rows.filter(row => !["Closed", "Routed"].includes(row.status));
  const overdue = open.filter(row => row.slaDueAt && new Date(row.slaDueAt).getTime() < now);
  const assignedToMe = open.filter(row => row.assignedAnalyst === user.email);
  const duplicateCount = rows.filter(row => row.duplicateOf).length;
  const completed = rows.filter(row => ["Closed", "Routed"].includes(row.status));
  const averageMinutes = completed.length ? Math.round(completed.reduce((sum, row) => sum + Math.max(0, new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime()), 0) / completed.length / 60000) : 0;
  return Response.json({ metrics: { awaitingReview: open.filter(row => row.status === "New").length, criticalOpen: open.filter(row => row.severity === "Critical").length, reportsToday: rows.filter(row => row.createdAt.slice(0, 10) === today).length, duplicateCount, overdue: overdue.length, assignedToMe: assignedToMe.length, averageMinutes } });
}
