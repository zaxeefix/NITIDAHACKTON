ALTER TABLE `incidents` ADD `data_classification` text DEFAULT 'Restricted' NOT NULL;
ALTER TABLE `incidents` ADD `retention_until` text;
ALTER TABLE `incidents` ADD `legal_hold` integer DEFAULT false NOT NULL;
ALTER TABLE `incidents` ADD `model_version` text DEFAULT 'triageng-mnb-v1' NOT NULL;

ALTER TABLE `audit_entries` ADD `event_id` text;
ALTER TABLE `audit_entries` ADD `actor_role` text;
ALTER TABLE `audit_entries` ADD `target_resource` text;
ALTER TABLE `audit_entries` ADD `outcome` text DEFAULT 'Success' NOT NULL;
ALTER TABLE `audit_entries` ADD `request_id` text;
ALTER TABLE `audit_entries` ADD `correlation_id` text;
ALTER TABLE `audit_entries` ADD `previous_event_hash` text;
ALTER TABLE `audit_entries` ADD `event_hash` text;

ALTER TABLE `attachments` ADD `normalized_name` text;
ALTER TABLE `attachments` ADD `sha256` text;
ALTER TABLE `attachments` ADD `scan_status` text DEFAULT 'Scan Pending' NOT NULL;
ALTER TABLE `attachments` ADD `quarantine_status` text DEFAULT 'Quarantined' NOT NULL;
ALTER TABLE `attachments` ADD `deleted_at` text;

ALTER TABLE `integration_endpoints` ADD `owner_email` text;
ALTER TABLE `integration_endpoints` ADD `approval_status` text DEFAULT 'Pending Approval' NOT NULL;
ALTER TABLE `integration_endpoints` ADD `risk_classification` text DEFAULT 'High' NOT NULL;
ALTER TABLE `integration_endpoints` ADD `data_sharing_description` text;
ALTER TABLE `integration_endpoints` ADD `key_id` text;

ALTER TABLE `delivery_queue` ADD `max_attempts` integer DEFAULT 5 NOT NULL;
ALTER TABLE `delivery_queue` ADD `dead_lettered_at` text;

UPDATE `incidents` SET `status` = 'Awaiting review' WHERE `status` = 'New';

CREATE UNIQUE INDEX `idx_audit_entries_event_id` ON `audit_entries` (`event_id`) WHERE `event_id` IS NOT NULL;
CREATE INDEX `idx_audit_entries_incident_created` ON `audit_entries` (`incident_id`, `created_at`);
CREATE INDEX `idx_attachments_incident_scan` ON `attachments` (`incident_id`, `scan_status`);
CREATE INDEX `idx_incidents_status_sla` ON `incidents` (`status`, `sla_due_at`);
CREATE INDEX `idx_delivery_queue_status_next` ON `delivery_queue` (`status`, `next_attempt_at`);
