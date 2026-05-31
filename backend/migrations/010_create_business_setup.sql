CREATE TABLE business_addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type         address_type NOT NULL DEFAULT 'BUSINESS',
  street_line1 VARCHAR(255) NOT NULL,
  street_line2 VARCHAR(255),
  city         VARCHAR(100) NOT NULL,
  state        VARCHAR(100) NOT NULL,
  country      VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
  postal_code  VARCHAR(20),
  latitude     DECIMAL(10,8),
  longitude    DECIMAL(11,8),
  is_verified  BOOLEAN NOT NULL DEFAULT false,
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE business_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type             document_type NOT NULL,
  file_url         VARCHAR(1000) NOT NULL,
  file_public_id   VARCHAR(255) NOT NULL,
  file_name        VARCHAR(255),
  status           document_status NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  reviewed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_biz_docs_business ON business_documents(business_id);

CREATE TABLE brand_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id          UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  primary_color        VARCHAR(10) NOT NULL DEFAULT '#000000',
  secondary_color      VARCHAR(10) NOT NULL DEFAULT '#555555',
  accent_color         VARCHAR(10) NOT NULL DEFAULT '#0066CC',
  background_color     VARCHAR(10) NOT NULL DEFAULT '#FFFFFF',
  text_color           VARCHAR(10) NOT NULL DEFAULT '#111111',
  font_heading         VARCHAR(100) NOT NULL DEFAULT 'Inter',
  font_body            VARCHAR(100) NOT NULL DEFAULT 'Inter',
  base_font_size       SMALLINT NOT NULL DEFAULT 16,
  heading_scale        DECIMAL(3,2) NOT NULL DEFAULT 1.25,
  button_border_radius SMALLINT NOT NULL DEFAULT 0,
  card_border_radius   SMALLINT NOT NULL DEFAULT 0,
  input_border_radius  SMALLINT NOT NULL DEFAULT 0,
  global_css           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE social_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform    VARCHAR(50) NOT NULL,
  label       VARCHAR(100),
  url         VARCHAR(1000) NOT NULL,
  icon_type   VARCHAR(20) NOT NULL DEFAULT 'DEFAULT',
  icon_data   TEXT,
  is_visible  BOOLEAN NOT NULL DEFAULT true,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_links_business ON social_links(business_id);

CREATE TABLE chatbot_integrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  provider    VARCHAR(20) NOT NULL,
  config      JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT false,
  position    VARCHAR(20) NOT NULL DEFAULT 'BOTTOM_RIGHT',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE domains (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type            domain_type NOT NULL,
  domain          VARCHAR(255) NOT NULL UNIQUE,
  full_domain     VARCHAR(255) NOT NULL UNIQUE,
  status          domain_status NOT NULL DEFAULT 'PENDING',
  ssl_status      VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  dns_txt_record  VARCHAR(255),
  dns_verified_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domains_business ON domains(business_id);
CREATE INDEX idx_domains_full_domain ON domains(full_domain);
