"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const uploadPath = path_1.default.resolve(config_1.config.uploadDir);
if (!fs_1.default.existsSync(uploadPath)) {
    fs_1.default.mkdirSync(uploadPath, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadPath),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path_1.default.extname(file.originalname)}`);
    },
});
const fileFilter = (_req, file, cb) => {
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
    const extension = path_1.default.extname(file.originalname).toLowerCase();
    const isImage = (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') ||
        (extension === '.jfif' && file.mimetype === 'application/octet-stream');
    const isCertificateImageOrPdf = file.fieldname === 'certificate' &&
        imageAndPdfExtensions.has(extension) &&
        (file.mimetype === 'application/pdf' || isImage);
    const isCertificateDocument = file.fieldname === 'certificate' &&
        documentExtensions.has(extension) &&
        documentMimeTypes.has(file.mimetype);
    if (isImage || isCertificateImageOrPdf || isCertificateDocument)
        cb(null, true);
    else
        cb(new Error('Only images are allowed; certificates may also use PDF, DOC, or DOCX'));
};
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
});
//# sourceMappingURL=upload.js.map