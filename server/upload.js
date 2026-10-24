
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const uploadDirectory = path.join(currentDirectory, 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${randomUUID()}${extension}`);
    },
});

const allowedTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
]);

const fileFilter = (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
        return callback(
            new Error('Only JPG, PNG, and WebP images are allowed.')
        );
    }

    callback(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
});

export const uploadPetPhoto = upload.single('image');
