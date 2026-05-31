CREATE TABLE logistics_integrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider          VARCHAR(30) NOT NULL DEFAULT 'SHIPBUBBLE',
  api_key_encrypted VARCHAR(500) NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT false,
  origin_address    JSONB,
  connected_at      TIMESTAMPTZ,
  last_tested_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, provider)
);

CREATE TABLE shipments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID,  -- FK added after orders
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider         VARCHAR(30) NOT NULL DEFAULT 'SHIPBUBBLE',
  external_id      VARCHAR(255),
  tracking_code    VARCHAR(255),
  tracking_url     VARCHAR(1000),
  carrier_name     VARCHAR(100),
  waybill_url      VARCHAR(1000),
  status           VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  estimated_days   SMALLINT,
  shipped_at       TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  raw_response     JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
