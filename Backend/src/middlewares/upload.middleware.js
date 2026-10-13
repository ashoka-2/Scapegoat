import multer from "multer";

// Configure multer memory storage so file buffers are kept in memory for ImageKit upload
const storage = multer.memoryStorage();

// Banner/product uploads are rendered in browsers. Reject SVG and arbitrary
// octet streams so an uploaded file cannot become script-capable content.
const fileFilter = (req, file, cb) => {
  const safeImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  if (file && safeImageTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file?.fieldname));
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
