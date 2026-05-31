-- escrow_transactions created before dropship_orders because dropship_orders references it
CREATE TABLE escrow_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropship_order_id  UUID NOT NULL UNIQUE,  -- FK added after dropship_orders
  total_held         DECIMAL(12,2) NOT NULL,
  currency           VARCHAR(10) NOT NULL DEFAULT 'NGN',
  status             escrow_status NOT NULL DEFAULT 'HELD',
  paystack_reference VARCHAR(255),
  held_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at        TIMESTAMPTZ,
  refunded_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dropship_orders (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                   UUID NOT NULL,  -- FK added after orders table in 027
  supplier_id                UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE RESTRICT,
  business_id                UUID REFERENCES businesses(id) ON DELETE SET NULL,
  developer_id               UUID REFERENCES developer_profiles(id) ON DELETE SET NULL,
  dropship_order_number      VARCHAR(30) NOT NULL UNIQUE,
  status                     dropship_order_status NOT NULL DEFAULT 'PENDING',
  seller_confirmation_status seller_confirmation_status NOT NULL DEFAULT 'PENDING',
  customer_name              VARCHAR(200) NOT NULL,
  customer_email             VARCHAR(255) NOT NULL,
  shipping_address           JSONB NOT NULL,
  supplier_note              TEXT,
  tracking_number            VARCHAR(255),
  tracking_url               VARCHAR(1000),
  carrier_name               VARCHAR(100),
  escrow_transaction_id      UUID REFERENCES escrow_transactions(id) ON DELETE SET NULL,
  confirmed_at               TIMESTAMPTZ,
  shipped_at                 TIMESTAMPTZ,
  seller_confirmed_at        TIMESTAMPTZ,
  seller_disputed_at         TIMESTAMPTZ,
  delivered_at               TIMESTAMPTZ,
  cancelled_at               TIMESTAMPTZ,
  cancellation_reason        TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dropship_orders_order ON dropship_orders(order_id);
CREATE INDEX idx_dropship_orders_supplier ON dropship_orders(supplier_id);
CREATE INDEX idx_dropship_orders_status ON dropship_orders(supplier_id, status);
CREATE INDEX idx_dropship_orders_confirmation ON dropship_orders(seller_confirmation_status) WHERE seller_confirmation_status = 'PENDING';

-- Now add the FK from escrow_transactions back to dropship_orders
ALTER TABLE escrow_transactions
  ADD CONSTRAINT fk_escrow_dropship_order
  FOREIGN KEY (dropship_order_id) REFERENCES dropship_orders(id) ON DELETE RESTRICT;

CREATE TABLE dropship_order_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropship_order_id   UUID NOT NULL REFERENCES dropship_orders(id) ON DELETE CASCADE,
  supplier_product_id UUID NOT NULL REFERENCES supplier_products(id) ON DELETE RESTRICT,
  supplier_variant_id UUID REFERENCES supplier_product_variants(id) ON DELETE SET NULL,
  product_snapshot    JSONB NOT NULL,
  variant_snapshot    JSONB,
  quantity            SMALLINT NOT NULL,
  supplier_unit_price DECIMAL(12,2) NOT NULL,
  supplier_total      DECIMAL(12,2) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dropship_order_items ON dropship_order_items(dropship_order_id);

CREATE TABLE revenue_splits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_transaction_id UUID NOT NULL REFERENCES escrow_transactions(id) ON DELETE RESTRICT,
  dropship_order_id     UUID NOT NULL REFERENCES dropship_orders(id) ON DELETE RESTRICT,
  recipient_type        revenue_recipient NOT NULL,
  recipient_id          UUID,
  amount                DECIMAL(12,2) NOT NULL,
  description           VARCHAR(255),
  paystack_transfer_id  VARCHAR(100),
  transfer_status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  sent_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revenue_splits_escrow ON revenue_splits(escrow_transaction_id);
CREATE INDEX idx_revenue_splits_recipient ON revenue_splits(recipient_type, recipient_id);

CREATE TABLE supplier_disputes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropship_order_id UUID NOT NULL REFERENCES dropship_orders(id) ON DELETE RESTRICT,
  raised_by_role    VARCHAR(20) NOT NULL,
  raised_by_id      UUID NOT NULL,
  supplier_id       UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE RESTRICT,
  reason            VARCHAR(50) NOT NULL,
  description       TEXT NOT NULL,
  evidence_urls     TEXT[],
  status            VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  resolution        TEXT,
  resolution_action VARCHAR(30),
  resolved_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disputes_order ON supplier_disputes(dropship_order_id);
CREATE INDEX idx_disputes_supplier ON supplier_disputes(supplier_id);
CREATE INDEX idx_disputes_status ON supplier_disputes(status) WHERE status = 'OPEN';

CREATE TABLE supplier_metrics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id      UUID NOT NULL UNIQUE REFERENCES supplier_profiles(id) ON DELETE CASCADE,
  period_days      SMALLINT NOT NULL DEFAULT 30,
  total_orders     INTEGER NOT NULL DEFAULT 0,
  fulfilled_orders INTEGER NOT NULL DEFAULT 0,
  fulfillment_rate DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  avg_shipping_days DECIMAL(4,1) NOT NULL DEFAULT 0,
  dispute_count    INTEGER NOT NULL DEFAULT 0,
  dispute_rate     DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_rating       DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  review_count     INTEGER NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marketplace_product_reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_product_id   UUID NOT NULL REFERENCES supplier_products(id) ON DELETE CASCADE,
  reviewer_business_id  UUID REFERENCES businesses(id) ON DELETE SET NULL,
  reviewer_developer_id UUID REFERENCES developer_profiles(id) ON DELETE SET NULL,
  dropship_order_id     UUID REFERENCES dropship_orders(id) ON DELETE SET NULL,
  rating                SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                 VARCHAR(255),
  body                  TEXT,
  is_verified_purchase  BOOLEAN NOT NULL DEFAULT false,
  is_published          BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supplier_product_id, reviewer_business_id)
);

CREATE INDEX idx_marketplace_reviews ON marketplace_product_reviews(supplier_product_id);
