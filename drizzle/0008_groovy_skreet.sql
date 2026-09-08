CREATE TABLE `integration_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_type` text NOT NULL,
	`operation` text NOT NULL,
	`status` text NOT NULL,
	`response_code` integer,
	`detail` text,
	`initiated_by` text NOT NULL,
	`duration_ms` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
