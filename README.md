# Triage247Ng

**Triage247Ng Intelligent Cyber Incident Triage and Routing Platform**

**Report securely. Triage intelligently. Respond faster.**

Triage247Ng is an offline-capable, AI-assisted incident-intake and triage layer that transforms unstructured English, Nigerian Pidgin and screenshot-based cybersecurity reports into redacted, classified, deduplicated and prioritised records for onward handling by authorised institutional security teams and appropriate response organisations.

Triage247Ng is an independent cyber-incident triage platform. It is not affiliated with or operated by ngCERT, NITDA, NCCC, the Nigeria Police Force or any Nigerian government agency.

## Track D workflow

Authenticated reporters submit text, image, screenshot, PDF or TXT evidence. Device-local OCR, privacy reduction, a locally reproducible classifier, indicator extraction and duplicate similarity produce explainable recommendations. Analysts correct recommendations and Senior Analysts approve external routing. The platform never autonomously routes, closes, deletes, blocks, contacts law enforcement or performs an irreversible response action.

## Architecture

```text
Browser PWA (React, IndexedDB, Tesseract.js, PDF.js)
  -> Vinext/Cloudflare-compatible API
  -> D1 structured records + R2 evidence objects
  -> optional, disabled integrations after human approval

Python standard-library training/evaluation
  -> versioned local model and evidence JSON
```

The existing deployment uses platform-managed sign-in and server-side role/permission/resource checks. Reporter, Analyst, Senior Analyst, Administrator and Auditor permissions are deny-by-default. Formal anonymous submission is disabled.

## Start locally on Windows

```powershell
npm.cmd install
Copy-Item local.env.example .dev.vars
npm.cmd run local:setup
npm.cmd run dev
```

Open the address printed by Vite, normally <http://localhost:5173>. Using `npm.cmd` avoids the PowerShell `npm.ps1` execution-policy error. Full instructions are in [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

## Reproduce evidence

```powershell
npm.cmd run ml:train
npm.cmd run ml:ocr-evaluate
npm.cmd test
npm.cmd run lint
```

The deterministic dataset contains 712 synthetic reports across all 14 required categories. Reports from one incident cluster are assigned to only one partition. Metrics, confusion matrices, language comparison, failures and limitations are displayed in Analytics/Judge Mode and stored under `app/data/`.

## Important documentation

- [Hackathon requirements](docs/HACKATHON_REQUIREMENTS.md)
- [Traceability matrix](docs/HACKATHON_TRACEABILITY_MATRIX.md)
- [Functional preservation checklist](docs/FUNCTION_PRESERVATION_CHECKLIST.md)
- [NIST gap analysis](docs/NIST_GAP_ANALYSIS.md)
- [NIST control matrix](docs/NIST_CONTROL_MATRIX.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Privacy impact assessment](docs/PRIVACY_IMPACT_ASSESSMENT.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Cloudflare deployment—start to finish](docs/CLOUDFLARE_DEPLOYMENT.md)
- [Submission package](docs/HACKATHON_SUBMISSION_PACKAGE.md)

## Legacy internal names

Backward compatibility intentionally retains `TNG-*` incident references, `TRIAGENG_*` environment variables, the `triageng-offline` IndexedDB name, historical migration/table identifiers and some ML filenames. These are internal contracts; all public product copy is Triage247Ng.

## Compliance language

Triage247Ng is designed to align with selected NIST cybersecurity, incident-response, identity, privacy, secure-development and AI-risk-management guidance. Final compliance depends on deployment configuration, institutional procedures, continuous monitoring and independent assessment. This repository does not claim NIST certification, government endorsement or verified compliance with an unavailable organiser brief.

## External actions

No GitHub push, external deployment or hackathon submission is performed automatically. Configure secrets outside source control and obtain institutional approval before processing non-synthetic data.
