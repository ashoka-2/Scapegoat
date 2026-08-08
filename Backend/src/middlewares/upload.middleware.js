import multer from "multer";

// Configure multer memory storage so file buffers are kept in memory for ImageKit upload
const storage = multer.memoryStorage();

// File filter: accept image formats
const fileFilter = (req, file, cb) => {
  if (file && file.mimetype && (file.mimetype.startsWith("image/") || file.mimetype === "application/octet-stream")) {
    cb(null, true);
  } else {
    cb(null, true); // Permissive filter to avoid Multer rejection errors during form parsing
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size per image
    fieldSize: 50 * 1024 * 1024, // 50MB max text field size (for descriptions containing Base64 images)
  },
});
