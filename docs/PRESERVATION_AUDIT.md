# Triage247Ng preservation audit

Audit date: 25 August 2026

## Baseline

- Existing Vinext/Vite application preserved; no replacement scaffold is used.
- Local preview responds at `http://localhost:5173/` with D1 (`DB`) and R2
  (`BUCKET`) bindings.
- D1 migrations report no pending migrations. Explorer confirms all application
  tables are present.
- Baseline `npm run build`: blocked on Windows because the script invokes Bash
  through an unavailable/denied WSL service.
- Baseline `npm test`: blocked by the same build prerequisite.
- Direct Node tests: 4 passed, 1 failed because `dist/server/index.js` does not
  exist before a successful production build.
- Baseline desktop (1440 px): no document-level horizontal overflow.
- Baseline mobile (390 px): no document-level horizontal overflow, but the
  sidebar is hidden and no usable mobile navigation replaces it.
- Direct visual inspection of cert.gov.ng was blocked by its bot-verification
  interstitial. Crawlable structure was reviewed instead: institutional header,
  incident-reporting navigation, alerts/advisories, response lifecycle,
  contact/reporting calls to action, resources, and structured footer.

## Screen preservation checklist

- [x] Overview
- [x] Incident Queue
- [x] Submit Report and Submission Confirmation
- [x] Offline Queue
- [x] Incident Detail and Triage Workspace
- [x] Incident Clusters
- [x] Analytics
- [x] Judge Mode
- [x] Management Reports
- [x] Routing Centre
- [x] Integration Centre
- [x] Notifications
- [x] Audit Log
- [x] Users and Roles
- [x] Settings
- [x] Help and Guidance

All screens are selected through the existing client-side workspace state and
must remain connected to their current handlers and API calls.

## API inventory

| Route | Methods | Preserved purpose |
| --- | --- | --- |
| `/api/attachments` | GET, POST, PATCH | R2 evidence metadata, upload, OCR review |
| `/api/audit` | GET | Persistent audit history |
| `/api/deliveries` | GET, PATCH | Delivery queue and controlled retry |
| `/api/email-intake` | POST | Token-authenticated email intake |
| `/api/escalations` | POST | Controlled overdue SLA escalation |
| `/api/evaluation` | GET | Evaluation and dataset downloads |
| `/api/exports` | GET | Incident and audit CSV exports |
| `/api/incidents` | GET, POST, PATCH | Intake, idempotent sync, analyst decisions |
| `/api/integrations` | GET, POST, PATCH | Endpoint registration and enablement |
| `/api/metrics` | GET | Operational dashboard metrics |
| `/api/notifications` | GET, PATCH | Notifications and read state |
| `/api/providers` | GET, POST | Provider readiness and test runs |
| `/api/readiness` | GET | Readiness evidence |
| `/api/routing` | GET, POST | Human-approved routing decisions |
| `/api/rules` | GET, POST, PATCH | Routing rules and enablement |
| `/api/users` | GET, PATCH | Workspace roles and audited role changes |

## Data and storage inventory

Application tables: `incidents`, `attachments`, `audit_entries`,
`routing_decisions`, `workspace_users`, `notifications`,
`integration_endpoints`, `routing_rules`, `delivery_queue`, and
`integration_runs`. Eleven checked-in Drizzle migrations are preserved.

R2 stores evidence separately from D1 metadata. IndexedDB stores offline
reports, cached incidents, and analyst-note drafts. Offline synchronization
retains the local reference and timestamp, stops safely on the first failure,
and uploads evidence only after the incident is accepted.

## Capability preservation checklist

- [x] English and Nigerian Pidgin intake, model labels, and evaluation
- [x] PNG/JPG/PDF/TXT validation and 10 MB upload ceiling
- [x] Tesseract image OCR and PDF.js text/scanned-page extraction (five pages)
- [x] OCR confidence, page count, privacy-reduced text, and human review
- [x] Python-generated Multinomial Naive Bayes artefact and evaluation evidence
- [x] Category, severity, route, confidence, evidence, and limitations
- [x] Analyst correction with minimum rationale and persistent audit record
- [x] Email, phone, institutional-ID, and numeric-ID masking
- [x] Original/redacted comparison and approval gate
- [x] URL, domain, IP, and hash indicators
- [x] Related reports, cluster review, and grouping explanation surfaces
- [x] Assignment, SLA, escalation, closure, reopening, and required reasons
- [x] Human routing approval and privacy-reduced payload preview
- [x] Public HTTPS validation and private/localhost destination blocking
- [x] HMAC-SHA256 signing, receipts, hashes, attempts, and retry scheduling
- [x] Reporter, Analyst, Senior Analyst, Administrator, and Auditor roles
- [x] Server-side least-privilege checks for sensitive operations
- [x] Incident/audit exports and model/readiness evidence downloads
- [x] IndexedDB queue, cached shell, reconnection sync, and local drafts
- [x] Service worker excludes `/api/` responses from caching
- [x] Synthetic dataset, confusion matrix, language metrics, OCR benchmark,
  misclassifications, limitations, and runtime evidence

## Accessibility and responsive baseline

Existing strengths: skip link, semantic headings, labelled global search,
status live region, reduced-motion rule, responsive grids, and scrollable data
tables. Existing risks to correct: text-symbol icons, small touch targets,
hidden mobile navigation, weak focus coverage, table-only compact views, and
limited drawer/modal semantics.

## Design inspiration boundaries

Appropriate inspiration: institutional hierarchy, restrained navy/green
palette, alert/advisory presentation, clear reporting calls to action, concise
security guidance, and a structured information footer. Prohibited and not
used: ngCERT/NCCC/NITDA logos, government seals, copied imagery or wording,
coat of arms, or claims of government ownership or affiliation.
