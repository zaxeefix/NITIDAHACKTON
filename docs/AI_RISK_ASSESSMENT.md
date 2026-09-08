# AI risk assessment - NIST AI RMF 1.0

## Govern

Human oversight is mandatory. Model ownership, approval, evaluation schedule, rollback and change audit are required. Production data must not silently become training data.

## Map

Risks: misclassification; severity under/overestimation; OCR/Pidgin errors; privacy-redaction errors; duplicate grouping errors; routing suggestion errors; automation bias; false positives/negatives; drift; poisoning of future datasets; and sensitive-data exposure through evaluation artefacts.

## Measure

Existing artefacts measure classification and pipeline performance on synthetic data, language groups, OCR conditions and errors. Gaps: production calibration, representative institutional samples, subgroup impact assessment, drift thresholds, adversarial robustness and independent validation.

## Manage

- Display recommendation, evidence, confidence, model version and limitations.
- Escalate low-confidence results and require review of Critical incidents.
- Allow correction with rationale and audit it.
- Never route or close automatically.
- Roll back to the last approved artefact when evaluation or monitoring exceeds approved thresholds.
- Record and investigate model/OCR/redaction errors.

Residual risk remains Medium until representative, privacy-approved validation and operating thresholds are approved.

