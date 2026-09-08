# Security test report

Latest test date: 7 September 2026. Target: local Triage247Ng 0.3.0. No destructive production testing was performed.

## Results

| Test | Result | Evidence / limitation |
| --- | --- | --- |
| Baseline production build | Passed | 16 API routes emitted before changes |
| Existing baseline tests | Passed | 5/5 |
| Forward migration | Passed | `0011_nist_security_controls.sql`; 31 statements; rerun reports no migrations pending |
| TypeScript | Passed | `tsc --noEmit` after PDF.js 6 API update |
| Production build after hardening | Passed | Vinext build completed |
| Full automated tests | Passed | 13/13 including 8 security regression checks |
| Lint | Passed with warnings | 0 errors; 4 pre-existing React hook dependency warnings |
| Dependency advisory scan | Passed after remediation | Initial: 5 High; upgraded Next 16.3.3 and PDF.js 6.2.108; final production audit: 0 vulnerabilities |
| Offline secret-pattern scan | Passed | No private-key, common token or populated named-secret pattern found outside excluded generated/runtime folders |
| Reporter attempts analyst transition | Passed | Create 201; privileged PATCH 403 |
| Analyst attempts role administration | Passed | Role-management PATCH 403 |
| Auditor attempts incident modification | Passed | Incident PATCH 403 |
| Cross-user Reporter access | Passed | Reporter saw 1 own record and 0 foreign records |
| Evidence upload | Passed | TXT content signature, SHA-256, Scan Clean and Released state returned |
| Human routing gate | Passed | Privacy approval plus Senior Analyst action; routing decision Approved |
| Audit-chain verification | Passed | 14 chained events valid; 12 pre-upgrade legacy rows reported separately |
| Backup/restore | Passed locally | SQLite copy: integrity `ok`, 13 tables, 5 incidents, 4 security audit columns; restored copy SHA-256 `ede83ac7f242f3f8653f3782b7474d8c06deb89599fc15521a340414ec825560` |
| AI training/evaluation | Passed | 712 records; test 152; cluster leakage 0; accuracy .934; macro F1 .943; severity/routing .941; indicator F1 .769; redaction recall .625; duplicate F1 .889; 10 recorded mistakes |
| Production dependency audit | Passed | `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities |
| Full dependency audit | Residual risk | 14 development/build-tool advisories remain; available automatic remedies require breaking toolchain changes and must be tested as a separate upgrade |
| Production build and automated tests | Passed | Vinext production build succeeded; 14/14 Node tests passed |
| Type check | Passed | `tsc --noEmit` completed without errors |
| Lint | Passed with warnings | 0 errors; four existing React hook dependency warnings remain |
| OCR benchmark regeneration | Blocked | Font portability was fixed; system `tesseract` is not installed. Browser Tesseract.js OCR remains built and preserved |
| Browser smoke test | Passed | Development warning visible; no console errors; Incident Queue, Routing, Integration, Audit, Users and Help loaded |
| Codex Security Standard scan | Blocked | Workbench initialization failed before scan ID/diagnostic; manual source-backed baseline used; no completed-scan claim |

## Covered security cases

Authentication absence is denied by API source and existing route behavior. Named permissions cover original/evidence access, correction, approval, assignment, escalation, routing, closure/reopening, roles, integrations, retries and exports. Tests cover role denial, resource isolation, invalid state/category/severity checks in source, upload type signatures, filename/path normalization, size, audit chain, migration, headers, dead-letter limits, no automatic routing and no automatic closure.

## Incomplete dynamic cases

Deployment WAF/rate limiting; live MFA/session revocation/reauthentication; CSRF under the final hosted cookie model; DNS rebinding with platform resolver; approved malware scanner; inbound webhook replay consumer; retention scheduler/deletion; production encrypted backup restoration; model rollback execution; and full penetration testing require a configured non-production deployment and institutional authorization.

## Residual assessment

Local development acceptance criteria pass. Production approval remains blocked until the Production Security Checklist, institutional policies, deployment identity/network/backup/monitoring controls, malware integration and independent assessment are completed.
