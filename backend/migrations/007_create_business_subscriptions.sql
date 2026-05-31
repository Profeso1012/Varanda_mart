CREATE TABLE business_subscriptions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id                 UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id                     UUID NOT NULL REFERENCES subscription_plans(id),
  billing_cycle               VARCHAR(10) NOT NULL DEFAULT 'MONTHLY',
  status                      subscription_status NOT NULL DEFAULT 'TRIAL',
  trial_starts_at             TIMESTAMPTZ,
  trial_ends_at               TIMESTAMPTZ,
  current_period_start        TIMESTAMPTZ,
  current_period_end          TIMESTAMPTZ,
  next_billing_amount         DECIMAL(8,2),
  next_billing_date           TIMESTAMPTZ,
  flutterwave_subscription_id VARCHAR(100) UNIQUE,
  flutterwave_customer_id     VARCHAR(100),
  flutterwave_plan_id         VARCHAR(100),
  card_last4                  VARCHAR(4),
  card_expiry                 VARCHAR(7),
  card_brand                  VARCHAR(20),
  cancelled_at                TIMESTAMPTZ,
  cancellation_reason         TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_biz_subs_business ON business_subscriptions(business_id);
CREATE INDEX idx_biz_subs_status ON business_subscriptions(status);
CREATE INDEX idx_biz_subs_flw ON business_subscriptions(flutterwave_subscription_id);
