import { and, desc, eq, isNull, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureWorkspaceUser } from "../../../db/authorization";
import { notifications } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  await ensureWorkspaceUser(user);
  const rows = await getDb().select().from(notifications).where(or(isNull(notifications.recipientEmail), eq(notifications.recipientEmail, user.email))).orderBy(desc(notifications.createdAt)).limit(100);
  return Response.json({ notifications: rows, unread: rows.filter(row => !row.readAt).length });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  await ensureWorkspaceUser(user);
  const body = await request.json() as { id?: number };
  if (!Number.isInteger(body.id)) return Response.json({ error: "Notification id is required" }, { status: 400 });
  await getDb().update(notifications).set({ readAt: new Date().toISOString() }).where(and(eq(notifications.id, body.id!), or(isNull(notifications.recipientEmail), eq(notifications.recipientEmail, user.email))));
  return Response.json({ ok: true });
}
