# Triage247Ng Hackathon Submission Package

## Title

Triage247Ng — Intelligent Cyber Incident Triage and Routing Platform

## One-line summary

An offline-capable, AI-assisted intake layer that turns messy English, Nigerian Pidgin, screenshot and PDF cyber reports into privacy-reduced, prioritised and human-reviewable incident records.

## Problem

Small institutional security teams receive important cyber reports through informal messages, emails and screenshots. Analysts must manually interpret inconsistent language, remove personal information, find duplicates, judge urgency and decide where each report belongs. This delays attention to genuinely urgent incidents.

## Solution

Triage247Ng accepts unstructured reports, performs local OCR when necessary, reduces detected personal information, classifies the incident, recommends severity and destination, extracts technical indicators, finds likely duplicates and places the record in an urgency-ordered analyst queue. Every consequential recommendation remains reviewable and external routing requires an authorised human.

## Why it matters

The platform addresses the pre-submission gap before reports reach an institution, ngCERT, law enforcement or a sectoral CSIRT. It is complementary infrastructure and does not claim affiliation with or replacement of any Nigerian government agency.

## AI and Python use

- Python generates 712 synthetic labelled English/Pidgin reports across 14 required categories, trains the Multinomial Naive Bayes classifier and produces the immutable model artefact used by the application.
- Cluster-separated held-out evaluation reports 93.4% accuracy and macro F1 of 0.943; leakage check: 0 clusters.
- Python evaluates severity, routing, indicators, duplicates, redaction and per-report runtime.
- A separate Python OCR benchmark creates and tests 20 synthetic English/Pidgin images under clean, blurred, rotated and compressed conditions.
- Tesseract OCR and PDF text extraction run on the user’s device; the raw OCR result is privacy-scanned before storage.

## Key features

- English and Nigerian Pidgin report intake
- PNG/JPG and hybrid PDF OCR
- Explainable category, severity and confidence recommendation
- Privacy redaction with analyst editing and approval
- URL, domain, IP and hash extraction
- Duplicate grouping and prioritised queue
- Offline PWA, local evidence queue, cached incidents and analyst drafts
- Role-based assignment, SLA tracking, audit history and notifications
- Human-approved routing, signed webhooks and provider adapters
- Downloadable answer keys, evaluation results and readiness matrix

## Architecture

React and TypeScript provide the PWA interface. Cloudflare D1 stores structured records and R2 stores evidence. Python produces the trained classifier and evaluation artefacts. Tesseract.js and PDF.js perform local evidence extraction. Server routes enforce authentication, roles, audit attribution and routing approval.

## Measured results

- Category accuracy: 93.4%; macro precision: 0.940; macro recall: 0.951; macro F1: 0.943 on 152 test/challenge reports
- Severity accuracy: 94.1%; diagnostic critical recall: 100%
- Routing accuracy: 94.1%
- Indicator extraction F1: 76.9%
- Duplicate detection F1: 88.9%
- Redaction precision: 100%; recall: 62.5% on the deliberately difficult diagnostic set
- English macro F1: 0.965; Nigerian Pidgin macro F1: 0.901; gap: 0.064
- OCR character accuracy: 99.6%; word accuracy: 96.9% on 20 synthetic images
- OCR privacy recall: 100% for 10 synthetic identifiers

## Testing instructions

1. Sign in and open **Judge Mode**.
2. Follow the six-step demonstration flow.
3. Open **Analytics** and download the labelled answer key, model evaluation, OCR answer key and OCR evaluation.
4. Submit a synthetic text, PNG/JPG screenshot or PDF report.
5. Open the created incident, inspect the privacy-reduced evidence and confirm that routing cannot proceed without a reason and human approval.
6. Turn off connectivity, submit a report, inspect **Offline Queue**, reconnect and verify safe synchronisation.

## Demo link

Not published in this update. External deployment requires owner authorisation.

## Repository and video

- Public repository: TODO — add the public repository URL after checking for secrets.
- Demo video: TODO — record and add the final video URL.

## Screenshot shot list

1. Judge Mode with Track D readiness and headline metrics.
2. Urgency-ordered queue containing English and Pidgin reports.
3. Incident workspace showing confidence, indicators and privacy review.
4. OCR/PDF evidence result with confidence and page count.
5. Analytics with measured results and honest limitations.

## Known limitations

- All published evaluation data is synthetic.
- The OCR benchmark is small and excludes handwriting, severe glare and damaged documents.
- Independent penetration testing is not yet complete.
- External provider credentials are not bundled.
- Institutional deployment requires formal legal, privacy and operational approval.

## Readiness notes

The prototype is ready for a controlled hackathon demonstration. The live Site is currently access-restricted; judge access must be configured before evaluation. Nothing has been sent to Devpost, and the project does not currently have an initialised Devpost workflow state.
