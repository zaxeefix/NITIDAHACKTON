import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditEntries } from "../../../db/schema";
import { authorize, verifyAuditChain } from "../../../db/security";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!await authorize(user, "audit:read")) return Response.json({ error: "Audit permission required" }, { status: 403 });
  const rows = await getDb().select().from(auditEntries).orderBy(desc(auditEntries.createdAt)).limit(300);
  return Response.json({ auditEntries: rows, integrity: await verifyAuditChain() }, { headers: { "cache-control": "no-store" } });
}
