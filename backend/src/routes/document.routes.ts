import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { DocumentController } from '../controllers/document.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { getUploadPath } from '../utils/uploadPath';

const router = Router();

// ── Multer config ────────────────────────────────────────────────
const UPLOAD_DIR = getUploadPath('documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX'));
    }
  },
});

// ── Routes ───────────────────────────────────────────────────────
router.use(authMiddleware, roleMiddleware('ADMIN'));

router.get('/', asyncHandler(DocumentController.list));

router.get('/user/:userId', asyncHandler(DocumentController.getByUserId));

router.post(
  '/user/:userId',
  upload.array('files', 20),
  asyncHandler(DocumentController.upload),
);

router.delete('/:id', asyncHandler(DocumentController.remove));

export default router;
