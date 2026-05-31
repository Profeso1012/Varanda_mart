CREATE TABLE supplier_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_id             UUID UNIQUE REFERENCES businesses(id) ON DELETE SET NULL,
  display_name            VARCHAR(255) NOT NULL,
  description             TEXT,
  logo_url                VARCHAR(1000),
  logo_public_id          VARCHAR(255),
  country                 VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
  processing_time_days    SMALLINT NOT NULL DEFAULT 3,
  ships_to                TEXT[],
  is_verified             BOOLEAN NOT NULL DEFAULT false,
  verified_at             TIMESTAMPTZ,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  bank_name               VARCHAR(100),
  bank_code               VARCHAR(10),
  account_number          VARCHAR(20),
  account_name            VARCHAR(200),
  paystack_recipient_code VARCHAR(50),
  total_dropship_sales    INTEGER NOT NULL DEFAULT 0,
  total_revenue_earned    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  fulfillment_rate        DECIMAL(5,2),
  avg_shipping_days       DECIMAL(4,1),
  dispute_rate            DECIMAL(5,2),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_profiles_user ON supplier_profiles(user_id);
CREATE INDEX idx_supplier_profiles_active ON supplier_profiles(is_active) WHERE is_active = true;
