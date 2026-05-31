CREATE TABLE discount_codes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code              VARCHAR(50) NOT NULL,
  type              discount_type NOT NULL,
  value             DECIMAL(10,2) NOT NULL,
  minimum_order     DECIMAL(12,2),
  usage_limit       INTEGER,
  per_customer_limit SMALLINT NOT NULL DEFAULT 1,
  used_count        INTEGER NOT NULL DEFAULT 0,
  starts_at         TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, code)
);

CREATE TABLE discount_code_usages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  order_id         UUID,  -- FK added after orders
  customer_email   VARCHAR(255) NOT NULL,
  discount_amount  DECIMAL(12,2) NOT NULL,
  used_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
