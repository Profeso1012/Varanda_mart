CREATE TABLE payment_gateway_integrations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id              UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  gateway                  payment_gateway NOT NULL,
  api_key_encrypted        VARCHAR(500) NOT NULL,
  api_secret_encrypted     VARCHAR(500),
  webhook_secret_encrypted VARCHAR(500),
  is_active                BOOLEAN NOT NULL DEFAULT false,
  connected_at             TIMESTAMPTZ,
  last_tested_at           TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, gateway)
);

CREATE INDEX idx_payment_integrations_business ON payment_gateway_integrations(business_id);
