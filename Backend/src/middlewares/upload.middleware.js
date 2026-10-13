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
    // 25MB max file size allows high-resolution canvas banner PNG exports
    fileSize: 25 * 1024 * 1024,
    // 25MB max field size allows rich JSON elements with embedded graphics without LIMIT_FIELD_VALUE
    fieldSize: 25 * 1024 * 1024,
  },
});
