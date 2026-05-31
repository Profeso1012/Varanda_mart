-- ============================================================
-- DELETE TEST USER — run in Neon SQL editor.
-- Replaces the email below with the one you want to delete.
--
-- If you have already run 037_onboarding_step_enum.sql (or are
-- on a fresh install), the businesses FK is CASCADE so most
-- data is removed automatically when the user row is deleted.
--
-- This script handles the remaining tables that don't cascade
-- and cleans everything up in the correct order.
-- ============================================================

DO $$
DECLARE
  v_email   TEXT := 'test@example.com';  -- ← change this
  v_user_id UUID;
  v_business_id UUID;
  v_supplier_id UUID;
BEGIN

  SELECT id INTO v_user_id FROM users WHERE email = v_email;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No user found with email %', v_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Deleting user % (%)', v_email, v_user_id;

  -- Get associated IDs before we start deleting
  SELECT id INTO v_business_id FROM businesses WHERE owner_id = v_user_id;
  SELECT id INTO v_supplier_id FROM supplier_profiles WHERE user_id = v_user_id;

  -- ── Business data (only if business exists) ──────────────────────────────
  IF v_business_id IS NOT NULL THEN
    -- Orders reference business_id with RESTRICT — delete order data first
    DELETE FROM order_items      WHERE order_id IN (SELECT id FROM orders WHERE business_id = v_business_id);
    DELETE FROM dropship_orders  WHERE order_id IN (SELECT id FROM orders WHERE business_id = v_business_id);
    DELETE FROM escrow_transactions WHERE order_id IN (SELECT id FROM orders WHERE business_id = v_business_id);
    DELETE FROM commissions      WHERE order_id IN (SELECT id FROM orders WHERE business_id = v_business_id);
    DELETE FROM orders           WHERE business_id = v_business_id;

    -- Customers scoped to this business
    DELETE FROM customer_sessions WHERE customer_id IN (SELECT id FROM customers WHERE business_id = v_business_id);
    DELETE FROM customer_addresses WHERE customer_id IN (SELECT id FROM customers WHERE business_id = v_business_id);
    DELETE FROM cart_items        WHERE cart_id IN (SELECT id FROM carts WHERE business_id = v_business_id);
    DELETE FROM carts             WHERE business_id = v_business_id;
    DELETE FROM customers         WHERE business_id = v_business_id;

    -- Catalog
    DELETE FROM product_variant_option_assignments
      WHERE variant_id IN (
        SELECT pv.id FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE p.business_id = v_business_id
      );
    DELETE FROM stock_movements
      WHERE variant_id IN (
        SELECT pv.id FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE p.business_id = v_business_id
      );
    DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE business_id = v_business_id);
    DELETE FROM product_images   WHERE product_id IN (SELECT id FROM products WHERE business_id = v_business_id);
    DELETE FROM product_tag_assignments WHERE product_id IN (SELECT id FROM products WHERE business_id = v_business_id);
    DELETE FROM dropship_imports WHERE business_id = v_business_id;
    DELETE FROM products         WHERE business_id = v_business_id;
    DELETE FROM bundle_items     WHERE bundle_id IN (SELECT id FROM bundles WHERE business_id = v_business_id);
    DELETE FROM bundles          WHERE business_id = v_business_id;
    DELETE FROM categories       WHERE business_id = v_business_id;
    DELETE FROM product_tags     WHERE business_id = v_business_id;
    DELETE FROM variant_option_values
      WHERE option_type_id IN (SELECT id FROM variant_option_types WHERE business_id = v_business_id);
    DELETE FROM variant_option_types WHERE business_id = v_business_id;
    DELETE FROM discount_usages  WHERE discount_id IN (SELECT id FROM discounts WHERE business_id = v_business_id);
    DELETE FROM discounts        WHERE business_id = v_business_id;

    -- Shipping
    DELETE FROM shipping_rates   WHERE zone_id IN (SELECT id FROM shipping_zones WHERE business_id = v_business_id);
    DELETE FROM shipping_regions WHERE zone_id IN (SELECT id FROM shipping_zones WHERE business_id = v_business_id);
    DELETE FROM shipping_zones   WHERE business_id = v_business_id;

    -- Builder / storefront
    DELETE FROM store_pages      WHERE business_id = v_business_id;
    DELETE FROM store_themes     WHERE business_id = v_business_id;

    -- Business profile tables (cascade from businesses, but explicit for safety)
    DELETE FROM business_subscriptions WHERE business_id = v_business_id;
    DELETE FROM business_bank_accounts WHERE business_id = v_business_id;
    DELETE FROM business_addresses     WHERE business_id = v_business_id;
    DELETE FROM business_documents     WHERE business_id = v_business_id;
    DELETE FROM brand_settings         WHERE business_id = v_business_id;
    DELETE FROM social_links           WHERE business_id = v_business_id;
    DELETE FROM chatbot_integrations   WHERE business_id = v_business_id;
    DELETE FROM payment_gateway_integrations WHERE business_id = v_business_id;
    DELETE FROM domains                WHERE business_id = v_business_id;
    DELETE FROM staff_members          WHERE business_id = v_business_id;

    -- The business itself
    DELETE FROM businesses WHERE id = v_business_id;
  END IF;

  -- ── Supplier data ─────────────────────────────────────────────────────────
  IF v_supplier_id IS NOT NULL THEN
    DELETE FROM supplier_product_images
      WHERE supplier_product_id IN (SELECT id FROM supplier_products WHERE supplier_id = v_supplier_id);
    DELETE FROM supplier_product_variants
      WHERE supplier_product_id IN (SELECT id FROM supplier_products WHERE supplier_id = v_supplier_id);
    DELETE FROM supplier_products WHERE supplier_id = v_supplier_id;
    DELETE FROM supplier_profiles WHERE id = v_supplier_id;
  END IF;

  -- ── Developer data ────────────────────────────────────────────────────────
  DELETE FROM developer_api_keys WHERE developer_id IN (SELECT id FROM developer_profiles WHERE user_id = v_user_id);
  DELETE FROM developer_webhooks WHERE developer_id IN (SELECT id FROM developer_profiles WHERE user_id = v_user_id);
  DELETE FROM developer_profiles WHERE user_id = v_user_id;

  -- ── Auth data (cascade from users, but explicit for safety) ──────────────
  DELETE FROM refresh_tokens WHERE user_id = v_user_id;
  DELETE FROM otp_codes      WHERE user_id = v_user_id;

  -- ── Finally delete the user ───────────────────────────────────────────────
  DELETE FROM users WHERE id = v_user_id;

  RAISE NOTICE 'User % deleted successfully.', v_email;
END $$;
