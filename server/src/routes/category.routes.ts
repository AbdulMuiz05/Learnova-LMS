import { Router } from 'express';
import * as categories from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { categorySchema, updateCategorySchema } from '../validators/course.validator';

const router = Router();

router.get('/', categories.listCategories);
router.get('/admin/all', authenticate, authorize('admin'), categories.listAllCategories);
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: categorySchema }),
  categories.createCategory
);
router.patch(
  '/:categoryId',
  authenticate,
  authorize('admin'),
  validate({ body: updateCategorySchema }),
  categories.updateCategory
);
router.delete('/:categoryId', authenticate, authorize('admin'), categories.deleteCategory);

export default router;
