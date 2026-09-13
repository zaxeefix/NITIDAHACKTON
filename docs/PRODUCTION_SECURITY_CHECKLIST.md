# Production security checklist

- [ ] `TRIAGENG_LOCAL_DEV` absent/false and `TRIAGENG_ENVIRONMENT=production`.
- [ ] One production authentication method is configured: native secrets with `TRIAGENG_TRUST_CLOUDFLARE_ACCESS=false`, or verified Cloudflare Access with the flag set to `true`.
- [ ] Native `TRIAGENG_ADMIN_PASSWORD` is at least 12 characters and `TRIAGENG_SESSION_SECRET` is a unique random value of at least 32 characters; neither is committed to Git.
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
