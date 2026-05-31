CREATE TABLE store_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_type  VARCHAR(50) NOT NULL,
  session_id  VARCHAR(100),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  page_slug   VARCHAR(255),
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  referrer    VARCHAR(1000),
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_store_events_business ON store_events(business_id);
CREATE INDEX idx_store_events_created ON store_events(business_id, created_at DESC);

CREATE TABLE analytics_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL,
  page_views      INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  add_to_cart     INTEGER NOT NULL DEFAULT 0,
  checkout_started INTEGER NOT NULL DEFAULT 0,
  orders_count    INTEGER NOT NULL DEFAULT 0,
  revenue         DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, snapshot_date)
);
