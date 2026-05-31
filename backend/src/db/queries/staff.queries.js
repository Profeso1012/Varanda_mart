const { sql } = require('../../config/database');
const crypto = require('crypto');

const createStaffInvite = async (businessId, { invitedEmail, permissions }) => {
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [staff] = await sql`
    INSERT INTO staff_members (business_id, invited_email, invite_token_hash, invite_expires_at, permissions)
    VALUES (${businessId}, ${invitedEmail.toLowerCase()}, ${inviteTokenHash}, ${inviteExpiresAt},
            ${sql.json(permissions || defaultPermissions())})
    RETURNING *
  `;
  return { staff, inviteToken };
};

const defaultPermissions = () => ({
  orders: { view: false, update_status: false },
  payments: { view: false },
  customers: { view: false },
  products: { view: true, create: false, update: false, delete: false },
  settings: { view: false, update: false },
});

const findStaffByInviteToken = async (tokenHash) => {
  const [staff] = await sql`
    SELECT sm.*, b.name AS business_name, b.owner_id
    FROM staff_members sm
    JOIN businesses b ON b.id = sm.business_id
    WHERE sm.invite_token_hash = ${tokenHash}
      AND sm.status = 'INVITED'
      AND sm.invite_expires_at > NOW()
  `;
  return staff || null;
};

const findStaffByEmail = async (businessId, email) => {
  const [staff] = await sql`
    SELECT * FROM staff_members
    WHERE business_id = ${businessId} AND invited_email = ${email.toLowerCase()}
  `;
  return staff || null;
};

const findStaffById = async (id, businessId) => {
  const [staff] = await sql`
    SELECT * FROM staff_members WHERE id = ${id} AND business_id = ${businessId}
  `;
  return staff || null;
};

const listStaff = async (businessId) => {
  return sql`
    SELECT sm.*, u.first_name, u.last_name, u.email AS user_email
    FROM staff_members sm
    LEFT JOIN users u ON u.id = sm.user_id
    WHERE sm.business_id = ${businessId} AND sm.status != 'REMOVED'
    ORDER BY sm.created_at ASC
  `;
};

const acceptStaffInvite = async (staffId, userId) => {
  const [staff] = await sql`
    UPDATE staff_members
    SET user_id = ${userId}, status = 'ACTIVE', joined_at = NOW(),
        invite_token_hash = NULL, updated_at = NOW()
    WHERE id = ${staffId}
    RETURNING *
  `;
  return staff;
};

const updateStaffPermissions = async (id, businessId, permissions) => {
  const [staff] = await sql`
    UPDATE staff_members
    SET permissions = ${sql.json(permissions)}, updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return staff;
};

const suspendStaff = async (id, businessId) => {
  const [staff] = await sql`
    UPDATE staff_members SET status = 'SUSPENDED', updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return staff;
};

const removeStaff = async (id, businessId) => {
  const [staff] = await sql`
    UPDATE staff_members SET status = 'REMOVED', updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return staff;
};

const countActiveStaff = async (businessId) => {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM staff_members
    WHERE business_id = ${businessId} AND status NOT IN ('REMOVED')
  `;
  return count;
};

module.exports = {
  createStaffInvite,
  findStaffByInviteToken,
  findStaffByEmail,
  findStaffById,
  listStaff,
  acceptStaffInvite,
  updateStaffPermissions,
  suspendStaff,
  removeStaff,
  countActiveStaff,
  defaultPermissions,
};
