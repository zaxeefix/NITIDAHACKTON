# Hackathon traceability matrix

| Requirement | Source document | Relevant section | Triage247Ng implementation | Source file/API | Test or evidence | Status | Remaining gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Track D problem positioning | Supplied specification | §2 | Independent AI-assisted intake/triage layer | `README.md`, `app/page.tsx` | Render/build test | Implemented | Official brief unavailable |
| Account before formal submission | Supplied specification | §5 | Platform-managed authentication; reporter ownership bound server-side | `app/chatgpt-auth.ts`, `/api/incidents` | security tests | Partially implemented | Password registration/email verification/MFA are not provided by the current Sites auth path |
| Required screens | Supplied specification | §6 | Connected workspace views and actions | `app/page.tsx` | preservation checklist | Implemented | Usability study |
| 600–1,000 synthetic records | Supplied specification | §7 | 712 deterministic records, 14 categories, cluster split | `ml/triageng_pipeline.py` | evaluation `leakageCount: 0` | Implemented | Broader annotation review |
| Explainable local AI | Supplied specification | §§9–10 | Local model artefact, feature evidence and weighted severity | ML pipeline, `/api/incidents` | model evaluation | Implemented | Calibrate on authorised representative data |
| Human control | Supplied specification | §11 | correction reasons, approval-only routing, controlled lifecycle | incident/routing APIs | security tests | Implemented | Operational approval policy |
| Offline resilience | Supplied specification | §12 | IndexedDB, service worker, safe idempotent sync | offline library/service worker | readiness test | Implemented | Extended network-chaos test |
| NIST alignment | Supplied specification | §13 | matrices, threat/privacy/model evidence and server controls | `docs/`, `db/security.ts` | NIST matrix | Partially implemented | Deployment/institutional evidence |
| Evaluation disclosure | Supplied specification | §17 | classification/language/pipeline/OCR metrics and failures | `app/data/*evaluation.json` | regenerated artefacts | Implemented | Larger diagnostic sets |
| GitHub/Vercel/Render preparation | Supplied specification | §19 | repository and deployment documents/config | root files and `docs/` | local build | Partially implemented | Actual accounts and hosted smoke tests require approval |
| Official eligibility/deadline/judging | Organiser rules | Unavailable | No invented claims | `docs/HACKATHON_REQUIREMENTS.md` | attachment inventory | Requires organiser clarification | Provide official document |
