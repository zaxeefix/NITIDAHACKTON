import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureWorkspaceUser } from "../../../db/authorization";
import { authorize, mutationAllowed, writeAudit } from "../../../db/security";
import {
  attachments,
  incidents,
  notifications,
} from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";
import { reducePersonalInformation } from "../../lib/privacy";
import { analyseIncident } from "../../lib/triage-model";

const allowedTypes = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
  "text/plain",
]);

function processText(text: string) {
  const result = reducePersonalInformation(text);
  return {
    redacted: result.redacted.slice(0, 20000),
    piiCount: result.detectedCount,
  };
}

function extractIndicators(text: string) {
  const values = new Set<string>();
  for (const pattern of [
    /https?:\/\/[^\s<>'"]+/gi,
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    /\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+\b/gi,
    /\b[A-F0-9]{32,64}\b/gi,
  ])
    for (const match of text.match(pattern) || []) values.add(match);
  return [...values].slice(0, 30);
}

function hex(buffer: ArrayBuffer) { return [...new Uint8Array(buffer)].map(value => value.toString(16).padStart(2, "0")).join(""); }
async function sha256(buffer: ArrayBuffer) { return hex(await crypto.subtle.digest("SHA-256", buffer)); }
function detectedType(bytes: ArrayBuffer) {
  const data = new Uint8Array(bytes), start = [...data.slice(0, 12)];
  if (start[0] === 0x89 && start[1] === 0x50 && start[2] === 0x4e && start[3] === 0x47) return "image/png";
  if (start[0] === 0xff && start[1] === 0xd8 && start[2] === 0xff) return "image/jpeg";
  if (String.fromCharCode(...start.slice(0, 5)) === "%PDF-") return "application/pdf";
  if (!data.slice(0, 4096).some(value => value === 0 || value < 9 || (value > 13 && value < 32))) return "text/plain";
  return "application/octet-stream";
}
function normalizeName(name: string) {
  const base = name.normalize("NFKC").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/\.{2,}/g, ".").replace(/^\.+/, "").slice(-100);
  return base || "evidence";
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  await ensureWorkspaceUser(user);
  const incidentId = new URL(request.url).searchParams
    .get("incidentId")
    ?.slice(0, 40);
  if (!incidentId)
    return Response.json({ error: "Incident id is required" }, { status: 400 });
  if (!await authorize(user, "evidence:read", incidentId))
    return Response.json({ error: "Evidence permission required" }, { status: 403 });
  const rows = await getDb()
    .select({
      id: attachments.id,
      incidentId: attachments.incidentId,
      originalName: attachments.originalName,
      contentType: attachments.contentType,
      sizeBytes: attachments.sizeBytes,
      processingStatus: attachments.processingStatus,
      ocrText: attachments.ocrText,
      ocrConfidence: attachments.ocrConfidence,
      ocrPageCount: attachments.ocrPageCount,
      ocrIndicatorsJson: attachments.ocrIndicatorsJson,
      detectedPiiCount: attachments.detectedPiiCount,
      createdAt: attachments.createdAt,
    })
    .from(attachments)
    .where(eq(attachments.incidentId, incidentId))
    .orderBy(desc(attachments.createdAt));
  return Response.json({ attachments: rows });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!mutationAllowed(request))
    return Response.json({ error: "Cross-site mutation rejected" }, { status: 403 });
  const body = (await request.json()) as {
    attachmentId?: string;
    text?: string;
    confidence?: number;
    pageCount?: number;
    engine?: string;
  };
  const attachmentId = String(body.attachmentId || "").slice(0, 80);
  const rawText = String(body.text || "")
    .trim()
    .slice(0, 20000);
  const confidence = Math.max(0, Math.min(100, Number(body.confidence) || 0));
  const pageCount = Math.max(
    1,
    Math.min(5, Math.round(Number(body.pageCount) || 1)),
  );
  const engine = String(body.engine || "Local OCR").slice(0, 40);
  if (!attachmentId || !rawText)
    return Response.json(
      { error: "Attachment and extracted text are required" },
      { status: 400 },
    );
  const db = getDb();
  const [attachment] = await db
    .select({
      id: attachments.id,
      incidentId: attachments.incidentId,
      originalName: attachments.originalName,
    })
    .from(attachments)
    .where(eq(attachments.id, attachmentId))
    .limit(1);
  if (!attachment)
    return Response.json({ error: "Attachment not found" }, { status: 404 });
  const member = await authorize(user, "incident:correct", attachment.incidentId);
  if (!member)
    return Response.json({ error: "Evidence review permission required" }, { status: 403 });
  const privacy = processText(rawText);
  const indicators = extractIndicators(rawText);
  const [incident] = await db
    .select({
      description: incidents.description,
      indicatorsJson: incidents.indicatorsJson,
    })
    .from(incidents)
    .where(eq(incidents.id, attachment.incidentId))
    .limit(1);
  const analysis = analyseIncident(
    `${incident?.description || ""}\n${rawText}`,
  );
  let existingIndicators: string[] = [];
  try {
    existingIndicators = JSON.parse(incident?.indicatorsJson || "[]");
  } catch {
    /* retain an empty safe fallback */
  }
  const combinedIndicators = [
    ...new Set([...existingIndicators, ...indicators]),
  ].slice(0, 50);
  const processingStatus =
    confidence < 60
      ? "OCR complete — low confidence, review required"
      : "OCR complete — privacy scan complete";
  await db
    .update(attachments)
    .set({
      processingStatus,
      ocrText: privacy.redacted,
      ocrConfidence: confidence,
      ocrPageCount: pageCount,
      ocrIndicatorsJson: JSON.stringify(indicators),
      detectedPiiCount: privacy.piiCount,
      scanStatus: "Scan Clean",
      quarantineStatus: "Released",
    })
    .where(eq(attachments.id, attachmentId));
  await db
    .update(incidents)
    .set({
      category: analysis.category,
      severity: analysis.severity,
      confidence: analysis.confidence,
      indicatorsJson: JSON.stringify(combinedIndicators),
      analysisExplanation: `${analysis.model} re-analysed the report with privacy-scanned evidence text. Evidence: ${analysis.evidence.join(", ") || "no strong known token"}. ${engine} confidence was ${confidence}% across ${pageCount} page${pageCount === 1 ? "" : "s"}. Human review is required.`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(incidents.id, attachment.incidentId));
  await writeAudit({
    request, user, role: member.role, incidentId: attachment.incidentId,
    action: "Local evidence OCR processed", targetResource: `attachment:${attachmentId}`,
    newValue: {
      attachmentId,
      confidence,
      pageCount,
      engine,
      detectedPiiCount: privacy.piiCount,
      indicatorCount: indicators.length,
      recommendedCategory: analysis.category,
      recommendedSeverity: analysis.severity,
    }, reason: "Device-local OCR result reviewed",
  });
  await db.insert(notifications).values({
    recipientEmail: user.email,
    incidentId: attachment.incidentId,
    type: "Evidence",
    title: "Evidence OCR ready for review",
    message: `${attachment.originalName}: ${processingStatus} (${pageCount} page${pageCount === 1 ? "" : "s"})`,
  });
  return Response.json({
    attachment: {
      id: attachmentId,
      processingStatus,
      ocrText: privacy.redacted,
      ocrConfidence: confidence,
      ocrPageCount: pageCount,
      ocrIndicatorsJson: JSON.stringify(indicators),
      detectedPiiCount: privacy.piiCount,
    },
  });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!mutationAllowed(request))
    return Response.json({ error: "Cross-site mutation rejected" }, { status: 403 });
  if (!env.BUCKET)
    return Response.json(
      { error: "Evidence storage is unavailable" },
      { status: 503 },
    );
  const form = await request.formData();
  const incidentId = String(form.get("incidentId") || "")
    .trim()
    .slice(0, 40);
  const file = form.get("file");
  if (!incidentId || !(file instanceof File))
    return Response.json(
      { error: "Incident and file are required" },
      { status: 400 },
    );
  const member = await authorize(user, "evidence:upload", incidentId);
  if (!member)
    return Response.json({ error: "Evidence upload permission required" }, { status: 403 });
  if (!allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024)
    return Response.json(
      { error: "Use PNG, JPG, PDF or TXT files up to 10 MB" },
      { status: 400 },
    );
  const db = getDb();
  const [incident] = await db
    .select({ id: incidents.id })
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .limit(1);
  if (!incident)
    return Response.json({ error: "Incident not found" }, { status: 404 });
  const id = crypto.randomUUID();
  const safeName = normalizeName(file.name);
  const objectKey = `incidents/${incidentId}/${id}-${safeName}`;
  const bytes = await file.arrayBuffer();
  const actualType = detectedType(bytes);
  if (actualType !== file.type || !allowedTypes.has(actualType))
    return Response.json({ error: "File content does not match the permitted type" }, { status: 400 });
  const digest = await sha256(bytes);
  await env.BUCKET.put(objectKey, bytes, {
    httpMetadata: { contentType: file.type },
  });
  const textResult =
    file.type === "text/plain"
      ? processText(new TextDecoder().decode(bytes))
      : null;
  const processingStatus = textResult
    ? "Text extracted — privacy scan complete"
    : file.type.startsWith("image/") || file.type === "application/pdf"
      ? "Stored — ready for local OCR"
      : "Stored — processing required";
  const scanStatus = textResult ? "Scan Clean" : "Scan Pending";
  const quarantineStatus = textResult ? "Released" : "Quarantined";
  await db.insert(attachments).values({
    id,
    incidentId,
    objectKey,
    originalName: file.name.slice(0, 180),
    normalizedName: safeName,
    contentType: file.type,
    sizeBytes: file.size,
    uploadedBy: user.email,
    processingStatus,
    ocrText: textResult?.redacted,
    detectedPiiCount: textResult?.piiCount || 0,
    sha256: digest,
    scanStatus,
    quarantineStatus,
  });
  await writeAudit({
    request, user, role: member.role, incidentId, action: "Evidence uploaded",
    targetResource: `attachment:${id}`, newValue: {
      attachmentId: id,
      normalizedName: safeName,
      contentType: actualType,
      sizeBytes: file.size,
      sha256: digest,
      scanStatus,
      quarantineStatus,
    }, reason: "Evidence intake",
  });
  await db.insert(notifications).values({
    recipientEmail: user.email,
    incidentId,
    type: "Evidence",
    title: "Evidence processed",
    message: `${file.name}: ${processingStatus}`,
  });
  return Response.json(
    {
      attachment: {
        id,
        incidentId,
        originalName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        processingStatus,
        detectedPiiCount: textResult?.piiCount || 0,
        sha256: digest,
        scanStatus,
        quarantineStatus,
      },
    },
    { status: 201 },
  );
}
