CREATE TABLE reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id          UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id            UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title               VARCHAR(255),
  body                TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  is_published        BOOLEAN NOT NULL DEFAULT true,
  is_flagged          BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, customer_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_business ON reviews(business_id);

CREATE TABLE review_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url        VARCHAR(1000) NOT NULL,
  public_id  VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_responses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
