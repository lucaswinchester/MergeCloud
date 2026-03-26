import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Cached device data from SparqFi API
export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    uuid: varchar("uuid", { length: 255 }).notNull().unique(),
    serialNo: varchar("serial_no", { length: 255 }).notNull(),
    label: text("label"),
    isActivated: boolean("is_activated").default(false),
    status: integer("status").default(0),
    usedData: real("used_data").default(0),
    deviceType: varchar("device_type", { length: 100 }),
    devicePlan: varchar("device_plan", { length: 255 }),
    portGroup: varchar("port_group", { length: 255 }),
    organizationId: varchar("organization_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).defaultNow(),
    syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("devices_organization_idx").on(table.organizationId),
    index("devices_serial_idx").on(table.serialNo),
    index("devices_status_idx").on(table.isActivated, table.status),
  ]
);

// Local notes storage with sync
export const deviceNotes = pgTable(
  "device_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceUuid: varchar("device_uuid", { length: 255 }).notNull(),
    notes: text("notes").notNull(),
    userFullName: varchar("user_full_name", { length: 255 }),
    userId: varchar("user_id", { length: 255 }).notNull(),
    organizationId: varchar("organization_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    syncedToApi: boolean("synced_to_api").default(false),
  },
  (table) => [
    index("device_notes_device_idx").on(table.deviceUuid),
    index("device_notes_org_idx").on(table.organizationId),
  ]
);

// User preferences (column visibility, page sizes, dashboard prefs)
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  organizationId: varchar("organization_id", { length: 255 }).notNull(),
  deviceTableColumns: jsonb("device_table_columns"),
  deviceTablePageSize: integer("device_table_page_size").default(100),
  dashboardLayout: jsonb("dashboard_layout"),
  theme: varchar("theme", { length: 50 }).default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Cached speed test results
export const speedTestCache = pgTable(
  "speed_test_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceUuid: varchar("device_uuid", { length: 255 }).notNull(),
    organizationId: varchar("organization_id", { length: 255 }).notNull(),
    downloadSpeed: real("download_speed"),
    uploadSpeed: real("upload_speed"),
    latency: real("latency"),
    testType: integer("test_type"),
    testDate: timestamp("test_date", { withTimezone: true }),
    rawData: jsonb("raw_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("speed_test_device_idx").on(table.deviceUuid),
    index("speed_test_org_idx").on(table.organizationId),
    index("speed_test_date_idx").on(table.testDate),
  ]
);

// Cached network scan results
export const netScanCache = pgTable(
  "net_scan_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceUuid: varchar("device_uuid", { length: 255 }).notNull(),
    organizationId: varchar("organization_id", { length: 255 }).notNull(),
    connectedDevices: integer("connected_devices"),
    scanDate: timestamp("scan_date", { withTimezone: true }),
    rawData: jsonb("raw_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("net_scan_device_idx").on(table.deviceUuid),
    index("net_scan_org_idx").on(table.organizationId),
  ]
);

// Product catalog (managed by super admins)
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }).notNull(), // residential, business, iot
    imageUrl: varchar("image_url", { length: 500 }),
    features: jsonb("features").$type<string[]>(),
    specifications: jsonb("specifications").$type<Record<string, string>>(),
    retailPrice: real("retail_price").notNull(),
    retailLeasePrice: real("retail_lease_price"),
    wholesalePrice: real("wholesale_price"),
    wholesaleLeasePrice: real("wholesale_lease_price"),
    wholesalePricingTiers: jsonb("wholesale_pricing_tiers").$type<
      Array<{ minQty: number; price: number; leasePrice?: number }>
    >(),
    wholesaleMinOrderQty: integer("wholesale_min_order_qty").default(1),
    isActive: boolean("is_active").default(true),
    availableForRetail: boolean("available_for_retail").default(true),
    availableForWholesale: boolean("available_for_wholesale").default(false),
    inStock: boolean("in_stock").default(true),
    beQuickProductId: varchar("bequick_product_id", { length: 255 }),
    supportsDropship: boolean("supports_dropship").default(true),
    supportsInventory: boolean("supports_inventory").default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("products_category_idx").on(table.category),
    index("products_active_idx").on(table.isActive),
    index("products_sort_idx").on(table.sortOrder),
  ]
);

