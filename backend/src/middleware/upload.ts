import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const uploadPath = path.resolve(config.uploadDir);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const imageExtensions = new Set([
    '.jpeg', '.jpg', '.jfif', '.png', '.gif', '.webp',
    '.bmp', '.tif', '.tiff', '.avif', '.heic', '.heif',
  ]);
  const imageAndPdfExtensions = new Set([...imageExtensions, '.pdf']);
  const documentExtensions = new Set(['.doc', '.docx']);
  const documentMimeTypes = new Set([
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);
  const extension = path.extname(file.originalname).toLowerCase();
  const isImage =
    (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') ||
    (extension === '.jfif' && file.mimetype === 'application/octet-stream');
  const isCertificateImageOrPdf =
    file.fieldname === 'certificate' &&
    imageAndPdfExtensions.has(extension) &&
    (file.mimetype === 'application/pdf' || isImage);
  const isCertificateDocument =
    file.fieldname === 'certificate' &&
    documentExtensions.has(extension) &&
    documentMimeTypes.has(file.mimetype);

  if (isImage || isCertificateImageOrPdf || isCertificateDocument) cb(null, true);
  else cb(new Error('Only images are allowed; certificates may also use PDF, DOC, or DOCX'));
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
