import { Router } from 'express';
import * as uploads from '../controllers/upload.controller';
import { authenticate, authorize } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';

const router = Router();

router.use(authenticate, authorize('admin'));
router.get('/status', uploads.getUploadStatus);
router.post('/signature', uploads.createSignature);
router.post('/image', uploadImage, uploads.uploadImage);

export default router;
