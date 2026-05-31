const { Router } = require('express');
const c = require('./staff.controller');
const { validate } = require('../../middleware/validate.middleware');
const { requireHybridSellerRole } = require('../../middleware/auth.middleware');
const { inviteSchema, acceptInviteSchema, updatePermissionsSchema } = require('./staff.schema');

const router = Router();

router.get('/', c.list);
router.post('/invite', validate(inviteSchema), c.invite);
// accept-invite is public — the invitee may not be a seller
router.post('/accept-invite', validate(acceptInviteSchema), c.acceptInvite);
router.put('/:staffId/permissions', validate(updatePermissionsSchema), c.updatePermissions);
router.put('/:staffId/suspend', c.suspend);
router.delete('/:staffId', c.remove);

module.exports = router;
