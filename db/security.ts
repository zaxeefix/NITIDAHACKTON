import { desc, eq, isNotNull } from "drizzle-orm";
import type { ChatGPTUser } from "../app/chatgpt-auth";
import { getDb } from ".";
import { auditEntries, incidents, workspaceUsers } from "./schema";
import type { WorkspaceRole } from "./authorization";

export type Permission =
  | "incident:create" | "incident:read" | "incident:read-original" | "incident:correct"
  | "incident:assign" | "incident:escalate" | "incident:close" | "incident:reopen"
  | "redaction:approve" | "evidence:read" | "evidence:upload" | "evidence:delete"
  | "routing:approve" | "integration:manage" | "delivery:retry" | "role:manage"
  | "audit:read" | "incident:export" | "audit:export" | "retention:manage"
  | "model:manage" | "notification:read" | "analytics:read";

const all: Permission[] = ["incident:create","incident:read","incident:read-original","incident:correct","incident:assign","incident:escalate","incident:close","incident:reopen","redaction:approve","evidence:read","evidence:upload","evidence:delete","routing:approve","integration:manage","delivery:retry","role:manage","audit:read","incident:export","audit:export","retention:manage","model:manage","notification:read","analytics:read"];

export const permissionMatrix: Record<WorkspaceRole, readonly Permission[]> = {
  Administrator: all,
  "Senior Analyst": all.filter(value => !["model:manage","retention:manage","role:manage","integration:manage","delivery:retry"].includes(value)),
  Analyst: ["incident:create","incident:read","incident:read-original","incident:correct","incident:assign","incident:close","redaction:approve","evidence:read","evidence:upload","notification:read","analytics:read"],
  Auditor: ["incident:read","evidence:read","audit:read","incident:export","audit:export","analytics:read"],
  Reporter: ["incident:create","incident:read","evidence:upload","notification:read"],
};

export const incidentStates = ["Submitted","Locally saved","Sync pending","Awaiting review","Assigned","In triage","Confirmed","Investigating","Containment in progress","Eradication in progress","Recovery in progress","Routing pending approval","Routed","Monitoring","Resolved","Closed","Reopened","False positive"] as const;
export type IncidentState = typeof incidentStates[number];

const transitions: Record<IncidentState, readonly IncidentState[]> = {
  "Submitted": ["Awaiting review","Assigned","False positive"],
  "Locally saved": ["Sync pending"], "Sync pending": ["Submitted"],
  "Awaiting review": ["Assigned","In triage","False positive"],
  "Assigned": ["In triage","Investigating"], "In triage": ["Confirmed","Investigating","False positive"],
  "Confirmed": ["Investigating","Containment in progress"],
  "Investigating": ["Containment in progress","Routing pending approval","Resolved","False positive"],
  "Containment in progress": ["Eradication in progress","Recovery in progress"],
  "Eradication in progress": ["Recovery in progress"], "Recovery in progress": ["Monitoring","Resolved"],
  "Routing pending approval": ["Routed","Investigating"], "Routed": ["Monitoring","Resolved"],
  "Monitoring": ["Resolved","Reopened"], "Resolved": ["Closed","Reopened"],
  "Closed": ["Reopened"], "Reopened": ["Assigned","In triage","Investigating"], "False positive": ["Closed","Reopened"],
};

export function canTransition(from: string, to: string) {
  return incidentStates.includes(from as IncidentState) && incidentStates.includes(to as IncidentState) && transitions[from as IncidentState].includes(to as IncidentState);
}

export async function authorize(user: ChatGPTUser, permission: Permission, incidentId?: string) {
  const db = getDb();
  const [member] = await db.select().from(workspaceUsers).where(eq(workspaceUsers.email, user.email)).limit(1);
  if (!member || member.status !== "Active" || !permissionMatrix[member.role as WorkspaceRole]?.includes(permission)) return null;
  if (incidentId && member.role === "Reporter") {
    const [incident] = await db.select({ reporterEmail: incidents.reporterEmail }).from(incidents).where(eq(incidents.id, incidentId)).limit(1);
    if (!incident || incident.reporterEmail !== user.email) return null;
  }
  return member;
}

