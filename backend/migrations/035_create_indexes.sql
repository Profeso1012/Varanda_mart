-- Additional composite and performance indexes not defined inline

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(business_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(business_id, order_type);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(business_id, is_featured) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_status_type ON products(business_id, status, product_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_products_status ON supplier_products(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_subs_trial_end ON business_subscriptions(trial_ends_at) WHERE status = 'TRIAL';
CREATE INDEX IF NOT EXISTS idx_store_events_type ON store_events(business_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_date ON analytics_snapshots(business_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON campaigns(scheduled_at) WHERE status = 'DRAFT';
CREATE INDEX IF NOT EXISTS idx_customer_sessions_expires ON customer_sessions(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at) WHERE used_at IS NULL;
