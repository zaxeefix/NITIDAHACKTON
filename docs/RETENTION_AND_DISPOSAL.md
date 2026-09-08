# Retention and disposal

## Policy

The Data Owner assigns an approved retention schedule by record class. `retention_until` is the eligible-review date, not automatic authority to delete. `legal_hold` overrides disposal. Default production periods must be configured by institutional policy; source code intentionally does not invent legal periods.

## Enforcement procedure

1. Select records past `retention_until` and not under legal hold.
2. Recheck linked incidents, evidence, audit, routing, delivery, notifications and exports.
3. Obtain Data Owner approval and create a deletion request/audit event.
4. Delete R2 evidence first using exact stored object keys; verify absence.
5. Delete or irreversibly de-identify eligible D1 data in a transaction where supported.
6. Retain the minimum deletion receipt: IDs/hashes, approver, time, basis and outcome, without deleted content.
7. Apply backup expiry so deleted data is not restored beyond policy, except documented legal hold.

Offline IndexedDB reports/drafts require device-local expiry and a user clear action. Secure deletion from managed cloud media depends on provider lifecycle and cryptographic-erasure guarantees.

