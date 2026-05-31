CREATE TABLE campaigns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  channel      campaign_channel NOT NULL,
  subject      VARCHAR(255),
  body         TEXT NOT NULL,
  status       campaign_status NOT NULL DEFAULT 'DRAFT',
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  open_count   INTEGER NOT NULL DEFAULT 0,
  click_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_recipients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  email       VARCHAR(255),
  phone       VARCHAR(30),
  status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  sent_at     TIMESTAMPTZ,
  opened_at   TIMESTAMPTZ,
  clicked_at  TIMESTAMPTZ
);
