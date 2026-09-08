#!/usr/bin/env python3
"""Generate and evaluate a deterministic synthetic English/Pidgin OCR benchmark."""
from __future__ import annotations

import csv
import json
import re
import subprocess
import tempfile
import os
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SEED = 2026
FONT_CANDIDATES = [
    os.environ.get("TRIAGENG_OCR_FONT", ""),
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]
CASES = [
    ("English", "easy", "Unexpected OTP received twice. Call 08031234567."),
    ("English", "easy", "Phishing link: https://payroll-verify.example.test/login"),
    ("English", "easy", "Email security@example.test about the ransomware note."),
    ("English", "easy", "Unknown login from 197.210.24.18 on the student portal."),
    ("English", "blur", "Payroll asked for my password twice. Phone 08035550111."),
    ("English", "blur", "Suspicious domain scholarship-check.example.test was shared."),
    ("English", "rotate", "Contact analyst@example.test; files now end with .locked."),
    ("English", "rotate", "Malware hash d41d8cd98f00b204e9800998ecf8427e detected."),
    ("English", "compressed", "Lost laptop reported by staff@example.test today."),
    ("English", "compressed", "Admin login from 102.89.34.7 was not authorised."),
    ("Pidgin", "easy", "OTP wey I no request enter my phone 08031234567 twice."),
    ("Pidgin", "easy", "This link https://school-fee.example.test no look correct."),
    ("Pidgin", "easy", "Abeg email ictdesk@example.test, my files no dey open."),
    ("Pidgin", "easy", "Login from 197.210.24.18 no be me do am."),
    ("Pidgin", "blur", "Payroll dey ask for password again. Call 08035550111."),
    ("Pidgin", "blur", "Scholarship-check.example.test dey collect student login."),
    ("Pidgin", "rotate", "Send message to analyst@example.test; computer don lock."),
    ("Pidgin", "rotate", "I see d41d8cd98f00b204e9800998ecf8427e for alert."),
    ("Pidgin", "compressed", "Staff@example.test laptop loss for motor park."),
    ("Pidgin", "compressed", "Na 102.89.34.7 enter admin account for midnight."),
]

def distance(a: list[str], b: list[str]) -> int:
    previous = list(range(len(b) + 1))
    for i, left in enumerate(a, 1):
        current = [i]
        for j, right in enumerate(b, 1):
            current.append(min(current[-1] + 1, previous[j] + 1, previous[j - 1] + (left != right)))
        previous = current
    return previous[-1]

def normal(text: str) -> str:
    return " ".join(text.lower().split())

def render(text: str, difficulty: str, path: Path) -> None:
    image = Image.new("L", (1100, 220), 255)
    draw = ImageDraw.Draw(image)
    font_path = next((path for path in FONT_CANDIDATES if path and Path(path).is_file()), None)
    font = ImageFont.truetype(font_path, 30) if font_path else ImageFont.load_default(size=30)
    words, lines, line = text.split(), [], ""
    for word in words:
        proposed = f"{line} {word}".strip()
        if draw.textlength(proposed, font=font) > 1010:
            lines.append(line); line = word
        else: line = proposed
    lines.append(line)
    draw.multiline_text((42, 42), "\n".join(lines), font=font, fill=0, spacing=14)
    if difficulty == "blur": image = image.filter(ImageFilter.GaussianBlur(1.15))
    elif difficulty == "rotate": image = image.rotate(1.8, expand=False, fillcolor=255)
    elif difficulty == "compressed":
        jpeg = path.with_suffix(".jpg")
        image.save(jpeg, quality=28)
        image = Image.open(jpeg).convert("L")
    image.save(path)

def privacy_expected(text: str) -> int:
    return int(bool(re.search(r"[\w.+-]+@[\w.-]+\.[a-z]{2,}", text, re.I))) + int(bool(re.search(r"\b0[789][01]\d{8}\b", text)))

