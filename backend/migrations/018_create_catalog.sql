CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  name            VARCHAR(100) NOT NULL,
  slug            VARCHAR(100) NOT NULL,
  description     TEXT,
  image_url       VARCHAR(1000),
  image_public_id VARCHAR(255),
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, slug)
);

CREATE INDEX idx_categories_business ON categories(business_id);

CREATE TABLE product_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, slug)
);

CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) NOT NULL,
  description       TEXT,
  short_description VARCHAR(500),
  base_price        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  compare_at_price  DECIMAL(12,2),
  cost_price        DECIMAL(12,2),
  currency          VARCHAR(10) NOT NULL DEFAULT 'NGN',
  product_type      VARCHAR(20) NOT NULL DEFAULT 'OWN',
  is_variable       BOOLEAN NOT NULL DEFAULT false,
  track_inventory   BOOLEAN NOT NULL DEFAULT true,
  status            product_status NOT NULL DEFAULT 'DRAFT',
  is_featured       BOOLEAN NOT NULL DEFAULT false,
  weight            DECIMAL(8,3),
  seo_title         VARCHAR(255),
  seo_description   VARCHAR(500),
  sort_order        SMALLINT NOT NULL DEFAULT 0,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, slug)
);

CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(business_id, status) WHERE deleted_at IS NULL;

CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         VARCHAR(1000) NOT NULL,
  public_id   VARCHAR(255) NOT NULL,
  alt_text    VARCHAR(255),
  is_main     BOOLEAN NOT NULL DEFAULT false,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images ON product_images(product_id);

CREATE TABLE variant_option_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,
  display_type VARCHAR(30) NOT NULL DEFAULT 'TEXT',
  sort_order   SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, name)
);

CREATE TABLE variant_option_values (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_type_id UUID NOT NULL REFERENCES variant_option_types(id) ON DELETE CASCADE,
  value          VARCHAR(100) NOT NULL,
  display_value  VARCHAR(100),
  sort_order     SMALLINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_variants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku              VARCHAR(100),
  price            DECIMAL(12,2) NOT NULL,
  compare_at_price DECIMAL(12,2),
  cost_price       DECIMAL(12,2),
  stock_quantity   INTEGER NOT NULL DEFAULT 0,
  -- Variant image stored directly (not as FK to product_images).
  -- A variant image is its own asset; it does not need to appear in the product gallery.
  image_url        VARCHAR(1000),
  image_public_id  VARCHAR(255),
  weight           DECIMAL(8,3),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variants ON product_variants(product_id);

-- Which option values are assigned to each variant (e.g. variant = Size:M + Color:Black)
CREATE TABLE product_variant_option_assignments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id       UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  option_value_id  UUID NOT NULL REFERENCES variant_option_values(id) ON DELETE RESTRICT,
  UNIQUE (variant_id, option_value_id)
);

-- Which option types a product uses, and which specific values from each type are enabled.
-- enabled_value_ids = NULL means all values of that type are available for this product.
-- enabled_value_ids = [uuid, uuid] means only those values can be used when creating variants.
CREATE TABLE product_variant_option_type_assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_type_id    UUID NOT NULL REFERENCES variant_option_types(id) ON DELETE RESTRICT,
  enabled_value_ids UUID[],
  sort_order        SMALLINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, option_type_id)
);

CREATE INDEX idx_pvota_product ON product_variant_option_type_assignments(product_id);

CREATE TABLE product_tag_assignments (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Now add FKs from dropship_imports and mappings that reference products/variants
ALTER TABLE dropship_imports
  ADD CONSTRAINT fk_dropship_imports_store_product
  FOREIGN KEY (store_product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE dropship_import_variant_mappings
  ADD CONSTRAINT fk_dropship_variant_mappings_store_variant
  FOREIGN KEY (store_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
