import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory before uploading to Supabase
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

export const uploadSingle = upload.single('image');

export default upload;
