#!/usr/bin/env python3
"""Reproducible Track D1 dataset, classifier and evaluation pipeline.

Uses only the Python standard library so the evidence can be regenerated on
low-connectivity development machines. The exported artefact is executed by
the Cloudflare-compatible TypeScript API; Python remains the source of truth
for training and evaluation.
"""
from __future__ import annotations

import csv
import json
import math
import random
import re
import time
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "ml" / "data"
APP_DATA = ROOT / "app" / "data"
SEED = 2026

CATEGORIES = {
    "Phishing": {
        "severity": "High",
        "route": "Internal ICT/Security Team",
        "english": [
            "I received an email asking me to verify my {asset} password using {url}",
            "A scholarship message sent staff to {url} and requested login details",
            "The sender claims to be ICT and says my account will close unless I sign in",
        ],
        "pidgin": [
            "Dem send me link {url} say make I verify my {asset} password",
            "This scholarship WhatsApp message dey ask us to login for strange website",
            "Person claim say na ICT and say dem go block my account if I no sign in",
        ],
    },
    "Account takeover": {
        "severity": "High",
        "route": "Internal ICT/Security Team",
        "english": [
            "I received an OTP I did not request and my {asset} shows a new login",
            "My password changed without my permission and I cannot access the account",
            "There was an unusual sign-in from {ip} followed by repeated OTP messages",
        ],
        "pidgin": [
            "OTP enter my phone but I no request am and person login my {asset}",
            "Dem change my password without me and now I no fit enter the account",
            "Strange login show from {ip} and OTP messages dey enter plenty",
        ],
    },
    "Ransomware": {
        "severity": "Critical",
        "route": "Internal ICT/Security Team",
        "english": [
            "Files on the {asset} are encrypted and a ransom note demands payment",
            "Every document now has a strange extension and the screen says decrypt",
            "The department computer is locked and attackers demand cryptocurrency",
        ],
        "pidgin": [
            "All file for {asset} don encrypt and message say make we pay ransom",
            "Document no dey open again and screen say we need decrypt key",
            "Department computer lock and attacker dey demand crypto money",
        ],
    },
    "Malware": {
        "severity": "High",
        "route": "Internal ICT/Security Team",
        "english": [
            "Antivirus detected malware on the {asset} after an unknown attachment opened",
            "A suspicious program keeps running and redirects the browser",
            "The laptop reports a trojan and is sending traffic to {ip}",
        ],
        "pidgin": [
            "Antivirus see malware for {asset} after I open attachment wey I no know",
            "Strange program dey run by itself and browser dey redirect",
            "Laptop talk say trojan dey inside and e dey connect to {ip}",
        ],
    },
    "Lost or stolen device": {
        "severity": "Medium",
        "route": "Management",
        "english": [
            "A staff laptop containing institutional files was lost during travel",
            "My official phone was stolen and it still has access to email",
            "The department cannot locate a portable drive used for student records",
        ],
        "pidgin": [
            "Staff laptop wey get office file don loss for journey",
            "Dem steal my official phone and email still dey login inside",
            "Department no fit find flash drive wey carry student record",
        ],
    },
    "Harmless technical failure": {
        "severity": "Informational",
        "route": "Internal ICT/Help Desk",
        "english": [
            "The {asset} portal is slow but there is no unusual login or password request",
            "My printer is offline and the help desk page will not load",
            "A scheduled software update restarted the laptop normally",
        ],
        "pidgin": [
            "{asset} portal slow but no strange login or password request dey",
            "Printer no connect and help desk page no gree open",
            "Normal software update restart the laptop as dem schedule am",
        ],
    },
    "Data exposure": {
        "severity": "High", "route": "Privacy and Data Protection Team",
        "english": ["A public folder exposed student records from {asset}", "Confidential records were emailed to the wrong recipient from {asset}"],
        "pidgin": ["Student record for {asset} show for public folder", "Dem send confidential file from {asset} give wrong person"],
    },
    "Unauthorised access": {
        "severity": "High", "route": "Internal ICT/Security Team",
        "english": ["An unknown administrator accessed {asset} from {ip}", "Audit logs show an unapproved privileged session on {asset}"],
        "pidgin": ["Person wey we no know enter {asset} as admin from {ip}", "Log show say unapproved person use admin access for {asset}"],
    },
    "Payment fraud": {
        "severity": "High", "route": "Finance Fraud Response Team",
        "english": ["A fake invoice changed the payment account for {asset}", "The finance transfer was redirected after a supplier email change"],
        "pidgin": ["Fake invoice change account wey {asset} suppose pay", "Person redirect finance transfer after supplier email change"],
    },
    "Denial of service": {
        "severity": "Critical", "route": "Network Operations and Security Team",
        "english": ["Heavy traffic from {ip} made {asset} unavailable", "Repeated requests overwhelmed {asset} and users cannot connect"],
        "pidgin": ["Plenty traffic from {ip} make {asset} no dey open", "Too many request don knock {asset} offline"],
    },
    "Insider threat": {
        "severity": "High", "route": "Senior Security and HR Review",
        "english": ["A departing staff member copied restricted files from {asset}", "An employee used privileged access outside approved duties on {asset}"],
        "pidgin": ["Staff wey wan leave copy restricted file from {asset}", "Worker use admin access do wetin dem no approve for {asset}"],
    },
    "Vulnerability report": {
        "severity": "Medium", "route": "Vulnerability Management Team",
        "english": ["A researcher found an input validation weakness on {asset}", "The test page reveals software version details at {url}"],
        "pidgin": ["Researcher find input validation problem for {asset}", "Test page dey show software version for {url}"],
    },
    "Benign or non-security enquiry": {
        "severity": "Low", "route": "Internal ICT/Help Desk",
        "english": ["Please explain how to update my contact details on {asset}", "I need the help desk opening time; no security incident occurred"],
        "pidgin": ["Abeg how I fit update my contact detail for {asset}", "Wetin be help desk opening time; no security problem happen"],
    },
    "Ambiguous report": {
        "severity": "Medium", "route": "Triage Review Team",
        "english": ["Something unusual happened on {asset} but I have no other details", "The screen changed and I am not sure whether it is a security issue"],
        "pidgin": ["Something strange happen for {asset} but I no get detail", "Screen change but I no sure whether na security problem"],
    },
}


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]{2,}", text.lower())


