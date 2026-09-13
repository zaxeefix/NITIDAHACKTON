import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureWorkspaceUser, type WorkspaceRole } from "../../../db/authorization";
import { workspaceUsers } from "../../../db/schema";
import { authorize, mutationAllowed, writeAudit } from "../../../db/security";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const current = await ensureWorkspaceUser(user);
  if (!await authorize(user, "role:manage")) return Response.json({ users: [{ email: current.email, displayName: current.displayName, role: current.role, status: current.status }], currentRole: current.role, currentUser: { email: current.email, displayName: current.displayName } });
  const users = await getDb().select().from(workspaceUsers).orderBy(asc(workspaceUsers.displayName));
  return Response.json({ users, currentRole: current?.role || "Reporter", currentUser: { email: current.email, displayName: current.displayName } });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!mutationAllowed(request)) return Response.json({ error: "Cross-site mutation rejected" }, { status: 403 });
  const member = await authorize(user, "role:manage");
  if (!member) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const body = await request.json() as { email?: string; role?: WorkspaceRole };
  const roles: WorkspaceRole[] = ["Administrator", "Senior Analyst", "Analyst", "Auditor", "Reporter"];
  const email = String(body.email || "").trim().toLowerCase();
  if (!email || !body.role || !roles.includes(body.role)) return Response.json({ error: "Valid user and role required" }, { status: 400 });
  const db = getDb();
  const [existing] = await db.select().from(workspaceUsers).where(eq(workspaceUsers.email, email)).limit(1);
  if (!existing) return Response.json({ error: "User not found" }, { status: 404 });
  await db.update(workspaceUsers).set({ role: body.role, updatedAt: new Date().toISOString() }).where(eq(workspaceUsers.email, email));
  await writeAudit({ request, user, role: member.role, action: "Workspace role changed", targetResource: `user:${email}`, previousValue: { role: existing.role }, newValue: { role: body.role }, reason: `Role updated for ${email}` });
  return Response.json({ ok: true });
}
