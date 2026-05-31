const { Router } = require('express');
const c = require('./business.controller');
const { validate } = require('../../middleware/validate.middleware');
const s = require('./business.schema');

const router = Router();

router.get('/', c.getProfile);
router.put('/', validate(s.updateBusinessSchema), c.updateBusiness);
router.put('/seo', validate(s.seoSchema), c.updateSeo);
router.post('/logo', validate(s.uploadUrlSchema), c.uploadLogo);
router.post('/favicon', validate(s.uploadUrlSchema), c.uploadFavicon);
router.put('/address', validate(s.addressSchema), c.upsertAddress);
router.post('/documents', validate(s.uploadDocumentSchema), c.uploadDocument);
router.get('/documents', c.listDocuments);
router.put('/brand-settings', validate(s.brandSettingsSchema), c.updateBrandSettings);

router.get('/social-links', c.listSocialLinks);
router.post('/social-links', validate(s.socialLinkSchema), c.createSocialLink);
router.put('/social-links/reorder', validate(s.reorderSchema), c.reorderSocialLinks);
router.put('/social-links/:linkId', c.updateSocialLink);
router.delete('/social-links/:linkId', c.deleteSocialLink);

router.put('/chatbot', validate(s.chatbotSchema), c.upsertChatbot);

router.post('/bank-account/verify-account', validate(s.verifyAccountSchema), c.verifyBankAccount);
router.post('/bank-account', validate(s.bankAccountSchema), c.createBankAccount);
router.get('/bank-account', c.getBankAccount);
router.put('/bank-account', validate(s.bankAccountSchema), c.updateBankAccount);
router.delete('/bank-account', c.deleteBankAccount);

router.post('/domains/subdomain', validate(s.subdomainSchema), c.claimSubdomain);
router.post('/domains/custom', validate(s.customDomainSchema), c.connectCustomDomain);
router.post('/domains/:domainId/verify', c.verifyDomain);
router.delete('/domains/:domainId', c.deleteDomain);

router.post('/integrations/payment/connect', validate(s.paymentIntegrationSchema), c.connectPaymentGateway);
router.delete('/integrations/payment/:gateway/disconnect', c.disconnectPaymentGateway);

module.exports = router;