def build_dataset() -> list[dict[str, str]]:
    rng = random.Random(SEED)
    rows: list[dict[str, str]] = []
    assets = ["payroll", "student portal", "email", "bursary", "library"]
    sources = ["Web form", "Email", "Screenshot", "Image", "PDF", "TXT", "Offline submission"]
    for category, spec in CATEGORIES.items():
        for i in range(50):
            language = "Nigerian Pidgin" if i % 4 == 0 else "English"
            templates = spec["pidgin" if language == "Nigerian Pidgin" else "english"]
            text = templates[i % len(templates)].format(
                asset=assets[i % len(assets)],
                url=f"https://verify-{i}.example.test/login",
                ip=f"192.0.2.{(i % 200) + 1}",
            )
            if i % 3 == 0:
                text += f" Reported by user{i}@example.test on 0803000{i:04d}."
            cluster_id = f"CL-{list(CATEGORIES).index(category)+1:02d}-{i // 5:02d}"
            pii = "Email; Nigerian telephone number" if i % 3 == 0 else "None"
            redacted = re.sub(r"user\d+@example\.test", "[EMAIL REDACTED]", text)
            redacted = re.sub(r"0803\d{7}", "[PHONE REDACTED]", redacted)
            indicators = "; ".join(sorted(extract_indicators(text)))
            rows.append({
                "id": f"SYN-{len(rows)+1:03d}", "reportId": f"SYN-{len(rows)+1:03d}",
                "language": language, "languageStyle": language,
                "text": text, "originalSyntheticText": text,
                "sourceType": sources[i % len(sources)], "category": category,
                "incidentCategory": category, "severity": str(spec["severity"]),
                "route": str(spec["route"]), "responsibleUnit": str(spec["route"]),
                "technicalIndicators": indicators, "personalInformationLabels": pii,
                "incidentClusterId": cluster_id, "expectedRedactedText": redacted,
                "annotatorNotes": "Deterministic synthetic example; human validation required.",
                "split": "train" if (i // 5) < 8 else "test",
            })
    rng.shuffle(rows)
    return rows


def train(rows: list[dict[str, str]]) -> dict:
    labels = sorted(CATEGORIES)
    docs = Counter(row["category"] for row in rows)
    word_counts: dict[str, Counter] = defaultdict(Counter)
    totals = Counter()
    vocabulary = set()
    for row in rows:
        counts = Counter(tokenize(row["text"]))
        word_counts[row["category"]].update(counts)
        totals[row["category"]] += sum(counts.values())
        vocabulary.update(counts)
    size = len(vocabulary)
    return {
        "schemaVersion": "1.0", "model": "multinomial-naive-bayes",
        "trainedBy": "Python standard-library pipeline", "seed": SEED,
        "trainingReports": len(rows), "labels": labels,
        "severityByCategory": {k: v["severity"] for k, v in CATEGORIES.items()},
        "routeByCategory": {k: v["route"] for k, v in CATEGORIES.items()},
        "logPriors": {label: math.log(docs[label] / len(rows)) for label in labels},
        "unknownLogProb": {label: math.log(1 / (totals[label] + size)) for label in labels},
        "tokenLogProb": {
            label: {token: math.log((count + 1) / (totals[label] + size)) for token, count in word_counts[label].items()}
            for label in labels
        },
    }


def predict(model: dict, text: str) -> tuple[str, float]:
    counts = Counter(tokenize(text))
    scores = {}
    for label in model["labels"]:
        unknown = model["unknownLogProb"][label]
        weights = model["tokenLogProb"][label]
        scores[label] = model["logPriors"][label] + sum(n * weights.get(t, unknown) for t, n in counts.items())
    ordered = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    margin = ordered[0][1] - ordered[1][1]
    confidence = 1 / (1 + math.exp(-min(margin, 12)))
    return ordered[0][0], confidence


def metrics(rows: list[dict[str, str]], predictions: list[str]) -> dict:
    labels = sorted(CATEGORIES)
    matrix = {actual: {pred: 0 for pred in labels} for actual in labels}
    for row, pred in zip(rows, predictions):
        matrix[row["category"]][pred] += 1
    per_class = {}
    for label in labels:
        tp = matrix[label][label]
        fp = sum(matrix[a][label] for a in labels if a != label)
        fn = sum(matrix[label][p] for p in labels if p != label)
        precision = tp / (tp + fp) if tp + fp else 0
        recall = tp / (tp + fn) if tp + fn else 0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
        per_class[label] = {"precision": round(precision, 3), "recall": round(recall, 3), "f1": round(f1, 3), "support": sum(matrix[label].values())}
    accuracy = sum(matrix[x][x] for x in labels) / len(rows)
    macro_precision = sum(v["precision"] for v in per_class.values()) / len(labels)
    macro_recall = sum(v["recall"] for v in per_class.values()) / len(labels)
    macro_f1 = sum(v["f1"] for v in per_class.values()) / len(labels)
    return {"accuracy": round(accuracy, 3), "macroPrecision": round(macro_precision, 3), "macroRecall": round(macro_recall, 3), "macroF1": round(macro_f1, 3), "perClass": per_class, "confusionMatrix": matrix}


def prf(expected: list[set[str]], predicted: list[set[str]]) -> dict:
    tp = sum(len(a & p) for a, p in zip(expected, predicted))
    fp = sum(len(p - a) for a, p in zip(expected, predicted))
    fn = sum(len(a - p) for a, p in zip(expected, predicted))
    precision = tp / (tp + fp) if tp + fp else 1.0
    recall = tp / (tp + fn) if tp + fn else 1.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
    return {"precision": round(precision, 3), "recall": round(recall, 3), "f1": round(f1, 3), "truePositive": tp, "falsePositive": fp, "falseNegative": fn}


def extract_indicators(text: str) -> set[str]:
    patterns = [r"https?://[^\s<>\"]+", r"\b(?:\d{1,3}\.){3}\d{1,3}\b", r"\b[a-f0-9]{32,64}\b", r"\b[a-z0-9.-]+\.(?:com|net|org|ng|io|top|xyz)\b"]
    found = []
    for pattern in patterns:
        found.extend(re.findall(pattern, text, re.I))
    return {value.rstrip("),.;") for value in found}


def detect_pii(text: str) -> set[str]:
    patterns = [
        r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}",
        r"\b[a-z0-9._%+-]+\s*(?:\[at\]|\(at\)|\sat\s)\s*[a-z0-9.-]+\s*(?:\[dot\]|\(dot\)|\sdot\s)\s*[a-z]{2,}\b",
        r"(?:\+?234[\s-]*|0)[789][01][\s-]*\d{3}[\s-]*\d{3}[\s-]*\d{4}",
        r"\b[A-Z]{2,10}(?:[\/-][A-Z0-9]{2,10}){1,4}\b",
        r"\b\d{10,12}\b",
    ]
    return {match.strip() for pattern in patterns for match in re.findall(pattern, text, re.I)}


