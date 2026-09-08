# Audit and logging policy

Triage247Ng maintains a **tamper-evident audit trail with integrity verification**. New events contain a UUID, UTC timestamp, actor/role, action, target, incident, before/after values, reason, outcome, request/correlation IDs, connection state, previous-event hash and event hash. Legacy rows remain identifiable and are not falsely represented as chained.

Audit authentication, authorization denial, original/evidence access, uploads/deletion, incident creation/sync/status/correction/assignment/escalation/closure/reopen, routing, role/integration/provider/delivery changes, exports, retention, settings, model changes, backup and restore.

Never log passwords, tokens, signing secrets, complete evidence, unnecessary original narratives or full remote response bodies. Log safe identifiers, hashes, counts, status and bounded error categories.

Integrity verification must run after restore, before audit export, on schedule, and on suspected database manipulation. A chain failure creates a security incident; preserve the database and backup, restrict writes, investigate and do not rewrite history.

