# Contributing

Use synthetic data only. Create additive migrations, preserve legacy API contracts, and never commit `.dev.vars`, credentials or incident evidence. Before proposing a change, run `npm.cmd test`, `npm.cmd run lint`, regenerate affected ML artefacts and update the traceability/control evidence. Security-sensitive changes require server-side authorisation tests and a documented rollback.