def similarity(left: str, right: str) -> float:
    a, b = Counter(tokenize(left)), Counter(tokenize(right))
    dot = sum(value * b.get(token, 0) for token, value in a.items())
    norm_a = math.sqrt(sum(value * value for value in a.values()))
    norm_b = math.sqrt(sum(value * value for value in b.values()))
    return dot / (norm_a * norm_b) if norm_a and norm_b else 0


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    APP_DATA.mkdir(parents=True, exist_ok=True)
    rows = build_dataset()
    train_rows = [row for row in rows if row["split"] == "train"]
    challenge_rows = [
        {"id": "HARD-001", "language": "English", "text": "The scheduled password reset page is unavailable after maintenance; no suspicious message was received.", "category": "Harmless technical failure", "severity": "Informational", "route": "Internal ICT/Help Desk"},
        {"id": "HARD-002", "language": "Nigerian Pidgin", "text": "ICT tell us before say dem go test OTP today; the test OTP don enter as planned.", "category": "Harmless technical failure", "severity": "Informational", "route": "Internal ICT/Help Desk"},
        {"id": "HARD-003", "language": "English", "text": "A stolen password was used to access payroll; an unexpected OTP followed.", "category": "Account takeover", "severity": "High", "route": "Internal ICT/Security Team"},
        {"id": "HARD-004", "language": "Nigerian Pidgin", "text": "Person carry office laptop but CCTV show who take am.", "category": "Lost or stolen device", "severity": "Medium", "route": "Management"},
        {"id": "HARD-005", "language": "English", "text": "The antivirus quarantined the harmless training file used in yesterday's exercise.", "category": "Harmless technical failure", "severity": "Informational", "route": "Internal ICT/Help Desk"},
        {"id": "HARD-006", "language": "Nigerian Pidgin", "text": "Browser open another page after update but antivirus no see any problem.", "category": "Harmless technical failure", "severity": "Informational", "route": "Internal ICT/Help Desk"},
        {"id": "HARD-007", "language": "English", "text": "A message requested credentials and later the same account showed an unauthorised login.", "category": "Account takeover", "severity": "High", "route": "Internal ICT/Security Team"},
        {"id": "HARD-008", "language": "Nigerian Pidgin", "text": "File no open because disk full; no ransom message show.", "category": "Harmless technical failure", "severity": "Informational", "route": "Internal ICT/Help Desk"},
        {"id": "HARD-009", "language": "English", "text": "The lost laptop was recovered, but unknown software appeared after it rejoined the network.", "category": "Malware", "severity": "High", "route": "Internal ICT/Security Team"},
        {"id": "HARD-010", "language": "Nigerian Pidgin", "text": "Email say account close but na approved awareness simulation from ICT.", "category": "Harmless technical failure", "severity": "Informational", "route": "Internal ICT/Help Desk"},
        {"id": "HARD-011", "language": "English", "text": "Documents are encrypted by the approved backup system and can be restored normally.", "category": "Harmless technical failure", "severity": "Informational", "route": "Internal ICT/Help Desk"},
        {"id": "HARD-012", "language": "Nigerian Pidgin", "text": "Phone loss yesterday and today strange login enter the staff email.", "category": "Account takeover", "severity": "High", "route": "Internal ICT/Security Team"},
    ]
    test_rows = [row for row in rows if row["split"] == "test"] + challenge_rows
    all_rows = rows + challenge_rows
    train_clusters = {row["incidentClusterId"] for row in train_rows}
    test_clusters = {row["incidentClusterId"] for row in rows if row["split"] == "test"}
    leakage = sorted(train_clusters & test_clusters)
    if leakage:
        raise RuntimeError(f"Cluster leakage detected: {leakage[:5]}")
    model = train(train_rows)
    predictions = [predict(model, row["text"])[0] for row in test_rows]
    overall = metrics(test_rows, predictions)
    language = {}
    for name in ["English", "Nigerian Pidgin"]:
        indexes = [i for i, row in enumerate(test_rows) if row["language"] == name]
        subset = [test_rows[i] for i in indexes]
        language[name] = {"reports": len(subset), **metrics(subset, [predictions[i] for i in indexes])}
    mistakes = [
        {"id": row["id"], "language": row["language"], "expected": row["category"], "predicted": pred, "text": row["text"]}
        for row, pred in zip(test_rows, predictions) if row["category"] != pred
    ][:10]
    predicted_severity = [model["severityByCategory"][label] for label in predictions]
    predicted_route = [model["routeByCategory"][label] for label in predictions]
    severity_accuracy = sum(row["severity"] == value for row, value in zip(test_rows, predicted_severity)) / len(test_rows)
    routing_accuracy = sum(row["route"] == value for row, value in zip(test_rows, predicted_route)) / len(test_rows)
    critical_rows = [i for i, row in enumerate(test_rows) if row["severity"] == "Critical"]
    critical_recall = sum(predicted_severity[i] == "Critical" for i in critical_rows) / len(critical_rows)
    urgent_missed = [{"id": test_rows[i]["id"], "text": test_rows[i]["text"], "predictedSeverity": predicted_severity[i]} for i in critical_rows if predicted_severity[i] != "Critical"]

    indicator_cases = [
        ("Visit https://verify.example.test/login from 192.0.2.42", {"https://verify.example.test/login", "verify.example.test", "192.0.2.42"}),
        ("Hash d41d8cd98f00b204e9800998ecf8427e was found", {"d41d8cd98f00b204e9800998ecf8427e"}),
        ("Suspicious domain bad-login.ng contacted 198.51.100.7", {"bad-login.ng", "198.51.100.7"}),
        ("The text 999.999.999.999 is not a valid IP address", set()),
        ("Open hxxps://masked.example[.]com for the sample", {"hxxps://masked.example[.]com"}),
        ("No technical indicator was included", set()),
    ]
    indicator_expected = [case[1] for case in indicator_cases]
    indicator_predicted = [extract_indicators(case[0]) for case in indicator_cases]
    indicator_scores = prf(indicator_expected, indicator_predicted)

    privacy_cases = [
        ("Contact musa@example.test or 08031234567", {"musa@example.test", "08031234567"}),
        ("Reporter identifier is 12345678901", {"12345678901"}),
        ("No personal information in this report", set()),
        ("Staff identity ABU/ICT/2048 submitted the report", {"ABU/ICT/2048"}),
        ("Email is musa [at] example [dot] test", {"musa [at] example [dot] test"}),
        ("Call +234 803 123 4567 immediately", {"+234 803 123 4567"}),
        ("My name is Musa Ibrahim and the incident happened today", {"Musa Ibrahim"}),
        ("I live at 14 Ahmadu Bello Way, Kaduna", {"14 Ahmadu Bello Way, Kaduna"}),
    ]
    privacy_expected = [case[1] for case in privacy_cases]
    privacy_predicted = [detect_pii(case[0]) for case in privacy_cases]
    privacy_scores = prf(privacy_expected, privacy_predicted)
    privacy_scores["falseRedactionRate"] = round(sum(len(p - a) for a, p in zip(privacy_expected, privacy_predicted)) / max(1, sum(len(p) for p in privacy_predicted)), 3)

    duplicate_pairs = [
        (True, "Scholarship link asks staff to verify password", "WhatsApp scholarship URL dey ask staff make dem verify password"),
        (True, "OTP arrived and an unknown login appeared", "Strange login show and OTP wey I no request enter"),
        (True, "Bursary files encrypted with ransom note", "Ransom message show after bursary documents encrypt"),
        (True, "Official laptop stolen during travel", "Staff laptop loss when dem travel"),
        (False, "Payroll portal is slow after maintenance", "Payroll email asks users to verify passwords"),
        (False, "Antivirus found a trojan", "Staff phone was stolen"),
        (False, "Printer is offline", "Student account shows unknown login"),
        (False, "Backup encrypted files normally", "Ransomware encrypted every bursary document"),
    ]
    duplicate_truth = [{"duplicate"} if expected else set() for expected, _, _ in duplicate_pairs]
    duplicate_predictions = [{"duplicate"} if similarity(left, right) >= 0.20 else set() for _, left, right in duplicate_pairs]
    duplicate_scores = prf(duplicate_truth, duplicate_predictions)

    durations = []
    for _ in range(50):
        started = time.perf_counter()
        for row in test_rows:
            predict(model, row["text"]); extract_indicators(row["text"]); detect_pii(row["text"])
        durations.append((time.perf_counter() - started) * 1000 / len(test_rows))
    durations.sort()
    runtime = {"meanMsPerReport": round(sum(durations) / len(durations), 3), "p95MsPerReport": round(durations[int(len(durations) * .95) - 1], 3), "device": "Hackathon development container", "offlineCapable": True}

    evaluation = {
        "schemaVersion": "1.1", "generatedAt": "2026-08-24T00:00:00Z",
        "dataset": {"total": len(all_rows), "training": len(train_rows), "test": len(test_rows), "synthetic": True, "seed": SEED, "clusterSeparated": not leakage, "leakageCount": len(leakage)},
        "overall": overall, "byLanguage": language, "misclassified": mistakes,
        "pipeline": {
            "severity": {"accuracy": round(severity_accuracy, 3), "criticalRecall": round(critical_recall, 3), "urgentMissed": urgent_missed},
            "routing": {"accuracy": round(routing_accuracy, 3)},
            "indicators": indicator_scores,
            "redaction": privacy_scores,
            "duplicates": duplicate_scores,
            "runtime": runtime,
        },
        "limitations": [
            "Results are measured on synthetic reports and do not establish production performance.",
            "Templates may make the held-out examples easier than naturally occurring reports.",
            "Nigerian Pidgin coverage is limited and requires review with diverse Nigerian users.",
            "Indicator, privacy and duplicate benchmarks are small diagnostic sets and must be expanded.",
            "OCR results are reported separately using a small synthetic Tesseract benchmark.",
        ],
    }
    with (DATA / "labelled_reports.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(all_rows[0]))
        writer.writeheader(); writer.writerows(all_rows)
    (APP_DATA / "model-artifact.json").write_text(json.dumps(model, indent=2), encoding="utf-8")
    (APP_DATA / "model-evaluation.json").write_text(json.dumps(evaluation, indent=2), encoding="utf-8")
    (APP_DATA / "labelled-reports.json").write_text(json.dumps(all_rows, indent=2), encoding="utf-8")
    print(json.dumps({"dataset": len(all_rows), "test": len(test_rows), "accuracy": overall["accuracy"], "macroF1": overall["macroF1"], "severityAccuracy": round(severity_accuracy, 3), "routingAccuracy": round(routing_accuracy, 3), "indicatorF1": indicator_scores["f1"], "redactionRecall": privacy_scores["recall"], "duplicateF1": duplicate_scores["f1"], "mistakes": len(mistakes)}))


if __name__ == "__main__":
    main()
