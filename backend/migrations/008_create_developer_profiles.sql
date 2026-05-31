CREATE TABLE developer_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name           VARCHAR(255) NOT NULL,
  contact_name            VARCHAR(200) NOT NULL,
  website_url             VARCHAR(1000),
  description             TEXT,
  status                  developer_status NOT NULL DEFAULT 'PENDING',
  bank_name               VARCHAR(100),
  bank_code               VARCHAR(10),
  account_number          VARCHAR(20),
  account_name            VARCHAR(200),
  paystack_recipient_code VARCHAR(50),
  total_orders            INTEGER NOT NULL DEFAULT 0,
  total_revenue_earned    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  approved_at             TIMESTAMPTZ,
  approved_by             UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_developer_profiles_user ON developer_profiles(user_id);
CREATE INDEX idx_developer_profiles_status ON developer_profiles(status);
