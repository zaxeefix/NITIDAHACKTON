import { eq } from "drizzle-orm";
import type { ChatGPTUser } from "../app/chatgpt-auth";
import { getDb } from ".";
import { workspaceUsers } from "./schema";

export type WorkspaceRole = "Administrator" | "Senior Analyst" | "Analyst" | "Auditor" | "Reporter";

export async function ensureWorkspaceUser(user: ChatGPTUser) {
  const db = getDb();
  const [existing] = await db.select().from(workspaceUsers).where(eq(workspaceUsers.email, user.email)).limit(1);
  if (existing) return existing;
  const [firstUser] = await db.select({ email: workspaceUsers.email }).from(workspaceUsers).limit(1);
  const role: WorkspaceRole = firstUser ? "Reporter" : "Senior Analyst";
  await db.insert(workspaceUsers).values({ email: user.email, displayName: user.displayName, role });
  const [created] = await db.select().from(workspaceUsers).where(eq(workspaceUsers.email, user.email)).limit(1);
  return created;
}

export async function requireRole(user: ChatGPTUser, allowed: WorkspaceRole[]) {
  const member = await ensureWorkspaceUser(user);
  if (!member || !allowed.includes(member.role as WorkspaceRole)) return null;
  return member;
}
