# Access control matrix

The executable matrix is `db/security.ts`. `authorize()` checks active membership, named permission and Reporter resource ownership. The interface filters navigation by the same role boundaries, but server authorisation remains authoritative.

| Permission | Reporter | Analyst | Senior Analyst | Administrator | Auditor |
| --- | --- | --- | --- | --- | --- |
| Create/read own incident | Yes | Yes | Yes | Yes | Read |
| Read original/evidence | Own upload only | Yes | Yes | Yes | Evidence read |
| Correct category/severity | No | Yes | Yes | Yes | No |
| Approve redaction | No | Yes | Yes | Yes | No |
| Assign/close | No | Yes | Yes | Yes | No |
| Escalate/reopen | No | No | Yes | Yes | No |
| Approve external routing | No | No | Yes | Yes | No |
| Manage integrations/retry | No | No | No | Yes | No |
| Manage roles | No | No | No | Yes | No |
| Read/export audit | No | No | Yes | Yes | Yes |
| Retention/model administration | No | No | Limited/no | Yes | No |

Administration navigation—Users & Roles, Settings and Integration Centre—is visible only to Administrators. Audit Log is available to Administrators and read-only Auditors. Routing Centre is available to Senior Analysts and Administrators because sensitive external routing requires those approval roles; configuration of routing rules remains Administrator-only.

Session age, reauthentication and MFA assurance depend on the deployed identity platform and must be configured before production. Sensitive actions should require fresh authentication when the platform exposes assurance/session metadata.
