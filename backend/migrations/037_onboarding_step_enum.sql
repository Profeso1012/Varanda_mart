-- ============================================================
-- ONE-TIME SCRIPT — run in Neon SQL editor on existing databases.
-- NOT part of the migration runner (new installs get this via
-- 002_create_enums.sql + 003_create_users.sql automatically).
--
-- What this does:
--   1. Creates the onboarding_step enum
--   2. Converts the users.onboarding_step column from VARCHAR(50) to the enum
--   3. Adds the CASCADE FK on businesses.owner_id so deleting a user
--      automatically removes their business and all cascading data
-- ============================================================

-- Step 1: create the enum (skip if it already exists)
DO $$ BEGIN
  CREATE TYPE onboarding_step AS ENUM (
    'ROLE_SELECTION',
    'PLAN_SELECTION',
    'BUSINESS_SETUP',
    'COMPLETE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: sanitise any unexpected values before casting
UPDATE users
SET onboarding_step = 'ROLE_SELECTION'
WHERE onboarding_step NOT IN ('ROLE_SELECTION', 'PLAN_SELECTION', 'BUSINESS_SETUP', 'COMPLETE');

-- Step 3: convert the column type
ALTER TABLE users
  ALTER COLUMN onboarding_step TYPE onboarding_step
    USING onboarding_step::onboarding_step;

-- Step 4: restore the default
ALTER TABLE users
  ALTER COLUMN onboarding_step SET DEFAULT 'ROLE_SELECTION';

-- Step 5: change businesses.owner_id FK from RESTRICT to CASCADE
ALTER TABLE businesses
  DROP CONSTRAINT businesses_owner_id_fkey,
  ADD CONSTRAINT businesses_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
