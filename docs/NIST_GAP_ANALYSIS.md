# Triage247Ng NIST gap analysis

Assessment date: 25 August 2026

## Correct alignment statement

Triage247Ng is designed to align with selected NIST cybersecurity, incident-response, identity, privacy, secure-development and AI-risk-management guidance. Final compliance depends on deployment configuration, institutional procedures, independent assessment and continuing monitoring.

NIST alignment does not replace the Nigeria Data Protection Act 2023, NDPC requirements or institutional policies.

## Publications used

| Publication | Revision/date | Official URL |
| --- | --- | --- |
| NIST Cybersecurity Framework | CSF 2.0, 26 February 2024 | https://doi.org/10.6028/NIST.CSWP.29 |
| Incident response | SP 800-61 Rev. 3, April 2025 | https://doi.org/10.6028/NIST.SP.800-61r3 |
| Security/privacy controls | SP 800-53 Rev. 5, Release 5.2.0 noted 27 August 2025 | https://doi.org/10.6028/NIST.SP.800-53r5 |
| Digital identity | SP 800-63-4, July 2025 | https://doi.org/10.6028/NIST.SP.800-63-4 |
| Zero Trust | SP 800-207, August 2020 | https://doi.org/10.6028/NIST.SP.800-207 |
| Secure development | SP 800-218, SSDF 1.1, February 2022 | https://doi.org/10.6028/NIST.SP.800-218 |
| Security logging | SP 800-92, September 2006 | https://doi.org/10.6028/NIST.SP.800-92 |
| PII protection | SP 800-122, April 2010 | https://doi.org/10.6028/NIST.SP.800-122 |
| Risk assessment | SP 800-30 Rev. 1, September 2012 | https://doi.org/10.6028/NIST.SP.800-30r1 |
| Risk Management Framework | SP 800-37 Rev. 2, December 2018 | https://doi.org/10.6028/NIST.SP.800-37r2 |
| AI Risk Management Framework | AI RMF 1.0, 26 January 2023 | https://doi.org/10.6028/NIST.AI.100-1 |
| Privacy Framework | Version 1.0, 16 January 2020 | https://www.nist.gov/privacy-framework |
| Patch management | SP 800-40 Rev. 4, April 2022 | https://doi.org/10.6028/NIST.SP.800-40r4 |
| Security testing | SP 800-115, September 2008 | https://doi.org/10.6028/NIST.SP.800-115 |
| Security categorization | FIPS 199, February 2004 | https://doi.org/10.6028/NIST.FIPS.199 |
| Minimum requirements | FIPS 200, March 2006 | https://doi.org/10.6028/NIST.FIPS.200 |
| Cryptographic modules | FIPS 140-3, March 2019 | https://doi.org/10.6028/NIST.FIPS.140-3 |

## CSF 2.0 current profile

| Function | Current evidence | Status | Priority gap |
| --- | --- | --- | --- |
| Govern | roles exist; human oversight statement | Partially implemented | named owners, risk/exception acceptance, review schedules, supply-chain/model governance |
| Identify | tables, routes and data flows can be inventoried | Partially implemented | formal FIPS 199 categorization, risk register and dependency/provider inventory |
| Protect | role checks, privacy reduction, parameterized SQL, HMAC | Partially implemented | central permissions, session assurance, upload magic checks, retention, headers, rate/origin controls |
| Detect | audit/notifications/delivery failures exist | Partially implemented | denied-access, auth abuse, chain failures, bulk export, sync/backup/model-change alerts |
| Respond | assignment, SLA, escalation, routing, closure/reopen | Partially implemented | SP 800-61 Rev. 3 states/transitions and playbooks |
| Recover | local data can be backed up manually | Planned | RPO/RTO, encrypted backup schedule, restoration test, DR/BCP and post-recovery verification |

## Major control gaps

1. **Identity/session assurance:** delegated to hosting and undocumented; MFA, AAL, recovery, revocation and reauthentication require deployment configuration.
2. **Authorization:** inconsistent read access and no central permission/resource policy.
3. **Uploads:** no content-signature validation, quarantine state, malware integration point, authorized download/deletion path, or stored hash.
4. **Audit:** editable table has no tamper-evident chain or verification.
5. **Lifecycle:** free-form statuses and limited transition validation.
6. **Privacy:** missing legal hold, retention enforcement, deletion/access/correction workflow and cross-border warning.
7. **Recovery:** no automated backup/restore evidence or tested objectives.
8. **AI governance:** evaluation exists, but owner, approval, rollback, low-confidence policy and change audit are incomplete.
9. **Supply chain:** lockfile exists, but no SBOM, secret/static/dependency scan evidence, supported-version policy or release checklist.
10. **Operational controls:** institutional owners, procedures, training, monitoring, provider due diligence, FIPS validation and independent assessment cannot be implemented solely in source.

No item is marked fully NIST compliant or certified. The final control matrix must mark controls as Implemented only when source, tests, configuration, and operational evidence support that status.
