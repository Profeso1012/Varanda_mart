const { sql } = require('../../config/database');

const createUser = async ({ email, passwordHash, firstName, lastName, phone }) => {
  const [user] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone)
    VALUES (${email}, ${passwordHash}, ${firstName || null}, ${lastName || null}, ${phone || null})
    RETURNING *
  `;
  return user;
};

const findUserById = async (id) => {
  const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
  return user || null;
};

const findUserByEmail = async (email) => {
  const [user] = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
  return user || null;
};

const updateUser = async (id, fields) => {
  const [user] = await sql`
    UPDATE users SET ${sql(fields, Object.keys(fields))}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return user;
};

const setUserRole = async (id, role) => {
  const [user] = await sql`
    UPDATE users SET role = ${role}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return user;
};

const markEmailVerified = async (id) => {
  const [user] = await sql`
    UPDATE users
    SET is_email_verified = true, email_verified_at = NOW(), updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return user;
};

const updateOnboardingStep = async (id, step) => {
  await sql`
    UPDATE users SET onboarding_step = ${step}, updated_at = NOW()
    WHERE id = ${id}
  `;
};

const setHasSellerProfile = async (id, value) => {
  await sql`UPDATE users SET has_seller_profile = ${value}, updated_at = NOW() WHERE id = ${id}`;
};

const setHasSupplierProfile = async (id, value) => {
  await sql`UPDATE users SET has_supplier_profile = ${value}, updated_at = NOW() WHERE id = ${id}`;
};

const setHasDeveloperProfile = async (id, value) => {
  await sql`UPDATE users SET has_developer_profile = ${value}, updated_at = NOW() WHERE id = ${id}`;
};

const banUser = async (id) => {
  await sql`UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ${id}`;
};

const listUsers = async ({ role, status, search, page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT * FROM users
    WHERE (${role}::text IS NULL OR role = ${role}::user_role)
      AND (${search}::text IS NULL OR email ILIKE ${'%' + (search || '') + '%'}
           OR first_name ILIKE ${'%' + (search || '') + '%'}
           OR last_name ILIKE ${'%' + (search || '') + '%'})
    ORDER BY created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM users
    WHERE (${role}::text IS NULL OR role = ${role}::user_role)
      AND (${search}::text IS NULL OR email ILIKE ${'%' + (search || '') + '%'})
  `;
  return { rows, total: count };
};

module.exports = {
  createUser,
  findUserById,
  findUserByEmail,
  updateUser,
  setUserRole,
  markEmailVerified,
  updateOnboardingStep,
  setHasSellerProfile,
  setHasSupplierProfile,
  setHasDeveloperProfile,
  banUser,
  listUsers,
};
