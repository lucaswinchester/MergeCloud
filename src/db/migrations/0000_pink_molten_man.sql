CREATE TABLE "alert_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"alert_type" varchar(50) NOT NULL,
	"threshold" real,
	"threshold_unit" varchar(20),
	"enabled" boolean DEFAULT true,
	"notify_email" boolean DEFAULT true,
	"notify_in_app" boolean DEFAULT true,
	"device_group_id" uuid,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" uuid,
	"organization_id" varchar(255) NOT NULL,
	"device_uuid" varchar(255) NOT NULL,
	"alert_type" varchar(50) NOT NULL,
	"message" text,
	"current_value" real,
	"threshold" real,
	"acknowledged" boolean DEFAULT false,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_email" varchar(255),
	"organization_id" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100),
	"resource_id" varchar(255),
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dashboard_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"total_devices" integer DEFAULT 0,
	"devices_active" integer DEFAULT 0,
	"devices_online" integer DEFAULT 0,
	"devices_over_data" integer DEFAULT 0,
	"total_data_usage" real DEFAULT 0,
	"monthly_activations" jsonb,
	"top_data_users" jsonb,
	"last_calculated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "dashboard_stats_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "device_group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"device_uuid" varchar(255) NOT NULL,
	"added_at" timestamp with time zone DEFAULT now(),
	"added_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "device_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"organization_id" varchar(255) NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "device_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_uuid" varchar(255) NOT NULL,
	"notes" text NOT NULL,
	"user_full_name" varchar(255),
	"user_id" varchar(255) NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"synced_to_api" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uuid" varchar(255) NOT NULL,
	"serial_no" varchar(255) NOT NULL,
	"label" text,
	"is_activated" boolean DEFAULT false,
	"status" integer DEFAULT 0,
	"used_data" real DEFAULT 0,
	"device_type" varchar(100),
	"device_plan" varchar(255),
	"port_group" varchar(255),
	"organization_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_updated_at" timestamp with time zone DEFAULT now(),
	"synced_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "devices_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "net_scan_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_uuid" varchar(255) NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"connected_devices" integer,
	"scan_date" timestamp with time zone,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_order_id" varchar(255),
	"organization_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"order_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"customer_name" varchar(255),
	"customer_email" varchar(255),
	"customer_phone" varchar(50),
	"shipping_address" jsonb,
	"line_items" jsonb,
	"subtotal" real,
	"tax" real,
	"total" real,
	"commission" real,
	"notes" text,
	"fulfillment_type" varchar(50),
	"warehouse_address" jsonb,
	"bequick_order_id" varchar(255),
	"bequick_status" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"submitted_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "organization_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" varchar(255) NOT NULL,
	"encrypted_api_key" text,
	"api_key_iv" varchar(64),
	"api_key_tag" varchar(64),
	"is_retailer" boolean DEFAULT false,
	"is_wholesaler" boolean DEFAULT false,
	"sparqfi_permissions" jsonb,
	"org_display_name" varchar(255),
	"last_permission_sync" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "organization_settings_clerk_org_id_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"image_url" varchar(500),
	"features" jsonb,
	"specifications" jsonb,
	"retail_price" real NOT NULL,
	"retail_lease_price" real,
	"wholesale_price" real,
	"wholesale_lease_price" real,
	"wholesale_pricing_tiers" jsonb,
	"wholesale_min_order_qty" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"available_for_retail" boolean DEFAULT true,
	"available_for_wholesale" boolean DEFAULT false,
	"in_stock" boolean DEFAULT true,
	"bequick_product_id" varchar(255),
	"supports_dropship" boolean DEFAULT true,
	"supports_inventory" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "speed_test_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_uuid" varchar(255) NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"download_speed" real,
	"upload_speed" real,
	"latency" real,
	"test_type" integer,
	"test_date" timestamp with time zone,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_api_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"clerk_org_id" varchar(255) NOT NULL,
	"platform" varchar(50) NOT NULL,
	"platform_user_id" varchar(255),
	"platform_email" varchar(255),
	"encrypted_api_key" text,
	"api_key_iv" varchar(64),
	"api_key_tag" varchar(64),
	"sync_status" varchar(50) DEFAULT 'matched',
	"metadata" jsonb,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"device_table_columns" jsonb,
	"device_table_page_size" integer DEFAULT 100,
	"dashboard_layout" jsonb,
	"theme" varchar(50) DEFAULT 'system',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_device_group_id_device_groups_id_fk" FOREIGN KEY ("device_group_id") REFERENCES "public"."device_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_config_id_alert_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."alert_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_group_members" ADD CONSTRAINT "device_group_members_group_id_device_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."device_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_configs_org_idx" ON "alert_configs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "alert_configs_type_idx" ON "alert_configs" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "alerts_org_idx" ON "alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "alerts_device_idx" ON "alerts" USING btree ("device_uuid");--> statement-breakpoint
CREATE INDEX "alerts_acknowledged_idx" ON "alerts" USING btree ("acknowledged");--> statement-breakpoint
CREATE INDEX "alerts_created_idx" ON "alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_org_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "dashboard_stats_org_idx" ON "dashboard_stats" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "device_group_members_group_idx" ON "device_group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "device_group_members_device_idx" ON "device_group_members" USING btree ("device_uuid");--> statement-breakpoint
CREATE INDEX "device_groups_org_idx" ON "device_groups" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "device_notes_device_idx" ON "device_notes" USING btree ("device_uuid");--> statement-breakpoint
CREATE INDEX "device_notes_org_idx" ON "device_notes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "devices_organization_idx" ON "devices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "devices_serial_idx" ON "devices" USING btree ("serial_no");--> statement-breakpoint
CREATE INDEX "devices_status_idx" ON "devices" USING btree ("is_activated","status");--> statement-breakpoint
CREATE INDEX "net_scan_device_idx" ON "net_scan_cache" USING btree ("device_uuid");--> statement-breakpoint
CREATE INDEX "net_scan_org_idx" ON "net_scan_cache" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "orders_org_idx" ON "orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_type_idx" ON "orders" USING btree ("order_type");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_active_idx" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "products_sort_idx" ON "products" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "speed_test_device_idx" ON "speed_test_cache" USING btree ("device_uuid");--> statement-breakpoint
CREATE INDEX "speed_test_org_idx" ON "speed_test_cache" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "speed_test_date_idx" ON "speed_test_cache" USING btree ("test_date");--> statement-breakpoint
CREATE INDEX "user_api_creds_user_org_idx" ON "user_api_credentials" USING btree ("clerk_user_id","clerk_org_id");--> statement-breakpoint
CREATE INDEX "user_api_creds_platform_idx" ON "user_api_credentials" USING btree ("clerk_org_id","platform");--> statement-breakpoint
CREATE UNIQUE INDEX "user_api_creds_unique_idx" ON "user_api_credentials" USING btree ("clerk_user_id","clerk_org_id","platform");