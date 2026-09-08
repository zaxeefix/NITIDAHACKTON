# Triage247Ng security baseline

Baseline date: 25 August 2026

## Scope and method

This baseline covers the current React/TypeScript/Vinext application, Cloudflare Worker, D1 schema, R2 evidence store, browser OCR, IndexedDB offline queue, service worker, Python model tooling, API routes, integrations, and tests. It was recorded before NIST-hardening source changes.

The Codex Security workbench failed while initializing its prompt-only Standard scan and returned no scan identifier or detailed diagnostic. This document therefore records a manual source-backed baseline and does not claim a completed Codex Security scan.

## Verification results

| Check | Baseline result |
| --- | --- |
| `npm.cmd run build` | Passed; 16 API routes and the application route emitted |
| `npm.cmd test` | Passed; 5 of 5 tests |
| `npm.cmd exec tsc -- --noEmit` | Passed |
| `npm.cmd run lint` | 0 errors; 4 React hook dependency warnings in `app/page.tsx` |
| Existing D1 migrations | 11 numbered migrations, `0000` through `0010`; none edited |

## Existing security strengths

- Hosted identity headers or explicitly enabled local-development identity are required.
- Five workspace roles exist and sensitive mutation routes use server-side role checks.
- Drizzle parameterization is used for D1 operations.
- Original and privacy-reduced report text are separated; original reveals are audited.
- External routing requires a Senior Analyst or Administrator and produces a privacy-reduced payload.
- Webhook delivery uses HMAC-SHA256, HTTPS validation, redirect refusal, timeouts, idempotency keys, response hashing, and bounded response capture.
- Email intake compares the shared token without early-exit byte comparison.
- Evidence is stored in R2 with D1 metadata; file size and declared media type are bounded.
- Offline synchronization is idempotent by local reference; API responses are excluded from the service-worker cache.
- AI recommendations require human review, and no route automatically closes an incident.

## Baseline gaps requiring remediation

- Authorization is role-based but not centralized by named permissions and does not consistently enforce resource ownership.
- Local development mode depends on an environment flag but has no explicit production-environment fail-closed test or visible warning.
- Read routes for audit logs, integrations, deliveries, users, and original incident data are broader than least privilege.
- No application session-age, revocation, reauthentication, MFA assurance, login throttling, or failed-login telemetry is available from the current identity boundary.
- Upload validation trusts declared MIME type and extension; it lacks magic-byte verification, quarantine/scan states, hashes in metadata, safe download headers, and evidence deletion workflow.
- Audit records lack event IDs, actor roles, request/correlation IDs, outcomes, target resource, and hash chaining.
- Incident status accepts arbitrary text and does not enforce the requested NIST incident lifecycle transitions.
- Webhook endpoint checks do not resolve DNS, so deployment-level DNS rebinding protection is incomplete; retry count and dead-letter state are absent.
- Retention, legal hold, scheduled deletion, backup/restore evidence, and data-subject workflows are not implemented.
- Security headers, request-size/rate controls, CSRF/origin checks for cookie-authenticated deployment, SBOM, secret scanning, dependency scanning, and security tests are incomplete.
- NIST alignment, governance owners, playbooks, recovery objectives, model governance, and residual risk documentation were absent.

## Baseline risk statement

The current system is suitable for local demonstration and controlled evaluation, not for an unassessed production deployment handling sensitive institutional incidents. Production use requires configured identity assurance, platform security controls, operational policies, independent assessment, backups, monitoring, retention decisions, and approved integrations.

