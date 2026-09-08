# Disaster recovery and continuity plan

## Activation

The Risk/System Owner activates DR for prolonged Worker, D1, R2, identity, region/provider, integrity or ransomware events. Establish incident command, freeze risky integrations, preserve evidence and communicate through approved channels.

## Recovery sequence

1. Verify people, authority and communications.
2. Contain compromised identities, secrets, endpoints and releases.
3. Select a verified recovery point within approved RPO.
4. Recreate trusted platform configuration and access policy.
5. Restore D1, then R2 evidence, then configuration/model artefacts.
6. Apply forward migrations and verify audit-chain/record/object integrity.
7. Keep outbound routing disabled while validating permissions, redaction and delivery queues.
8. Run smoke, security and synthetic incident tests.
9. Obtain System/Risk Owner authorization before traffic and routing resume.
10. Monitor, reconcile offline reports and complete lessons learned.

Business continuity may use the offline queue for intake, but it does not authorize routing or create a separate authoritative incident system.

