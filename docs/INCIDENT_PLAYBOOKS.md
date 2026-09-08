# Incident response playbooks

Each playbook requires validation, evidence collection, severity review, containment, eradication, recovery, communication, routing, closure criteria and lessons learned. Preserve original evidence, work from copies, minimize personal data and never let AI approve an action.

| Playbook | Validate and collect | Contain and eradicate | Recover, route and close |
| --- | --- | --- | --- |
| Phishing | headers, sender, URLs, landing page, recipients, credentials used | block sender/domain/URL, reset exposed credentials, remove messages | monitor accounts; route indicators; close after recipient/account checks |
| Account takeover | login history, MFA events, sessions, mailbox/rules, device/IP | revoke sessions, reset credentials, restore MFA, remove persistence | validate owner access and transaction/mailbox integrity |
| Malware | file hash, process/network evidence, affected hosts, entry vector | isolate hosts, block indicators, remove malware and persistence | rebuild/verify, monitor, share hashes with approval |
| Ransomware | impacted assets, ransom note, encryption scope, exfiltration evidence | isolate segments/accounts, protect backups, eradicate access path | restore clean backups, verify, legal/communications decision, lessons learned |
| Business email compromise | headers, mailbox rules, payment/message history | revoke access, freeze transactions, notify finance/bank through verified channel | restore mailbox, verify payment exposure, controlled reporting |
| Data exposure | data types, subjects, location, access logs, duration | revoke public/unauthorized access and credentials | validate containment, privacy/legal assessment, notification decision |
| Lost/stolen device | owner, device ID, encryption, last seen, stored data | revoke sessions, remote lock/wipe if approved | replace/re-enrol, confirm encryption/wipe evidence |
| Suspicious login | identity, IP/device, time, impossible travel, MFA result | challenge/revoke session, reset credential if confirmed | verify user and monitor recurrence |
| Denial of service | traffic, targets, capacity, upstream evidence | rate/WAF/upstream mitigation, preserve service priority | controlled restoration, capacity changes, provider report |
| Insider threat | authorization, access logs, data actions, HR/legal context | preserve evidence, restrict access through authorized process | remediate access/process gaps; tightly controlled communication |
| Vulnerable public service | affected version, exposure, exploitability, logs | compensate/disable/isolate, patch through change control | security test, monitor, document risk acceptance if unpatched |
| False positive | reproduce signal, validate sources and indicators | stop unnecessary containment while preserving record | mark False positive with reason; tune rules/model and measure recurrence |

For Critical incidents, mandatory Senior Analyst review and documented communication/containment decisions are required even when model confidence is high.

