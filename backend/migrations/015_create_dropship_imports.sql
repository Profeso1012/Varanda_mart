CREATE TABLE dropship_imports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  supplier_product_id UUID NOT NULL REFERENCES supplier_products(id) ON DELETE RESTRICT,
  store_product_id    UUID,  -- FK added after products table in 018
  retail_price        DECIMAL(12,2) NOT NULL,
  compare_at_price    DECIMAL(12,2),
  seller_margin       DECIMAL(12,2) NOT NULL,
  custom_title        VARCHAR(255),
  custom_description  TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  is_published        BOOLEAN NOT NULL DEFAULT false,
  total_orders        INTEGER NOT NULL DEFAULT 0,
  total_revenue       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, supplier_product_id)
);

CREATE INDEX idx_dropship_imports_business ON dropship_imports(business_id);
CREATE INDEX idx_dropship_imports_supplier_product ON dropship_imports(supplier_product_id);

CREATE TABLE dropship_import_variant_mappings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropship_import_id  UUID NOT NULL REFERENCES dropship_imports(id) ON DELETE CASCADE,
  supplier_variant_id UUID NOT NULL REFERENCES supplier_product_variants(id) ON DELETE RESTRICT,
  store_variant_id    UUID,  -- FK added after product_variants table in 018
  retail_price        DECIMAL(12,2) NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (dropship_import_id, supplier_variant_id)
);
