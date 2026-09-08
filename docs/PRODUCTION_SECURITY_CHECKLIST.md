# Production security checklist

- [ ] `TRIAGENG_LOCAL_DEV` absent/false and `TRIAGENG_ENVIRONMENT=production`.
- [ ] Private access policy, verified membership and appropriate MFA/session assurance configured.
- [ ] TLS, HSTS, WAF/rate limits, request logs and alerting verified.
- [ ] D1/R2 encryption, access, backup, lifecycle and restore evidence approved.
- [ ] Secrets stored/rotated in managed secret storage; no defaults.
- [ ] Webhook/email/provider owners, contracts, risk, data sharing and destinations approved.
- [ ] DNS/private-egress/replay protections verified at platform/network layer.
- [ ] Retention, legal hold, deletion and data-subject process approved.
- [ ] Audit-chain verification and alerting scheduled.
- [ ] NIST control matrix gaps accepted/remediated by named owners.
- [ ] Security/penetration test completed in non-production.
- [ ] Incident, DR, communications, vulnerability and rollback contacts exercised.
- [ ] FIPS 140-3 validated cryptography confirmed where required by the deployment.

