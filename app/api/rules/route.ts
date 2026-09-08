import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureWorkspaceUser, requireRole } from "../../../db/authorization";
import { auditEntries, routingRules } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

function clean(value: unknown, max = 180) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  await ensureWorkspaceUser(user);
  if (!await requireRole(user, ["Administrator"])) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  return Response.json({ rules: await getDb().select().from(routingRules).orderBy(desc(routingRules.createdAt)).limit(200) });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!await requireRole(user, ["Administrator"])) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const name = clean(body.name), destination = clean(body.destination);
  if (!name || !destination) return Response.json({ error: "Rule name and destination are required" }, { status: 400 });
  const id = crypto.randomUUID();
  const row = { id, name, destination, category: clean(body.category, 80) || "Any", minimumSeverity: clean(body.minimumSeverity, 24) || "Medium", endpointId: clean(body.endpointId, 60) || null, createdBy: user.email };
  const db = getDb();
  await db.insert(routingRules).values(row);
  await db.insert(auditEntries).values({ actorEmail: user.email, action: "Routing rule created", newValue: JSON.stringify(row), reason: "Institutional routing configuration" });
  return Response.json({ rule: row }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!await requireRole(user, ["Administrator"])) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const body = await request.json() as { id?: string; enabled?: boolean };
  if (!body.id || typeof body.enabled !== "boolean") return Response.json({ error: "Rule id and enabled state are required" }, { status: 400 });
  await getDb().update(routingRules).set({ enabled: body.enabled, updatedAt: new Date().toISOString() }).where(eq(routingRules.id, body.id));
  return Response.json({ ok: true });
}
