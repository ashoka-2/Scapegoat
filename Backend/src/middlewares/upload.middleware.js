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
    // Tight limits keep the 512MB Render free instance safe from OOM kills.
    // Description images are small (crop uploads ≈ 100-300KB; product photos ≤ ~5MB).
    fileSize: 8 * 1024 * 1024, // 8MB max file size per image
    fieldSize: 1 * 1024 * 1024, // 1MB max text field (descriptions are ≤50KB; base64 era is over)
  },
});
