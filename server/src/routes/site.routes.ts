import { Router } from 'express';
import * as site from '../controllers/site.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { faqSchema, homepageSchema, settingsSchema, updateFaqSchema } from '../validators/site.validator';

const router = Router();

router.get('/homepage', site.getHomepageData);
router.get('/faqs', site.listPublicFaqs);
router.get('/settings', site.getPublicSettings);

router.get('/admin/site-content', authenticate, authorize('admin'), site.getAdminSiteContent);
router.patch(
  '/homepage',
  authenticate,
  authorize('admin'),
  validate({ body: homepageSchema }),
  site.updateHomepage
);
router.get('/admin/faqs', authenticate, authorize('admin'), site.listAllFaqs);
router.post(
  '/admin/faqs',
  authenticate,
  authorize('admin'),
  validate({ body: faqSchema }),
  site.createFaq
);
router.patch(
  '/admin/faqs/:faqId',
  authenticate,
  authorize('admin'),
  validate({ body: updateFaqSchema }),
  site.updateFaq
);
router.delete('/admin/faqs/:faqId', authenticate, authorize('admin'), site.deleteFaq);
router.patch(
  '/admin/settings',
  authenticate,
  authorize('admin'),
  validate({ body: settingsSchema }),
  site.updateSettings
);

export default router;
