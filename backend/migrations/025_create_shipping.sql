CREATE TABLE shipping_zones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shipping_zone_regions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id     UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  region_type VARCHAR(20) NOT NULL,  -- 'COUNTRY' | 'STATE' | 'CITY'
  region_value VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shipping_rates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id        UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  description    VARCHAR(255),
  rate_type      VARCHAR(20) NOT NULL DEFAULT 'FLAT',  -- 'FLAT' | 'WEIGHT_BASED' | 'FREE'
  flat_rate      DECIMAL(12,2),
  min_weight     DECIMAL(8,3),
  max_weight     DECIMAL(8,3),
  weight_rate    DECIMAL(10,4),
  min_order      DECIMAL(12,2),
  estimated_days VARCHAR(50),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shipping_policies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  content     TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, slug)
);
