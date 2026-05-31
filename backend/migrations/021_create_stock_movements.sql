CREATE TABLE stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id      UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  order_id        UUID,  -- FK added after orders
  movement_type   stock_movement_type NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after  INTEGER NOT NULL,
  note            VARCHAR(255),
  performed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_business ON stock_movements(business_id);
CREATE INDEX idx_stock_movements_variant ON stock_movements(variant_id);
