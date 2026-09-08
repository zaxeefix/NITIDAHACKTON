# Residual risks

| Risk | Current treatment | Residual status |
| --- | --- | --- |
| Identity/session assurance is platform-owned | document/configure MFA, expiry, revocation and reauth | Requires deployment configuration |
| DNS rebinding/private egress | literal IP blocking, HTTPS, no redirects, timeout | Partially implemented; require platform egress/DNS control |
| Malware scanning | quarantine and scan-state integration point | Planned; approved scanner required |
| Production backup/restore | documented objectives/procedure | Requires deployment configuration and tested evidence |
| Retention/deletion automation | schema fields and procedure | Partially implemented; scheduler/approval workflow required |
| Audit database administrator can rewrite history | hash chain detects changes when verified | Requires protected logs/backups/monitoring |
| Synthetic AI performance may not generalize | human oversight, evaluation and versioning | Medium; representative validation required |
| Offline data on shared/lost devices | device-local storage and user guidance | Medium; device management/expiry/clear control required |
| CSP permits unsafe-inline/eval for framework compatibility | other browser headers and same-origin policy | Partial; production nonce/hash CSP investigation required |
| Senior Analyst retains role management for legacy workflow | audited server permission | Institutional least-privilege decision required |
| NIST/NDPA compliance | evidence and gap matrix only | Independent assessment and institutional policy required |

