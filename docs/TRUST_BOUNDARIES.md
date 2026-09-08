# Triage247Ng trust boundaries

## Boundaries

1. **Public/untrusted browser to application API.** Report text, filenames, files, identifiers, query parameters, and client state are attacker-controlled. Client-side hidden controls are not authorization.
2. **Authenticated identity headers to application authorization.** Dispatch/Sites establishes identity; Triage247Ng must establish membership, status, role, permission, resource access, and sensitive-action assurance.
3. **Local-development fallback identity.** This is trusted only when an explicit development flag is true and the runtime is demonstrably non-production. Localhost or a known browser is not itself trusted.
4. **Application to D1/R2.** The Worker holds write authority. Queries must be parameterized; blob keys must be generated; access/deletion must be authorized and audited.
5. **Browser to IndexedDB/service worker.** Device storage is not a trusted system of record. It may contain sensitive pending reports and requires user/device controls and bounded retention.
6. **Application to optional providers/webhooks.** Destinations, DNS, credentials, responses, redirects, and availability are untrusted. Only approved providers receive minimum necessary data.
7. **Email provider to intake endpoint.** Possession of a shared token is a narrow capability; requests still require replay, rate, size, and content controls.
8. **Model/OCR boundary.** Model and OCR output is untrusted advisory data. It cannot authorize routing, disclosure, closure, or irreversible action.
9. **Build and supply-chain boundary.** npm packages, lockfiles, build tooling, model artefacts, migrations, and release outputs require integrity and review.
10. **Operators and institutional processes.** Technical roles do not prove employment, training, legal authority, data-owner approval, or incident-command responsibility.

## Privileged actions

Original-report reveal; evidence read/download/delete; category/severity correction; redaction approval; assignment; escalation; routing approval/rejection; closure/reopening; role change; integration/rule configuration; delivery retry; exports; retention/legal hold; model changes; backup/restore.

Every privileged action must authenticate, verify active membership, enforce a named permission, check the target resource, apply session/reauthentication policy where available, minimize the response, and write a tamper-evident audit event.

