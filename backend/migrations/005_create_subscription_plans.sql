CREATE TABLE subscription_plans (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier                      plan_tier NOT NULL UNIQUE,
  display_name              VARCHAR(50) NOT NULL,
  monthly_price_usd         DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  yearly_price_usd          DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  trial_days                SMALLINT NOT NULL DEFAULT 90,
  commission_rate           DECIMAL(5,4) NOT NULL DEFAULT 0.0500,
  platform_service_fee_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0025,
  max_products              INTEGER,
  max_stores                SMALLINT NOT NULL DEFAULT 1,
  max_staff_seats           SMALLINT NOT NULL DEFAULT 1,
  max_dropship_imports      INTEGER DEFAULT 5,  -- NULL = unlimited
  features                  JSONB NOT NULL DEFAULT '{}',
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  sort_order                SMALLINT NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
