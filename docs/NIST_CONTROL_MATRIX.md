# NIST control and outcome matrix

Review date: 25 August 2026. Status values are evidence-based and do not assert certification.

| Publication / ID | Title / applicability | Triage247Ng implementation and evidence | Source / API / table / config / test | Owner | Status | Residual gap / remediation |
| --- | --- | --- | --- | --- | --- | --- |
| CSF 2.0 GV.OC | Organizational context | System, data, risk and model roles documented | `docs/SECURITY_GOVERNANCE.md` | Risk Owner | Requires institutional policy | Name/approve owners |
| CSF 2.0 GV.RM | Risk management strategy | Threat/gap/residual-risk and exception procedure | `docs/THREAT_MODEL.md`, `docs/RESIDUAL_RISKS.md` | Risk Owner | Partially implemented | Maintain risk register and approvals |
| CSF 2.0 GV.SC | Supply chain | dependency lock, SBOM and provider policy | `package-lock.json`, `sbom.spdx.json`, `docs/SUPPLY_CHAIN_RISK.md` | System Owner | Partially implemented | Provenance, vendor evidence, recurring scans |
| CSF 2.0 ID.AM | Asset management | screen/API/table/data/provider inventory | `docs/ASSET_INVENTORY.md` | System Owner | Implemented | Quarterly update |
| CSF 2.0 ID.RA | Risk assessment | repository threat/gap assessment | `docs/THREAT_MODEL.md`, `docs/NIST_GAP_ANALYSIS.md` | Risk Owner | Partially implemented | Institutional likelihood/impact approval |
| CSF 2.0 PR.AA | Identity/access | active membership, named permission, resource check | `db/security.ts`; critical API routes; security tests | System Owner | Partially implemented | Session/MFA/reauth are platform configured |
| SP 800-53 AC-3 | Access enforcement | server-side permission matrix | `db/security.ts`; `/api/incidents`, `/api/audit`, `/api/users` | System Owner | Partially implemented | Complete every read route and tenant policy |
| SP 800-53 AC-6 | Least privilege | role permissions and original/evidence gates | `docs/ACCESS_CONTROL_MATRIX.md` | Data Owner | Partially implemented | Review Senior Analyst legacy role management |
| SP 800-63-4 | Digital identity | dispatch identity; local mode explicit dev-only | `app/chatgpt-auth.ts`, `local.env.example`, tests | Identity Owner | Requires deployment configuration | Select IAL/AAL/FAL, MFA, recovery, expiry/revocation |
| SP 800-207 | Zero trust | identity, active role, permission, resource and request checks | `db/security.ts`, `docs/SECURITY_ARCHITECTURE.md` | System Owner | Partially implemented | Device/session risk signals and continuous evaluation |
| SP 800-53 SI-10 | Input validation | bounded strings, enums, origin/size and upload signatures | APIs, `worker/index.ts`, tests | Engineering | Partially implemented | Central schemas and rate limits |
| SP 800-53 SI-3 | Malicious code protection | evidence quarantine and scan-state integration point | `attachments.scan_status`, `quarantine_status` | Security Owner | Planned | Approved malware scanner and fail-closed release |
| SP 800-53 AU-2/AU-3 | Event logging/content | sensitive actions and rich event fields | `db/security.ts`, `audit_entries` | Auditor | Partially implemented | Convert remaining legacy audit writers |
| SP 800-53 AU-10 / SP 800-92 | Non-repudiation/log integrity | hash-linked chain and verifier | `writeAudit`, `verifyAuditChain`, `/api/audit`, test | Auditor | Implemented | Protect verifier/head externally and monitor |
| SP 800-53 SC-8/SC-13 | Transmission/crypto | HTTPS-required integrations and WebCrypto HMAC/SHA-256 | `/api/deliveries` | Integration Owner | Requires deployment configuration | TLS proof and FIPS 140-3 validation if required |
| SP 800-53 SC-7 | Boundary protection | literal private-address blocking, no redirects, timeout | integrations/deliveries/providers APIs | System Owner | Partially implemented | DNS resolution/rebinding and egress allowlist |
| SP 800-122 / PT-3 | PII processing/minimization | privacy reduction, original permission, PIA and minimum routing | `app/lib/privacy.ts`, incident/routing APIs | Data Owner | Partially implemented | NDPA lawful basis, subject workflows, representative testing |
| Privacy Framework CT.DP | Data processing management | classification, retention/legal hold and disposal procedure | schema migration, retention policy | Data Owner | Partially implemented | Scheduler and deletion endpoint/test |
| SP 800-61r3 / CSF RS | Incident response | enumerated lifecycle, audit transitions, playbooks | `db/security.ts`, incident/routing APIs, IR docs/tests | Incident Commander | Partially implemented | UI transition controls and exercise evidence |
| CSF 2.0 DE.CM | Continuous monitoring | audit, notifications, delivery failures | audit/notifications/deliveries APIs | Security Owner | Partially implemented | auth/denial/export/backup/sync alert rules |
| CSF 2.0 RC.RP | Recovery plan | RPO/RTO, restore steps and DR plan | backup and DR documents | Recovery Owner | Requires deployment configuration | Automated encrypted backups and successful restore evidence |
| AI RMF GOVERN | AI governance | intended/prohibited use, owner/change/rollback policy | model card and AI risk assessment | Model Owner | Requires institutional policy | Name owner and approve thresholds |
| AI RMF MAP/MEASURE | AI risks and measurement | synthetic evaluation, language/OCR/error analysis | `app/data/*evaluation.json`, `ml/` | Model Owner | Partially implemented | production calibration and independent validation |
| AI RMF MANAGE | Human control | correction rationale; no auto route/close; critical review policy | incident/routing APIs and tests | Incident Commander | Partially implemented | low-confidence UI escalation/monitoring |
| SP 800-218 PO/PS/PW/RV | Secure development | lockfile, build/type/lint/test, SBOM, policies/checklist | package scripts, tests, secure-development docs | Engineering | Partially implemented | CI secret/SAST/dependency scan and signed provenance |
| SP 800-40r4 | Patch management | inventory, prioritization, testing and exception policy | `docs/PATCH_MANAGEMENT.md` | System Owner | Requires institutional policy | Operational cadence/evidence |
| SP 800-115 | Security testing | static security tests and non-production rule | `tests/security-controls.test.mjs`, test report | Security Owner | Partially implemented | Dynamic penetration/rate/replay/restore tests |
| FIPS 199/200 | Categorization/minimum security | preliminary Moderate system, High C/I assets | `docs/DATA_CLASSIFICATION.md` | Risk Owner | Requires institutional policy | Approve impact levels and tailored control baseline |
| FIPS 140-3 | Cryptographic modules | algorithms use WebCrypto | Worker runtime | System Owner | Requires independent assessment | Verify validated module/certificate when mandated |

Operational evidence: successful build/tests/type check, migration application, local API workflow and restore verification are recorded in `docs/SECURITY_TEST_REPORT.md`. No row marked Implemented relies only on intended policy.

