CREATE TABLE invoice_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  type           VARCHAR(20) NOT NULL DEFAULT 'INVOICE',
  customer_name  VARCHAR(200),
  customer_email VARCHAR(255),
  line_items     JSONB NOT NULL DEFAULT '[]',
  subtotal       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes          TEXT,
  pdf_url        VARCHAR(1000),
  pdf_public_id  VARCHAR(255),
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
