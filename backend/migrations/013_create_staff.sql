CREATE TABLE staff_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_email     VARCHAR(255) NOT NULL,
  invite_token_hash VARCHAR(255),
  invite_expires_at TIMESTAMPTZ,
  status            staff_status NOT NULL DEFAULT 'INVITED',
  permissions       JSONB NOT NULL DEFAULT '{
    "orders":{"view":false,"update_status":false},
    "payments":{"view":false},
    "customers":{"view":false},
    "products":{"view":true,"create":false,"update":false,"delete":false},
    "settings":{"view":false,"update":false}
  }',
  joined_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, invited_email)
);

CREATE INDEX idx_staff_business ON staff_members(business_id);
CREATE INDEX idx_staff_user ON staff_members(user_id);
