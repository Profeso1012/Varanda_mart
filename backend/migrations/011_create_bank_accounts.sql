CREATE TABLE business_bank_accounts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id              UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  bank_name                VARCHAR(100) NOT NULL,
  bank_code                VARCHAR(10) NOT NULL,
  account_number           VARCHAR(20) NOT NULL,
  account_name             VARCHAR(200) NOT NULL,
  paystack_subaccount_id   VARCHAR(100),
  paystack_subaccount_code VARCHAR(50) UNIQUE,
  settlement_schedule      VARCHAR(20) NOT NULL DEFAULT 'auto',
  percentage_charge        DECIMAL(5,4) NOT NULL DEFAULT 0.0500,
  is_active                BOOLEAN NOT NULL DEFAULT false,
  activated_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
