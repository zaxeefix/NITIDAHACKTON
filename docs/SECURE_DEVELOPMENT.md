# Secure development - NIST SP 800-218

## Prepare the organization

Define owners, security requirements, threat model, control matrix, supported versions, vulnerability intake and protected build credentials. Review changes to security boundaries and migrations.

## Protect software

Use the lockfile, reviewed dependencies, least-privileged CI, protected branches, secret management, reproducible commands, artefact/SBOM retention and approved release access. Never commit `.dev.vars`.

## Produce well-secured software

Require TypeScript, lint, unit/integration/security/migration tests, source review, input/authorization checks, dependency/secret/static scanning and a production build. Apply forward migrations to an upgrade copy and verify rollback limitations.

## Respond to vulnerabilities

Triage reports, preserve evidence, assess reachability, patch the supported branch, add a regression test, update SBOM/changelog/advisory, release through change control and monitor.

See `docs/RELEASE_CHECKLIST.md`, `docs/VULNERABILITY_MANAGEMENT.md`, `docs/PATCH_MANAGEMENT.md`, and `docs/SUPPLY_CHAIN_RISK.md`.

