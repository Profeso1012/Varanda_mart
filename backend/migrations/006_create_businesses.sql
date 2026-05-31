CREATE TABLE businesses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(100) NOT NULL UNIQUE,
  sector            business_sector NOT NULL,
  tagline           VARCHAR(500),
  description       TEXT,
  status            business_status NOT NULL DEFAULT 'INCOMPLETE',
  logo_url          VARCHAR(1000),
  logo_public_id    VARCHAR(255),
  favicon_url       VARCHAR(1000),
  favicon_public_id VARCHAR(255),
  seo_title         VARCHAR(255),
  seo_description   VARCHAR(500),
  seo_keywords      TEXT,
  google_analytics_id VARCHAR(50),
  facebook_pixel_id   VARCHAR(50),
  currency          VARCHAR(10) NOT NULL DEFAULT 'NGN',
  timezone          VARCHAR(100) NOT NULL DEFAULT 'Africa/Lagos',
  payment_gateway   payment_gateway NOT NULL DEFAULT 'VARANDA_PAY',
  is_published      BOOLEAN NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,
  last_sale_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_businesses_last_sale ON businesses(last_sale_at);
