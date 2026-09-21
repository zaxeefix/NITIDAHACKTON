import { eq } from "drizzle-orm";
import type { ChatGPTUser } from "../app/chatgpt-auth";
import { getDb } from ".";
import { workspaceUsers } from "./schema";
import { configuredAdminEmail } from "../app/native-auth";

export type WorkspaceRole = "Administrator" | "Senior Analyst" | "Analyst" | "Auditor" | "Reporter";

export async function ensureWorkspaceUser(user: ChatGPTUser) {
  const db = getDb();
  const [existing] = await db.select().from(workspaceUsers).where(eq(workspaceUsers.email, user.email)).limit(1);
  const isConfiguredAdministrator = user.email.toLowerCase() === configuredAdminEmail();
  if (existing) {
    if (isConfiguredAdministrator && (existing.role !== "Administrator" || existing.status !== "Active" || existing.displayName !== user.displayName)) {
      await db.update(workspaceUsers).set({ role: "Administrator", status: "Active", displayName: user.displayName, updatedAt: new Date().toISOString() }).where(eq(workspaceUsers.email, user.email));
      const [administrator] = await db.select().from(workspaceUsers).where(eq(workspaceUsers.email, user.email)).limit(1);
      return administrator;
    }
    return existing;
  }
  const [firstUser] = await db.select({ email: workspaceUsers.email }).from(workspaceUsers).limit(1);
  // Bootstrap exactly one administrator. Every later user starts with the
  // least-privileged Reporter role and must be promoted by that administrator.
  const role: WorkspaceRole = isConfiguredAdministrator || !firstUser ? "Administrator" : "Reporter";
  await db.insert(workspaceUsers).values({ email: user.email, displayName: user.displayName, role });
  const [created] = await db.select().from(workspaceUsers).where(eq(workspaceUsers.email, user.email)).limit(1);
  return created;
}

export async function requireRole(user: ChatGPTUser, allowed: WorkspaceRole[]) {
  const member = await ensureWorkspaceUser(user);
  if (!member || !allowed.includes(member.role as WorkspaceRole)) return null;
  return member;
}
