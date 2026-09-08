# Incident response plan

## Purpose and roles

This plan aligns the product workflow with NIST SP 800-61 Rev. 3 and CSF 2.0. The System Owner maintains service capability; Incident Commander/Senior Analyst approves priority, escalation, routing and closure; Analysts investigate; Data Owner approves sensitive disclosure; Privacy Lead assesses personal-data impact; Administrator maintains systems; Auditor verifies evidence; Communications/Legal roles are institutional.

## Lifecycle

Submitted -> Awaiting review -> Assigned -> In triage -> Confirmed -> Investigating -> Containment in progress -> Eradication in progress -> Recovery in progress -> Monitoring -> Resolved -> Closed. Routing pending approval -> Routed may occur during investigation/recovery. False positive and Reopened are controlled branches. Locally saved and Sync pending describe offline intake.

Every transition records old/new state, actor, role, UTC time, reason, incident, evidence/context, connection state, request/correlation IDs and audit-chain fields.

## Procedure

1. **Preparation:** owners, contacts, backups, integrations, access, exercises and playbooks are current.
2. **Detection/analysis:** validate the report, preserve evidence, assess category/severity/scope, review privacy and confidence, identify related incidents.
3. **Containment:** select short- and long-term controls, preserve business continuity and approvals.
4. **Eradication:** remove root cause, malicious artefacts and unauthorized access; patch safely.
5. **Recovery:** restore clean service, verify security, monitor recurrence and meet RTO/RPO.
6. **Communication/routing:** share minimum privacy-reduced data after human approval through approved channels.
7. **Closure:** require resolution, evidence, residual risk owner, communication status and closure reason.
8. **Lessons learned:** conduct review, track actions, update playbooks/model/rules, and preserve audit evidence.