def privacy_found(text: str) -> int:
    return privacy_expected(text)

def summarise(rows: list[dict], key: str) -> dict:
    groups = defaultdict(list)
    for row in rows: groups[row[key]].append(row)
    return {name: {
        "cases": len(items),
        "characterAccuracy": round(1 - sum(x["characterErrors"] for x in items) / max(sum(x["referenceCharacters"] for x in items), 1), 3),
        "wordAccuracy": round(1 - sum(x["wordErrors"] for x in items) / max(sum(x["referenceWords"] for x in items), 1), 3),
    } for name, items in groups.items()}

def main() -> None:
    rows = []
    with tempfile.TemporaryDirectory(prefix="triageng-ocr-") as folder:
        root = Path(folder)
        for index, (language, difficulty, truth) in enumerate(CASES, 1):
            image = root / f"ocr-{index:02d}.png"
            render(truth, difficulty, image)
            run = subprocess.run(["tesseract", str(image), "stdout", "--psm", "6", "-l", "eng"], capture_output=True, text=True, check=True)
            predicted = normal(run.stdout)
            reference = normal(truth)
            char_errors = distance(list(reference), list(predicted))
            ref_words, pred_words = reference.split(), predicted.split()
            word_errors = distance(ref_words, pred_words)
            expected, found = privacy_expected(truth), privacy_found(predicted)
            rows.append({
                "id": f"OCR-{index:03d}", "language": language, "difficulty": difficulty,
                "groundTruth": truth, "ocrText": run.stdout.strip(),
                "characterErrors": char_errors, "referenceCharacters": len(reference),
                "wordErrors": word_errors, "referenceWords": len(ref_words),
                "characterAccuracy": round(max(0, 1 - char_errors / max(len(reference), 1)), 3),
                "wordAccuracy": round(max(0, 1 - word_errors / max(len(ref_words), 1)), 3),
                "privacyExpected": expected, "privacyDetected": min(expected, found),
            })
    total_chars = sum(x["referenceCharacters"] for x in rows)
    total_words = sum(x["referenceWords"] for x in rows)
    expected = sum(x["privacyExpected"] for x in rows)
    detected = sum(x["privacyDetected"] for x in rows)
    worst = sorted(rows, key=lambda x: (x["wordAccuracy"], x["characterAccuracy"]))[:5]
    result = {
        "schemaVersion": "1.0", "generatedAt": datetime.now(timezone.utc).isoformat(),
        "method": {"engine": "Tesseract 5 CLI", "synthetic": True, "seed": SEED, "cases": len(rows), "languages": ["English", "Pidgin"], "difficulties": ["easy", "blur", "rotate", "compressed"]},
        "overall": {
            "characterAccuracy": round(1 - sum(x["characterErrors"] for x in rows) / total_chars, 3),
            "wordAccuracy": round(1 - sum(x["wordErrors"] for x in rows) / total_words, 3),
            "privacyRecallAfterOcr": round(detected / max(expected, 1), 3),
            "privacyExpected": expected, "privacyDetected": detected,
        },
        "byLanguage": summarise(rows, "language"), "byDifficulty": summarise(rows, "difficulty"),
        "cases": rows,
        "failures": [{k: row[k] for k in ("id", "language", "difficulty", "groundTruth", "ocrText", "characterAccuracy", "wordAccuracy")} for row in worst],
        "limitations": ["Synthetic rendered images are not representative of every phone camera, handwriting or damaged document.", "The benchmark uses the English Tesseract language pack; Nigerian Pidgin spelling variation remains a review risk.", "Privacy recall is measured only for synthetic email addresses and Nigerian phone numbers after OCR."],
    }
    (ROOT / "app/data/ocr-evaluation.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    with (ROOT / "ml/data/ocr-benchmark.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys()); writer.writeheader(); writer.writerows(rows)
    print(json.dumps(result["overall"], indent=2))

if __name__ == "__main__": main()
