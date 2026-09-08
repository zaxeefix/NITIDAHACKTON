# Triage247Ng repository threat model

## 1. Overview

Triage247Ng is an AI-assisted cyber-incident intake, triage, privacy reduction, evidence, offline synchronization, and human-approved routing application. The browser uses React, local OCR and IndexedDB. Vinext API routes execute in a Cloudflare Worker, with structured records in D1 and evidence objects in R2. Python generates and evaluates the checked-in classifier artefacts.

| Component | Authority and protected resources | Evidence |
| --- | --- | --- |
| Browser UI/PWA | user input, offline queue, OCR, local drafts | `app/page.tsx`, `app/lib/offline-queue.ts`, `public/sw.js` |
| Identity/authorization | user identity, role and API access | `app/chatgpt-auth.ts`, `db/authorization.ts` |
| API routes | incident/evidence/routing/admin mutations | `app/api/**/route.ts` |
| D1/R2 | authoritative records and evidence bytes | `db/schema.ts`, `db/index.ts`, `.openai/hosting.json` |
| AI/OCR | recommendations, redaction and indicators | `app/lib/triage-model.ts`, `app/lib/privacy.ts`, `app/lib/local-ocr.ts`, `ml/` |
| Integrations | signed outbound payloads and inbound email | `app/api/deliveries/route.ts`, `app/api/email-intake/route.ts` |

## 2. Assets, actors, objectives, and assumptions

Protected assets are original reports/evidence, personal data, privacy-reduced records, user/role integrity, audit-chain integrity, routing approvals, webhook credentials, offline reports, model/dataset versions, and service availability.

Realistic attackers include anonymous internet clients, authenticated low-privilege reporters, compromised analyst sessions, malicious files/report content, spoofed email-provider callers, malicious or compromised webhook destinations, and supply-chain attackers. They do not initially possess administrator authority, provider secrets, D1/R2 credentials, or release-control access.

Security objectives: deny by default; separate identity from authorization; enforce least privilege and resource access; bound input and parsing; never expose original content by default; preserve audit integrity; require human routing/closure decisions; keep AI reversible and advisory; prevent private-network egress; and maintain recoverable records.

Assumptions requiring deployment evidence: TLS and encryption at rest; Sites access policy; identity assurance/MFA; session lifetime and revocation; platform DDoS/rate protection; encrypted backups; approved provider contracts; Nigerian privacy/legal process; independent assessment; and FIPS 140-3 validated modules where mandated.

## 3. Prioritized attacker stories

| Priority | Scenario and capability gain | Existing control | Required mitigation |
| --- | --- | --- | --- |
| High | Reporter/analyst calls a sibling privileged API and gains original evidence, audit, role, export, or routing data | Some role arrays | Central permission and resource checks on every route; deny decision audit |
| High | Spoofed MIME file reaches R2/OCR and triggers unsafe parsing or stores executable content | 10 MB and declared-type allowlist | Magic bytes, filename normalization, executable/archive rejection, hash, quarantine and scan states |
| High | Audit row is altered/deleted without detection | Database access and chronological display | Hash-linked event fields and verification endpoint/test; protect database privileges and backups |
| High | Arbitrary lifecycle string bypasses review/containment/closure expectations | Reason requirement | Enumerated states and allowed transitions with actor/role/evidence audit |
| Medium | Local development identity activates in a production-like runtime | explicit flag | production fail-closed condition, visible warning, automated test |
| Medium | Webhook URL resolves/rebinds to a private address or retries indefinitely | literal IP checks, no redirects, timeout | DNS resolution enforcement where platform supports it, max retries, dead-letter, approval/owner/key ID |
| Medium | CSV export leaks formulas or excessive sensitive records | role check and quoting | separate permissions, audit, resource minimization, spreadsheet formula neutralization |
| Medium | Offline data remains on a shared device or sync is abused | IndexedDB and idempotent ID | retention/clear control, device warning, bounded payload, sync telemetry |
| Medium | AI/OCR error causes severity underestimation or privacy disclosure | explanation and human review | low-confidence escalation, critical mandatory review, model governance/rollback, calibrated evaluation |
| Medium | Email token is replayed for mass intake | constant-time comparison | timestamp, nonce/idempotency, size/rate limit and failure audit |

These are threat hypotheses until validated by tests or source-backed findings. The accompanying gap analysis distinguishes evidence from planned controls.

## 4. Severity calibration

- **Critical:** unauthenticated or low-privilege path to bulk original evidence/credentials or arbitrary control of routing across institutions with no material prerequisite.
- **High:** realistic cross-role access to sensitive records, persistent audit destruction, unsafe evidence execution, or unauthorized external disclosure.
- **Medium:** deployment-dependent SSRF, bounded sensitive disclosure, replay/abuse requiring a secret, or controls that fail only with a compromised analyst session.
- **Low:** limited metadata exposure or nuisance availability impact with strong prerequisites and no privilege gain.

Repository: C:/Users/pc/Desktop/Triage247Ng
Version: pre-hardening-snapshot-2026-08-25

