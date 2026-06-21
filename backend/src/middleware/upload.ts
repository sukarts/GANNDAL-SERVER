import multer from 'multer';

// Stockage en mémoire — le buffer est ensuite poussé vers S3
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 Go (vidéos)
});
