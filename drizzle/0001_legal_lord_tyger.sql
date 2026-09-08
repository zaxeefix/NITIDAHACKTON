CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`object_key` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`processing_status` text DEFAULT 'Stored — OCR queued' NOT NULL,
	`ocr_text` text,
	`detected_pii_count` integer DEFAULT 0 NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
