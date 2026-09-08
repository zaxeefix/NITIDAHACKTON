# Triage247Ng asset inventory

Inventory date: 25 August 2026

## Product surfaces

Overview; Incident Queue; Submit Report; confirmation; Offline Queue; Incident Detail; Incident Clusters; Analytics; Judge Mode; Management Reports; Routing Centre; Integration Centre; Notifications; Audit Log; Users and Roles; Settings; Help.

## API inventory

| Route | Methods | Sensitive function |
| --- | --- | --- |
| `/api/incidents` | GET, POST, PATCH | Report intake, original/redacted data, classification and lifecycle changes |
| `/api/attachments` | GET, POST, PATCH | Evidence metadata, R2 upload, OCR review |
| `/api/audit` | GET | Audit history |
| `/api/routing` | GET, POST | Human routing approval and delivery creation |
| `/api/deliveries` | GET, PATCH | Delivery status and controlled webhook retry |
| `/api/integrations` | GET, POST, PATCH | Endpoint registration and enablement |
| `/api/rules` | GET, POST, PATCH | Routing-rule administration |
| `/api/providers` | GET, POST | Provider readiness and connection test |
| `/api/users` | GET, PATCH | Membership and role administration |
| `/api/exports` | GET | Incident/audit CSV export |
| `/api/notifications` | GET, PATCH | Notifications and read state |
| `/api/metrics` | GET | Operational metrics |
| `/api/escalations` | POST | SLA escalation |
| `/api/email-intake` | POST | Shared-token inbound email report |
| `/api/evaluation` | GET | Model/dataset evidence downloads |
| `/api/readiness` | GET | Readiness evidence |

## D1 tables and principal data

| Table | Principal fields | Baseline sensitivity |
| --- | --- | --- |
| `incidents` | original/redacted narrative, category, severity, confidence, reporter, owner, SLA, closure | High confidentiality and integrity; Moderate availability |
| `attachments` | object key, filename, type, size, OCR text/confidence/indicators, uploader | High C/I; Moderate A |
| `audit_entries` | actor, action, before/after, reason, connection state | High integrity; Moderate C/A |
| `routing_decisions` | destination, reason, shared fields, approver | High integrity/confidentiality |
| `workspace_users` | email, display name, role, status | High integrity; Moderate C/A |
| `notifications` | recipient, incident, operational messages | Moderate C/I/A |
| `integration_endpoints` | endpoint URL/type/state/creator | High integrity; Moderate confidentiality |
| `routing_rules` | category/severity matching and destination | High integrity |
| `delivery_queue` | privacy-reduced payload, endpoint, attempts, receipts/hashes | High C/I; Moderate A |
| `integration_runs` | provider operation, status, response, initiator | Moderate C/I/A |

## Other stored assets

- R2: uploaded PNG, JPEG, PDF, and TXT evidence objects.
- IndexedDB: offline reports, cached incident records, queued evidence, and synchronization metadata.
- Browser local state: analyst-note drafts and service-worker application shell cache.
- Repository model assets: `model-artifact.json`, evaluation JSON, labelled English/Pidgin reports, OCR benchmark data, Python training/evaluation scripts.
- Generated exports: incident CSV and audit CSV.
- Configuration/secrets: local-development flags, email intake token, webhook signing secret, optional provider URLs/tokens, D1/R2 bindings.

## Roles and baseline privilege

Reporter creates reports. Analyst reviews and changes incidents. Senior Analyst adds routing, escalation, closure/reopening and role administration in the baseline. Administrator configures integrations and roles. Auditor reads evidence/reporting surfaces. The hardening phase must replace route-specific role arrays with a central permission matrix and narrower resource rules.

## External and platform dependencies

- OpenAI Sites/dispatch identity headers and hosting access policy.
- Cloudflare Worker runtime, D1, and R2.
- Optional email intake provider, webhook destinations, OCR provider, and threat-intelligence provider.
- npm dependencies in `package-lock.json`; Python uses standard-library training/evaluation code.

