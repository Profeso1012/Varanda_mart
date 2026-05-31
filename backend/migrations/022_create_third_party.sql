CREATE TABLE third_party_dropship_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider          third_party_provider NOT NULL,
  api_key_encrypted VARCHAR(500) NOT NULL,
  config            JSONB NOT NULL DEFAULT '{}',
  is_active         BOOLEAN NOT NULL DEFAULT false,
  connected_at      TIMESTAMPTZ,
  last_synced_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, provider)
);

CREATE TABLE third_party_products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  connection_id       UUID NOT NULL REFERENCES third_party_dropship_connections(id) ON DELETE CASCADE,
  store_product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  external_product_id VARCHAR(255) NOT NULL,
  external_variant_id VARCHAR(255),
  provider            third_party_provider NOT NULL,
  product_data        JSONB NOT NULL DEFAULT '{}',
  is_synced           BOOLEAN NOT NULL DEFAULT false,
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
