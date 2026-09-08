import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const incidents = sqliteTable("incidents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  redactedDescription: text("redacted_description").notNull().default(""),
  category: text("category").notNull().default("Unclassified"),
  severity: text("severity").notNull().default("Medium"),
  confidence: real("confidence").notNull().default(0),
  language: text("language").notNull().default("English"),
  department: text("department").notNull().default("Unspecified"),
  affectedSystem: text("affected_system").notNull().default("Unspecified"),
  status: text("status").notNull().default("New"),
  relatedCount: integer("related_count").notNull().default(0),
  indicatorsJson: text("indicators_json").notNull().default("[]"),
  duplicateOf: text("duplicate_of"),
  redactionStatus: text("redaction_status").notNull().default("Pending Review"),
  analysisExplanation: text("analysis_explanation").notNull().default(""),
  reporterEmail: text("reporter_email"),
  assignedAnalyst: text("assigned_analyst"),
  assignedAt: text("assigned_at"),
  slaDueAt: text("sla_due_at"),
  closedAt: text("closed_at"),
  closureSummary: text("closure_summary"),
  dataClassification: text("data_classification").notNull().default("Restricted"),
  retentionUntil: text("retention_until"),
  legalHold: integer("legal_hold", { mode: "boolean" }).notNull().default(false),
  modelVersion: text("model_version").notNull().default("triageng-mnb-v1"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const auditEntries = sqliteTable("audit_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentId: text("incident_id"),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  reason: text("reason"),
  connectionState: text("connection_state").notNull().default("Online"),
  eventId: text("event_id"),
  actorRole: text("actor_role"),
  targetResource: text("target_resource"),
  outcome: text("outcome").notNull().default("Success"),
  requestId: text("request_id"),
  correlationId: text("correlation_id"),
  previousEventHash: text("previous_event_hash"),
  eventHash: text("event_hash"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const routingDecisions = sqliteTable("routing_decisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentId: text("incident_id").notNull(),
  destination: text("destination").notNull(),
  reason: text("reason").notNull(),
  fieldsShared: text("fields_shared").notNull(),
  status: text("status").notNull().default("Pending Approval"),
  approvedBy: text("approved_by"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").notNull(),
  objectKey: text("object_key").notNull(),
  originalName: text("original_name").notNull(),
  normalizedName: text("normalized_name"),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  processingStatus: text("processing_status")
    .notNull()
    .default("Stored — OCR queued"),
  ocrText: text("ocr_text"),
  ocrConfidence: real("ocr_confidence"),
  ocrPageCount: integer("ocr_page_count"),
  ocrIndicatorsJson: text("ocr_indicators_json").notNull().default("[]"),
  detectedPiiCount: integer("detected_pii_count").notNull().default(0),
  uploadedBy: text("uploaded_by").notNull(),
  sha256: text("sha256"),
  scanStatus: text("scan_status").notNull().default("Scan Pending"),
  quarantineStatus: text("quarantine_status").notNull().default("Quarantined"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const workspaceUsers = sqliteTable("workspace_users", {
  email: text("email").primaryKey(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("Reporter"),
  status: text("status").notNull().default("Active"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipientEmail: text("recipient_email"),
  incidentId: text("incident_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  readAt: text("read_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const integrationEndpoints = sqliteTable("integration_endpoints", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  endpointUrl: text("endpoint_url"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("Not Configured"),
  lastTestAt: text("last_test_at"),
  createdBy: text("created_by").notNull(),
  ownerEmail: text("owner_email"),
  approvalStatus: text("approval_status").notNull().default("Pending Approval"),
  riskClassification: text("risk_classification").notNull().default("High"),
  dataSharingDescription: text("data_sharing_description"),
  keyId: text("key_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const routingRules = sqliteTable("routing_rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Any"),
  minimumSeverity: text("minimum_severity").notNull().default("Medium"),
  destination: text("destination").notNull(),
  endpointId: text("endpoint_id"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const deliveryQueue = sqliteTable("delivery_queue", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").notNull(),
  routingDecisionId: integer("routing_decision_id").notNull(),
  endpointId: text("endpoint_id"),
  destination: text("destination").notNull(),
  payloadJson: text("payload_json").notNull(),
  status: text("status").notNull().default("Awaiting Configuration"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  nextAttemptAt: text("next_attempt_at"),
  responseCode: integer("response_code"),
  responseBodyHash: text("response_body_hash"),
  deliveredAt: text("delivered_at"),
  signatureAlgorithm: text("signature_algorithm"),
  maxAttempts: integer("max_attempts").notNull().default(5),
  deadLetteredAt: text("dead_lettered_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const integrationRuns = sqliteTable("integration_runs", {
  id: text("id").primaryKey(),
  providerType: text("provider_type").notNull(),
  operation: text("operation").notNull(),
  status: text("status").notNull(),
  responseCode: integer("response_code"),
  detail: text("detail"),
  initiatedBy: text("initiated_by").notNull(),
  durationMs: integer("duration_ms"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
