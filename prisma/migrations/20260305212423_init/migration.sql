-- CreateTable
CREATE TABLE "dim_products" (
    "id" TEXT NOT NULL,
    "shopify_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vendor" TEXT,
    "product_type" TEXT,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_variants" (
    "id" TEXT NOT NULL,
    "shopify_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "compare_at_price" DECIMAL(10,2),
    "inventory_qty" INTEGER,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_customers" (
    "id" TEXT NOT NULL,
    "shopify_id" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "orders_count" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "first_order_at" TIMESTAMP(3),
    "last_order_at" TIMESTAMP(3),
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_orders" (
    "id" TEXT NOT NULL,
    "shopify_id" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL,
    "customer_id" TEXT,
    "order_date" TIMESTAMP(3) NOT NULL,
    "financial_status" TEXT NOT NULL,
    "fulfillment_status" TEXT,
    "total_price" DECIMAL(12,2) NOT NULL,
    "subtotal_price" DECIMAL(12,2) NOT NULL,
    "total_discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_refund" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "item_count" INTEGER NOT NULL,
    "landing_site" TEXT,
    "referring_site" TEXT,
    "source_name" TEXT,
    "tags" TEXT[],
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "variant_id" TEXT,
    "title" TEXT NOT NULL,
    "variant_title" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "total_discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "vendor" TEXT,
    "sku" TEXT,

    CONSTRAINT "fact_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_ga4_daily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "channel_group" TEXT NOT NULL,
    "source_medium" TEXT,
    "campaign_name" TEXT,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "users" INTEGER NOT NULL DEFAULT 0,
    "new_users" INTEGER NOT NULL DEFAULT 0,
    "engaged_sessions" INTEGER NOT NULL DEFAULT 0,
    "purchase_events" INTEGER NOT NULL DEFAULT 0,
    "purchase_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_ga4_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metric_value" DECIMAL(12,2),
    "threshold_value" DECIMAL(12,2),
    "comparison_period" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notified_at" TIMESTAMP(3),
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "threshold_pct" DECIMAL(5,2) NOT NULL,
    "comparison_period" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_daily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "predicted_value" DECIMAL(12,2) NOT NULL,
    "actual_value" DECIMAL(12,2),
    "moving_avg_7d" DECIMAL(12,2),
    "yoy_adjustment" DECIMAL(8,4),
    "deviation_pct" DECIMAL(8,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_log" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sync_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "records_processed" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "cursor" TEXT,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "dim_products_shopify_id_key" ON "dim_products"("shopify_id");

-- CreateIndex
CREATE UNIQUE INDEX "dim_variants_shopify_id_key" ON "dim_variants"("shopify_id");

-- CreateIndex
CREATE UNIQUE INDEX "dim_customers_shopify_id_key" ON "dim_customers"("shopify_id");

-- CreateIndex
CREATE INDEX "dim_customers_email_hash_idx" ON "dim_customers"("email_hash");

-- CreateIndex
CREATE INDEX "dim_customers_last_order_at_idx" ON "dim_customers"("last_order_at");

-- CreateIndex
CREATE UNIQUE INDEX "fact_orders_shopify_id_key" ON "fact_orders"("shopify_id");

-- CreateIndex
CREATE INDEX "fact_orders_order_date_idx" ON "fact_orders"("order_date");

-- CreateIndex
CREATE INDEX "fact_orders_financial_status_idx" ON "fact_orders"("financial_status");

-- CreateIndex
CREATE INDEX "fact_orders_customer_id_idx" ON "fact_orders"("customer_id");

-- CreateIndex
CREATE INDEX "fact_orders_order_date_financial_status_idx" ON "fact_orders"("order_date", "financial_status");

-- CreateIndex
CREATE INDEX "fact_order_items_order_id_idx" ON "fact_order_items"("order_id");

-- CreateIndex
CREATE INDEX "fact_order_items_product_id_idx" ON "fact_order_items"("product_id");

-- CreateIndex
CREATE INDEX "fact_order_items_variant_id_idx" ON "fact_order_items"("variant_id");

-- CreateIndex
CREATE INDEX "fact_ga4_daily_date_idx" ON "fact_ga4_daily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "fact_ga4_daily_date_channel_group_source_medium_campaign_na_key" ON "fact_ga4_daily"("date", "channel_group", "source_medium", "campaign_name");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at");

-- CreateIndex
CREATE INDEX "alerts_rule_type_idx" ON "alerts"("rule_type");

-- CreateIndex
CREATE INDEX "forecast_daily_date_idx" ON "forecast_daily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "forecast_daily_date_metric_key" ON "forecast_daily"("date", "metric");

-- CreateIndex
CREATE INDEX "sync_log_source_status_idx" ON "sync_log"("source", "status");

-- CreateIndex
CREATE INDEX "sync_log_started_at_idx" ON "sync_log"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "dim_variants" ADD CONSTRAINT "dim_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "dim_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_orders" ADD CONSTRAINT "fact_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "dim_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_order_items" ADD CONSTRAINT "fact_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "fact_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_order_items" ADD CONSTRAINT "fact_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "dim_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_order_items" ADD CONSTRAINT "fact_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "dim_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
