CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        VARCHAR(20) NOT NULL UNIQUE,
  business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  developer_id        UUID REFERENCES developer_profiles(id) ON DELETE SET NULL,
  customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email      VARCHAR(255) NOT NULL,
  customer_name       VARCHAR(200) NOT NULL,
  shipping_address    JSONB NOT NULL,
  billing_address     JSONB,
  order_type          order_type NOT NULL DEFAULT 'DIRECT',
  subtotal            DECIMAL(12,2) NOT NULL,
  shipping_fee        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  service_fee         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total               DECIMAL(12,2) NOT NULL,
  currency            VARCHAR(10) NOT NULL DEFAULT 'NGN',
  status              order_status NOT NULL DEFAULT 'PENDING',
  payment_status      payment_status NOT NULL DEFAULT 'PENDING',
  payment_gateway     payment_gateway NOT NULL DEFAULT 'VARANDA_PAY',
  shipping_zone_id    UUID REFERENCES shipping_zones(id) ON DELETE SET NULL,
  shipping_rate_id    UUID REFERENCES shipping_rates(id) ON DELETE SET NULL,
  discount_code_id    UUID REFERENCES discount_codes(id) ON DELETE SET NULL,
  tracking_number     VARCHAR(255),
  tracking_url        VARCHAR(1000),
  seller_note         TEXT,
  customer_note       TEXT,
  external_order_ref  VARCHAR(255),
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_business ON orders(business_id);
CREATE INDEX idx_orders_developer ON orders(developer_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(business_id, status);
CREATE INDEX idx_orders_created ON orders(business_id, created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_external_ref ON orders(developer_id, external_order_ref);

CREATE TABLE order_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id          UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  supplier_product_id UUID,
  supplier_variant_id UUID,
  dropship_import_id  UUID REFERENCES dropship_imports(id) ON DELETE SET NULL,
  product_snapshot    JSONB NOT NULL,
  variant_snapshot    JSONB,
  quantity            SMALLINT NOT NULL,
  unit_price          DECIMAL(12,2) NOT NULL,
  total_price         DECIMAL(12,2) NOT NULL,
  item_type           VARCHAR(20) NOT NULL DEFAULT 'OWN',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider          payment_provider NOT NULL DEFAULT 'PAYSTACK',
  reference         VARCHAR(255) NOT NULL UNIQUE,
  amount            DECIMAL(12,2) NOT NULL,
  currency          VARCHAR(10) NOT NULL DEFAULT 'NGN',
  status            payment_status NOT NULL DEFAULT 'PENDING',
  gateway_response  JSONB,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_webhooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     payment_provider NOT NULL,
  event_type   VARCHAR(100) NOT NULL,
  reference    VARCHAR(255),
  payload      JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_webhooks_ref ON payment_webhooks(reference);

CREATE TABLE commissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  service_fee     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  markup_revenue  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_platform_revenue DECIMAL(12,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Now add deferred FKs that reference orders
ALTER TABLE dropship_orders
  ADD CONSTRAINT fk_dropship_orders_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE shipments
  ADD CONSTRAINT fk_shipments_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

ALTER TABLE stock_movements
  ADD CONSTRAINT fk_stock_movements_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

ALTER TABLE discount_code_usages
  ADD CONSTRAINT fk_discount_usages_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
