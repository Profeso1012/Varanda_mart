CREATE TABLE marketplace_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID REFERENCES marketplace_categories(id) ON DELETE SET NULL,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url   VARCHAR(1000),
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE supplier_products (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id             UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
  marketplace_category_id UUID REFERENCES marketplace_categories(id) ON DELETE SET NULL,
  name                    VARCHAR(255) NOT NULL,
  slug                    VARCHAR(255) NOT NULL,
  description             TEXT,
  short_description       VARCHAR(500),
  supplier_price          DECIMAL(12,2) NOT NULL,
  platform_markup_rate    DECIMAL(5,4) NOT NULL DEFAULT 0.0200,
  suggested_retail_price  DECIMAL(12,2),
  currency                VARCHAR(10) NOT NULL DEFAULT 'NGN',
  is_variable             BOOLEAN NOT NULL DEFAULT false,
  track_inventory         BOOLEAN NOT NULL DEFAULT true,
  total_stock             INTEGER NOT NULL DEFAULT 0,
  min_order_quantity      SMALLINT NOT NULL DEFAULT 1,
  processing_time_days    SMALLINT NOT NULL DEFAULT 3,
  ships_to                TEXT[],
  weight                  DECIMAL(8,3),
  status                  supplier_product_status NOT NULL DEFAULT 'DRAFT',
  rejection_reason        TEXT,
  reviewed_by             UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at             TIMESTAMPTZ,
  total_imports           INTEGER NOT NULL DEFAULT 0,
  total_orders            INTEGER NOT NULL DEFAULT 0,
  avg_rating              DECIMAL(3,2),
  seo_title               VARCHAR(255),
  seo_description         VARCHAR(500),
  tags                    TEXT[],
  deleted_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supplier_id, slug)
);

CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_category ON supplier_products(marketplace_category_id);
CREATE INDEX idx_supplier_products_active ON supplier_products(status, deleted_at) WHERE status = 'ACTIVE' AND deleted_at IS NULL;
CREATE INDEX idx_supplier_products_fts ON supplier_products USING gin(to_tsvector('english', name || ' ' || COALESCE(description,'')));

CREATE TABLE supplier_product_images (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_product_id UUID NOT NULL REFERENCES supplier_products(id) ON DELETE CASCADE,
  url                 VARCHAR(1000) NOT NULL,
  public_id           VARCHAR(255) NOT NULL,
  alt_text            VARCHAR(255),
  is_main             BOOLEAN NOT NULL DEFAULT false,
  sort_order          SMALLINT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_product_images ON supplier_product_images(supplier_product_id);

CREATE TABLE supplier_product_variants (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_product_id    UUID NOT NULL REFERENCES supplier_products(id) ON DELETE CASCADE,
  sku                    VARCHAR(100),
  supplier_price         DECIMAL(12,2) NOT NULL,
  platform_markup_rate   DECIMAL(5,4) NOT NULL DEFAULT 0.0200,
  suggested_retail_price DECIMAL(12,2),
  stock_quantity         INTEGER NOT NULL DEFAULT 0,
  variant_label          VARCHAR(255) NOT NULL,
  option_values          JSONB NOT NULL DEFAULT '[]',
  image_url              VARCHAR(1000),
  is_active              BOOLEAN NOT NULL DEFAULT true,
  weight                 DECIMAL(8,3),
  deleted_at             TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_variants_product ON supplier_product_variants(supplier_product_id);
