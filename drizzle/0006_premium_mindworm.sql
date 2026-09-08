CREATE TABLE `delivery_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`routing_decision_id` integer NOT NULL,
	`endpoint_id` text,
	`destination` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'Awaiting Configuration' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`next_attempt_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `integration_endpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`endpoint_url` text,
	`enabled` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'Not Configured' NOT NULL,
	`last_test_at` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routing_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'Any' NOT NULL,
	`minimum_severity` text DEFAULT 'Medium' NOT NULL,
	`destination` text NOT NULL,
	`endpoint_id` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
