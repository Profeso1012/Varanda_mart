const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const crypto = require('crypto');
const emailConfig = require('../../config/email');
const { config } = require('../../config/env');
const { getSubscriptionByBusinessId } = require('../../db/queries/subscriptions.queries');
const { findUserByEmail } = require('../../db/queries/users.queries');
const {
  createStaffInvite, findStaffByInviteToken, findStaffByEmail, findStaffById,
  listStaff, acceptStaffInvite, updateStaffPermissions, suspendStaff, removeStaff,
  countActiveStaff, defaultPermissions,
} = require('../../db/queries/staff.queries');

// GET /api/v1/staff
const list = asyncHandler(async (req, res) => {
  const staff = await listStaff(req.businessId);
  res.json({ success: true, data: { staff } });
});

// POST /api/v1/staff/invite
const invite = asyncHandler(async (req, res) => {
  const { email, permissions } = req.body;

  // Check plan seat limit
  const sub = await getSubscriptionByBusinessId(req.businessId);
  const maxSeats = sub?.max_staff_seats;
  if (maxSeats) {
    const current = await countActiveStaff(req.businessId);
    if (current >= maxSeats) {
      throw new AppError(
        `Staff seat limit (${maxSeats}) reached for your plan. Upgrade to add more.`,
        403,
        'PLAN_LIMIT'
      );
    }
  }

  // Check not already invited or owner
  const existing = await findStaffByEmail(req.businessId, email);
  if (existing && existing.status !== 'REMOVED') {
    throw new AppError('This email has already been invited to your store.', 409, 'CONFLICT');
  }

  // Check not the owner themselves
  if (req.user.email.toLowerCase() === email.toLowerCase()) {
    throw new AppError('You cannot invite yourself as a staff member.', 409, 'CONFLICT');
  }

  const { staff, inviteToken } = await createStaffInvite(req.businessId, {
    invitedEmail: email,
    permissions: permissions || defaultPermissions(),
  });

  // Send invite email
  const inviteUrl = `${config.sellerDashboardUrl}/staff/accept?token=${inviteToken}`;
  emailConfig
    .sendEmail(
      email,
      `You've been invited to join a store on Varanda`,
      `You've been invited to join a store on Varanda as a staff member. Click the link below to accept:\n\n${inviteUrl}\n\nThis link expires in 7 days.`
    )
    .catch(() => {});

  res.status(201).json({
    success: true,
    data: {
      staff: {
        id: staff.id,
        invitedEmail: staff.invited_email,
        status: staff.status,
        permissions: staff.permissions,
      },
      message: `Invite sent to ${email}.`,
    },
  });
});

// POST /api/v1/staff/accept-invite
// No auth required — the invitee may not have an account yet.
// If they do, we link their user_id. If not, they need to register first.
const acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const staff = await findStaffByInviteToken(tokenHash);
  if (!staff) {
    throw new AppError('Invalid or expired invite link.', 400, 'INVALID_TOKEN');
  }

  // Find user by invited email
  const user = await findUserByEmail(staff.invited_email);
  if (!user) {
    throw new AppError(
      'No Varanda account found for this email. Please register first, then use the invite link.',
      400,
      'ACCOUNT_REQUIRED'
    );
  }

  const updated = await acceptStaffInvite(staff.id, user.id);

  res.json({
    success: true,
    data: {
      staff: {
        id: updated.id,
        businessId: updated.business_id,
        businessName: staff.business_name,
        status: updated.status,
        permissions: updated.permissions,
        joinedAt: updated.joined_at,
      },
      message: 'Invite accepted. You can now log in to access this store.',
    },
  });
});

// PUT /api/v1/staff/:staffId/permissions
const updatePermissions = asyncHandler(async (req, res) => {
  const staff = await findStaffById(req.params.staffId, req.businessId);
  if (!staff) throw new AppError('Staff member not found.', 404, 'NOT_FOUND');
  if (staff.status === 'REMOVED') throw new AppError('Staff member has been removed.', 400, 'INVALID_STATUS');

  const updated = await updateStaffPermissions(req.params.staffId, req.businessId, req.body.permissions);
  res.json({ success: true, data: { staff: updated } });
});

// PUT /api/v1/staff/:staffId/suspend
const suspend = asyncHandler(async (req, res) => {
  const staff = await findStaffById(req.params.staffId, req.businessId);
  if (!staff) throw new AppError('Staff member not found.', 404, 'NOT_FOUND');
  if (staff.status === 'REMOVED') throw new AppError('Staff member has been removed.', 400, 'INVALID_STATUS');

  const updated = await suspendStaff(req.params.staffId, req.businessId);
  res.json({ success: true, data: { staff: updated } });
});

// DELETE /api/v1/staff/:staffId
const remove = asyncHandler(async (req, res) => {
  const staff = await findStaffById(req.params.staffId, req.businessId);
  if (!staff) throw new AppError('Staff member not found.', 404, 'NOT_FOUND');

  await removeStaff(req.params.staffId, req.businessId);
  res.json({ success: true, data: { message: 'Staff member removed.' } });
});

module.exports = { list, invite, acceptInvite, updatePermissions, suspend, remove };
