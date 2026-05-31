CREATE TABLE developer_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id    UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
  public_key      VARCHAR(64) NOT NULL UNIQUE,
  secret_key_hash VARCHAR(255) NOT NULL UNIQUE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  environment     VARCHAR(10) NOT NULL DEFAULT 'live',
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dev_credentials_developer ON developer_credentials(developer_id);
CREATE INDEX idx_dev_credentials_public_key ON developer_credentials(public_key);

CREATE TABLE developer_webhooks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id         UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
  url                  VARCHAR(1000) NOT NULL,
  events               TEXT[] NOT NULL,
  secret_hash          VARCHAR(255) NOT NULL,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at    TIMESTAMPTZ,
  consecutive_failures SMALLINT NOT NULL DEFAULT 0,
  disabled_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dev_webhooks_developer ON developer_webhooks(developer_id);
