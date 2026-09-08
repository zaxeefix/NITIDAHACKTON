# Hackathon requirements

Assessment date: 31 August 2026.

## Verified source status

The supplied implementation specification identifies the NITDA/ICSC 2026 Universities Hackathon and Track D, “Sorting Incident Reports Nobody Has Time to Read.” No organiser-issued brief, rules PDF, eligibility terms, judging weights, deadline or submission conditions were present in the workspace or uploaded attachment set available to this audit. Those details are **Requires organiser clarification** and are not invented.

| Requirement | Source | Challenge section | Implementation | Evidence | Status | Remaining gap |
| --- | --- | --- | --- | --- | --- | --- |
| Process unstructured reports | Supplied specification | Track D | English/Pidgin text, email, image, PDF, TXT and offline intake | `app/page.tsx`, APIs, OCR/offline libraries | Implemented | Validate against official brief |
| Redact, classify, prioritise, deduplicate and recommend routing | Supplied specification | Track D outcomes | Local model, privacy rules, severity formula, similarity and human routing | `app/lib`, `/api/incidents`, `/api/routing` | Implemented | Field validation with organisers/users |
| Minimum and judge screens | Supplied specification | Demo sequence | Queue, detail, clusters, review, metrics, Judge Mode and extended workspace | `app/page.tsx` | Implemented | Formal usability test |
| Offline demonstration | Supplied specification | Demo sequence | PWA shell, IndexedDB queue, stable references and stop-on-failure sync | `public/sw.js`, `app/lib/offline-queue.ts` | Implemented | Multi-device conflict testing |
| Synthetic data only | Supplied specification | Data rule | 712 deterministic synthetic reports and synthetic OCR benchmark | `ml/`, `app/data/` | Implemented | Independent dataset review |
| Eligibility, judging, deadlines and submission format | Official organiser document | Not available | No claim made | This document | Requires organiser clarification | Upload official rules |

Only evidence-backed status values are used.
