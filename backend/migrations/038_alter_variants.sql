-- Migration 038: Variant system improvements
--
-- Changes:
-- 1. Replace image_id FK on product_variants with direct image_url + image_public_id columns.
--    Rationale: a variant image is its own asset, not a product gallery image.
--    Keeping it as a FK to product_images created a confusing dependency where you had
--    to upload a product gallery image just to assign it to a variant.
--
-- 2. Add product_variant_option_type_assignments table.
--    This is the missing layer between business-level option types and per-variant assignments.
--    It records: for this product, which option types are used, and which specific values
--    from each type are enabled (i.e. the seller chose only S and M from Size, not XL).
--    Without this table, the system had no way to know which values a product supports
--    without scanning all its variants — and no way to disable a value without deleting variants.

-- ── Step 1: alter product_variants ───────────────────────────────────────────

-- Drop the FK constraint first (constraint name from 018_create_catalog.sql)
ALTER TABLE product_variants
  DROP CONSTRAINT IF EXISTS product_variants_image_id_fkey;

-- Drop the old image_id column
ALTER TABLE product_variants
  DROP COLUMN IF EXISTS image_id;

-- Add direct image columns
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS image_url        VARCHAR(1000),
  ADD COLUMN IF NOT EXISTS image_public_id  VARCHAR(255);

-- ── Step 2: create product_variant_option_type_assignments ────────────────────
-- One row per (product, option_type) pair.
-- The enabled_value_ids array stores which values from that option type this product uses.
-- NULL means "all values of this type are enabled" (useful for simple cases).
-- An explicit array means only those value IDs are available for this product.

CREATE TABLE IF NOT EXISTS product_variant_option_type_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_type_id  UUID NOT NULL REFERENCES variant_option_types(id) ON DELETE RESTRICT,
  -- NULL = all values enabled; explicit array = only these values are enabled for this product
  enabled_value_ids UUID[],
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, option_type_id)
);

CREATE INDEX IF NOT EXISTS idx_pvota_product ON product_variant_option_type_assignments(product_id);
