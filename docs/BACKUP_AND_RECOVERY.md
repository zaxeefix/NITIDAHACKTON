# Backup and recovery

## Target objectives

Initial targets pending institutional approval: D1 metadata RPO 4 hours and RTO 8 hours; R2 evidence RPO 24 hours and RTO 24 hours; configuration/model artefacts RPO one approved release and RTO 4 hours. Critical-service deployments must set stricter targets after business-impact analysis.

## Schedule

- D1: automated encrypted backup/export at least every 4 hours; daily retained recovery point.
- R2: versioning/lifecycle or approved backup at least daily.
- Configuration/model/migrations: every approved release with integrity hashes.
- Secrets: back up only through an approved secrets manager; never repository/plaintext backup.

## Restore test

Quarterly, restore into an isolated non-production environment, apply migrations, verify record counts/referential expectations, R2 object hashes, audit chain, permissions, routing-disabled state, model version and sample workflows. Record operator, recovery point, start/end, RPO/RTO achieved, discrepancies and corrective actions.

The local `.wrangler` folder may be copied only as a development backup after the server is stopped. That is not production backup evidence.

