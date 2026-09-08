export type PrivacyFinding = { type: "Email" | "Obfuscated email" | "Phone" | "Institutional ID" | "Numeric ID"; value: string };

const patterns: Array<{ type: PrivacyFinding["type"]; pattern: RegExp; replacement: string }> = [
  { type: "Email", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replacement: "[EMAIL REDACTED]" },
  { type: "Obfuscated email", pattern: /\b[a-z0-9._%+-]+\s*(?:\[at\]|\(at\)|\sat\s)\s*[a-z0-9.-]+\s*(?:\[dot\]|\(dot\)|\sdot\s)\s*[a-z]{2,}\b/gi, replacement: "[EMAIL REDACTED]" },
  { type: "Phone", pattern: /(?:\+?234[\s-]*|0)[789][01][\s-]*\d{3}[\s-]*\d{3}[\s-]*\d{4}/g, replacement: "[PHONE REDACTED]" },
  { type: "Institutional ID", pattern: /\b[A-Z]{2,10}(?:[\/-][A-Z0-9]{2,10}){1,4}\b/g, replacement: "[INSTITUTIONAL ID REDACTED]" },
  { type: "Numeric ID", pattern: /\b\d{10,12}\b/g, replacement: "[IDENTIFIER REDACTED]" },
];

export function reducePersonalInformation(text: string) {
  const findings: PrivacyFinding[] = [];
  let redacted = text;
  for (const item of patterns) {
    const matches = redacted.match(item.pattern) || [];
    findings.push(...matches.map(value => ({ type: item.type, value })));
    redacted = redacted.replace(item.pattern, item.replacement);
  }
  return { redacted, findings, detectedCount: findings.length, requiresHumanReview: true };
}
