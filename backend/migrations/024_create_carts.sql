CREATE TABLE carts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,
  guest_session_id VARCHAR(100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_carts_customer ON carts(customer_id);
CREATE INDEX idx_carts_guest ON carts(guest_session_id);
CREATE INDEX idx_carts_business ON carts(business_id);

CREATE TABLE cart_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id            UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id         UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id         UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  dropship_import_id UUID REFERENCES dropship_imports(id) ON DELETE SET NULL,
  quantity           SMALLINT NOT NULL DEFAULT 1,
  unit_price         DECIMAL(12,2) NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

CREATE TABLE abandoned_carts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email   VARCHAR(255),
  cart_snapshot    JSONB NOT NULL,
  recovery_sent_at TIMESTAMPTZ,
  recovered_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
