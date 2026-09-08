# Synthetic dataset and data dictionary

Generator: `ml/triageng_pipeline.py`; seed: `2026`; output: 712 synthetic records. Fourteen categories each contribute 50 deterministic examples; 12 challenge cases add misleading vocabulary and mixed signals.

Fields: `reportId`, `originalSyntheticText`, `languageStyle`, `sourceType`, `incidentCategory`, `severity`, `responsibleUnit`, `technicalIndicators`, `personalInformationLabels`, `incidentClusterId`, `expectedRedactedText`, `annotatorNotes`, and `split`. Legacy aliases (`id`, `text`, `language`, `category`, `route`) are retained for model/API compatibility.

Clusters contain five related variants. Eight clusters per category are training-only and two are test-only. The generator fails if a cluster appears in both; the current evidence reports `leakageCount: 0`. Data are template-generated using reserved `.example.test` domains and synthetic identifiers. Limitations: template regularity, limited dialect/geographic representation, small adversarial and OCR diagnostic sets, and no claim of production representativeness.
