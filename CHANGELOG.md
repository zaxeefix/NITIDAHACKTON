# Changelog

## 0.3.0 — 2026-09-07

- Renamed the public product to Triage247Ng while retaining legacy internal IDs and environment contracts.
- Added a separate unauthenticated public website and sign-in/account entry flow; all data APIs remain server-authorised.
- Expanded the deterministic dataset to 712 synthetic reports across 14 categories with cluster-separated train/test partitions and an automated leakage assertion.
- Added the weighted explainable severity formula and explicit AI/human-control language.
- Added hackathon traceability, preservation, synthetic-data, deployment, offline-demo, pitch and production-readiness documentation.
- Added GitHub quality workflow and Vercel/Render preparation without deploying or pushing.
- Production dependencies audit clean; development toolchain advisories recorded as residual risk.

## 0.2.0 - 2026-08-25

### Security

- Added central named permissions and Reporter resource ownership checks.
- Added enumerated NIST incident states and transition validation.
- Added tamper-evident hash-linked audit fields and verification.
- Added upload magic-byte validation, filename normalization, SHA-256, quarantine and scan states.
- Added integration ownership/risk/data-sharing/key metadata and delivery dead-letter limits.
- Added local-development production fail-closed condition and visible warning.
- Added security headers, request-size control, mutation origin checks and CSV formula neutralization.
- Added forward migration `0011_nist_security_controls.sql` and security regression tests.

### Documentation

- Added NIST alignment, control/gap evidence, threat/data-flow architecture, governance, privacy, response playbooks, AI risk, recovery, supply-chain and production checklists.

### Known limitations

- Identity session assurance, rate limiting, malware provider, encrypted backup/restore, DNS egress enforcement, retention scheduling and independent assessment remain deployment/institution dependent.