// Order history and tracking (local cache for reporting)
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalOrderId: varchar("external_order_id", { length: 255 }),
    organizationId: varchar("organization_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    orderType: varchar("order_type", { length: 50 }).notNull(), // residential, business, iot, wholesale
    status: varchar("status", { length: 50 }).default("pending"),
    customerName: varchar("customer_name", { length: 255 }),
    customerEmail: varchar("customer_email", { length: 255 }),
    customerPhone: varchar("customer_phone", { length: 50 }),
    shippingAddress: jsonb("shipping_address"),
    lineItems: jsonb("line_items"),
    subtotal: real("subtotal"),
    tax: real("tax"),
    total: real("total"),
    commission: real("commission"),
    notes: text("notes"),
    fulfillmentType: varchar("fulfillment_type", { length: 50 }), // inventory | dropship
    warehouseAddress: jsonb("warehouse_address"),
    beQuickOrderId: varchar("bequick_order_id", { length: 255 }),
    beQuickStatus: varchar("bequick_status", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("orders_org_idx").on(table.organizationId),
    index("orders_user_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_type_idx").on(table.orderType),
    index("orders_created_idx").on(table.createdAt),
  ]
);

// Audit logs for user actions
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    userEmail: varchar("user_email", { length: 255 }),
    organizationId: varchar("organization_id", { length: 255 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }),
    resourceId: varchar("resource_id", { length: 255 }),
    details: jsonb("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("audit_logs_org_idx").on(table.organizationId),
    index("audit_logs_user_idx").on(table.userId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_idx").on(table.createdAt),
  ]
);

// Dashboard statistics cache
export const dashboardStats = pgTable(
  "dashboard_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: varchar("organization_id", { length: 255 }).notNull().unique(),
    totalDevices: integer("total_devices").default(0),
    devicesActive: integer("devices_active").default(0),
    devicesOnline: integer("devices_online").default(0),
    devicesOverData: integer("devices_over_data").default(0),
    totalDataUsage: real("total_data_usage").default(0),
    monthlyActivations: jsonb("monthly_activations"),
    topDataUsers: jsonb("top_data_users"),
    lastCalculatedAt: timestamp("last_calculated_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("dashboard_stats_org_idx").on(table.organizationId)]
);

// Device groups/collections for bulk operations
export const deviceGroups = pgTable(
  "device_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    organizationId: varchar("organization_id", { length: 255 }).notNull(),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    color: varchar("color", { length: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("device_groups_org_idx").on(table.organizationId)]
);

// Device group membership
export const deviceGroupMembers = pgTable(
  "device_group_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => deviceGroups.id, { onDelete: "cascade" }),
    deviceUuid: varchar("device_uuid", { length: 255 }).notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
    addedBy: varchar("added_by", { length: 255 }),
  },
  (table) => [
    index("device_group_members_group_idx").on(table.groupId),
    index("device_group_members_device_idx").on(table.deviceUuid),
  ]
);

// Performance alerts configuration
export const alertConfigs = pgTable(
  "alert_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: varchar("organization_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    alertType: varchar("alert_type", { length: 50 }).notNull(), // data_usage, offline, speed
    threshold: real("threshold"),
    thresholdUnit: varchar("threshold_unit", { length: 20 }),
    enabled: boolean("enabled").default(true),
    notifyEmail: boolean("notify_email").default(true),
    notifyInApp: boolean("notify_in_app").default(true),
    deviceGroupId: uuid("device_group_id").references(() => deviceGroups.id),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("alert_configs_org_idx").on(table.organizationId),
    index("alert_configs_type_idx").on(table.alertType),
  ]
);

