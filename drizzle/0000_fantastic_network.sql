CREATE TABLE `audit_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`incident_id` text,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`previous_value` text,
	`new_value` text,
	`reason` text,
	`connection_state` text DEFAULT 'Online' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`redacted_description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Unclassified' NOT NULL,
	`severity` text DEFAULT 'Medium' NOT NULL,
	`confidence` real DEFAULT 0 NOT NULL,
	`language` text DEFAULT 'English' NOT NULL,
	`department` text DEFAULT 'Unspecified' NOT NULL,
	`affected_system` text DEFAULT 'Unspecified' NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`related_count` integer DEFAULT 0 NOT NULL,
	`reporter_email` text,
	`assigned_analyst` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routing_decisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`incident_id` text NOT NULL,
	`destination` text NOT NULL,
	`reason` text NOT NULL,
	`fields_shared` text NOT NULL,
	`status` text DEFAULT 'Pending Approval' NOT NULL,
	`approved_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
