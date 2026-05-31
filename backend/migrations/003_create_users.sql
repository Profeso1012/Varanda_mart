CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(255) NOT NULL UNIQUE,
  password_hash         VARCHAR(255) NOT NULL,
  role                  user_role NOT NULL DEFAULT 'SELLER',
  first_name            VARCHAR(100),
  last_name             VARCHAR(100),
  phone                 VARCHAR(30),
  is_email_verified     BOOLEAN NOT NULL DEFAULT false,
  email_verified_at     TIMESTAMPTZ,
  onboarding_step       onboarding_step NOT NULL DEFAULT 'ROLE_SELECTION',
  has_seller_profile    BOOLEAN NOT NULL DEFAULT false,
  has_supplier_profile  BOOLEAN NOT NULL DEFAULT false,
  has_developer_profile BOOLEAN NOT NULL DEFAULT false,
  last_login_at         TIMESTAMPTZ,
  last_active_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