// Triggered alerts
export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    configId: uuid("config_id").references(() => alertConfigs.id),
    organizationId: varchar("organization_id", { length: 255 }).notNull(),
    deviceUuid: varchar("device_uuid", { length: 255 }).notNull(),
    alertType: varchar("alert_type", { length: 50 }).notNull(),
    message: text("message"),
    currentValue: real("current_value"),
    threshold: real("threshold"),
    acknowledged: boolean("acknowledged").default(false),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    acknowledgedBy: varchar("acknowledged_by", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("alerts_org_idx").on(table.organizationId),
    index("alerts_device_idx").on(table.deviceUuid),
    index("alerts_acknowledged_idx").on(table.acknowledged),
    index("alerts_created_idx").on(table.createdAt),
  ]
);

// Organization settings with encrypted API keys and permission flags
export const organizationSettings = pgTable("organization_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkOrgId: varchar("clerk_org_id", { length: 255 }).notNull().unique(),

  // Encrypted SparqFi API key (AES-256-GCM)
  encryptedApiKey: text("encrypted_api_key"),
  apiKeyIv: varchar("api_key_iv", { length: 64 }),
  apiKeyTag: varchar("api_key_tag", { length: 64 }),

  // Top-level org type flags
  isRetailer: boolean("is_retailer").default(false),
  isWholesaler: boolean("is_wholesaler").default(false),

  // SparqFi feature permissions (synced from API)
  sparqfiPermissions: jsonb("sparqfi_permissions").$type<{
    canActivate?: boolean;
    canDeactivate?: boolean;
    canUpdateFirmware?: boolean;
    canPortForward?: boolean;
    canDedicatedIp?: boolean;
    canBridgedIp?: boolean;
    canConfigBackup?: boolean;
    canViewReports?: boolean;
    [key: string]: boolean | undefined;
  }>(),

  // Metadata
  orgDisplayName: varchar("org_display_name", { length: 255 }),
  lastPermissionSync: timestamp("last_permission_sync", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Per-user API credentials for platform-level device scoping
export const userApiCredentials = pgTable(
  "user_api_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull(),
    clerkOrgId: varchar("clerk_org_id", { length: 255 }).notNull(),
    platform: varchar("platform", { length: 50 }).notNull(),
    platformUserId: varchar("platform_user_id", { length: 255 }),
    platformEmail: varchar("platform_email", { length: 255 }),
    encryptedApiKey: text("encrypted_api_key"),
    apiKeyIv: varchar("api_key_iv", { length: 64 }),
    apiKeyTag: varchar("api_key_tag", { length: 64 }),
    syncStatus: varchar("sync_status", { length: 50 }).default("matched"),
    metadata: jsonb("metadata"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("user_api_creds_user_org_idx").on(table.clerkUserId, table.clerkOrgId),
    index("user_api_creds_platform_idx").on(table.clerkOrgId, table.platform),
    uniqueIndex("user_api_creds_unique_idx").on(
      table.clerkUserId,
      table.clerkOrgId,
      table.platform
    ),
  ]
);

// Type exports for use in application
export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;

export type DeviceNote = typeof deviceNotes.$inferSelect;
export type NewDeviceNote = typeof deviceNotes.$inferInsert;

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;

export type SpeedTestResult = typeof speedTestCache.$inferSelect;
export type NewSpeedTestResult = typeof speedTestCache.$inferInsert;

export type NetScanResult = typeof netScanCache.$inferSelect;
export type NewNetScanResult = typeof netScanCache.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type DashboardStat = typeof dashboardStats.$inferSelect;
export type NewDashboardStat = typeof dashboardStats.$inferInsert;

export type DeviceGroup = typeof deviceGroups.$inferSelect;
export type NewDeviceGroup = typeof deviceGroups.$inferInsert;

export type DeviceGroupMember = typeof deviceGroupMembers.$inferSelect;
export type NewDeviceGroupMember = typeof deviceGroupMembers.$inferInsert;

export type AlertConfig = typeof alertConfigs.$inferSelect;
export type NewAlertConfig = typeof alertConfigs.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export type OrganizationSetting = typeof organizationSettings.$inferSelect;
export type NewOrganizationSetting = typeof organizationSettings.$inferInsert;

export type UserApiCredential = typeof userApiCredentials.$inferSelect;
export type NewUserApiCredential = typeof userApiCredentials.$inferInsert;