export function requestContext(request?: Request) {
  const safe = (value: string | null) => value && /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : null;
  return {
    requestId: safe(request?.headers.get("x-request-id") || null) || crypto.randomUUID(),
    correlationId: safe(request?.headers.get("x-correlation-id") || null) || crypto.randomUUID(),
    connectionState: request?.headers.get("x-triageng-connection") === "Offline" ? "Offline" : "Online",
  };
}

function stable(value: unknown) { return JSON.stringify(value, Object.keys(value as object).sort()); }
async function sha256(value: string) { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))].map(v => v.toString(16).padStart(2,"0")).join(""); }

export async function writeAudit(input: { request?: Request; user: ChatGPTUser; role?: string; action: string; targetResource: string; incidentId?: string | null; previousValue?: unknown; newValue?: unknown; reason?: string | null; outcome?: string; }) {
  const db = getDb();
  const [last] = await db.select({ eventHash: auditEntries.eventHash }).from(auditEntries).where(isNotNull(auditEntries.eventHash)).orderBy(desc(auditEntries.id)).limit(1);
  const ctx = requestContext(input.request), eventId = crypto.randomUUID(), createdAt = new Date().toISOString();
  const previousEventHash = last?.eventHash || "GENESIS";
  const record = { eventId, createdAt, actorEmail: input.user.email, actorRole: input.role || "Unknown", action: input.action, targetResource: input.targetResource, incidentId: input.incidentId || null, previousValue: input.previousValue ?? null, newValue: input.newValue ?? null, reason: input.reason || null, outcome: input.outcome || "Success", requestId: ctx.requestId, correlationId: ctx.correlationId, connectionState: ctx.connectionState, previousEventHash };
  const eventHash = await sha256(`${previousEventHash}.${stable(record)}`);
  await db.insert(auditEntries).values({ ...record, previousValue: record.previousValue == null ? null : JSON.stringify(record.previousValue), newValue: record.newValue == null ? null : JSON.stringify(record.newValue), eventHash });
  return { eventId, eventHash, ...ctx };
}

export async function verifyAuditChain() {
  const rows = await getDb().select().from(auditEntries).orderBy(auditEntries.id);
  let previous = "GENESIS";
  for (const row of rows) {
    if (!row.eventId || !row.eventHash) { previous = row.eventHash || previous; continue; }
    if (row.previousEventHash !== previous) return { valid: false, brokenAt: row.eventId };
    const record = { eventId: row.eventId, createdAt: row.createdAt, actorEmail: row.actorEmail, actorRole: row.actorRole || "Unknown", action: row.action, targetResource: row.targetResource, incidentId: row.incidentId, previousValue: row.previousValue ? JSON.parse(row.previousValue) : null, newValue: row.newValue ? JSON.parse(row.newValue) : null, reason: row.reason, outcome: row.outcome, requestId: row.requestId, correlationId: row.correlationId, connectionState: row.connectionState, previousEventHash: row.previousEventHash };
    const expected = await sha256(`${previous}.${stable(record)}`);
    if (expected !== row.eventHash) return { valid: false, brokenAt: row.eventId };
    previous = row.eventHash;
  }
  return { valid: true, checked: rows.filter(row => row.eventId && row.eventHash).length, legacy: rows.filter(row => !row.eventId || !row.eventHash).length, head: previous };
}

export function mutationAllowed(request: Request) {
  const origin = request.headers.get("origin"), site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") return false;
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export function requestWithinLimit(request: Request, maxBytes = 1_048_576) {
  const value = Number(request.headers.get("content-length") || 0);
  return Number.isFinite(value) && value <= maxBytes;
}
