import { body, param, query, validationResult } from "express-validator";

export function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
}

export const validateCreateProduct = [
  body("title")
    .notEmpty()
    .withMessage("Product title is required")
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),

  body("description")
    .notEmpty()
    .withMessage("Product description is required")
    .isString()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isMongoId()
    .withMessage("Invalid Category ID format"),

  body("brand")
    .optional()
    .isMongoId()
    .withMessage("Invalid Brand ID format"),

  body("unit")
    .optional()
    .isMongoId()
    .withMessage("Invalid Unit ID format"),

  body("maxPrice.amount")
    .notEmpty()
    .withMessage("Maximum price amount is required")
    .isFloat({ min: 0 })
    .withMessage("Max price cannot be negative"),

  body("maxPrice.currency")
    .optional()
    .isIn(["INR", "USD", "EUR", "AED"])
    .withMessage("Unsupported currency"),

  body("sellingPrice.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Selling price cannot be negative"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("manageStock")
    .optional()
    .isBoolean()
    .withMessage("manageStock must be a boolean"),

  body("productType")
    .optional()
    .isIn(["physical", "downloadable"])
    .withMessage("productType must be physical or downloadable"),

  body("status")
    .optional()
    .isIn(["draft", "published", "trash"])
    .withMessage("status must be draft, published, or trash"),

  validateRequest,
];

export const validateUpdateProduct = [
  param("id")
    .isMongoId()
    .withMessage("Invalid Product ID format"),

  body("title")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),

  body("description")
    .optional()
    .isString()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid Category ID format"),

  body("maxPrice.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max price cannot be negative"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("manageStock")
    .optional()
    .isBoolean()
    .withMessage("manageStock must be a boolean"),

  body("status")
    .optional()
    .isIn(["draft", "published", "trash"])
    .withMessage("status must be draft, published, or trash"),

  validateRequest,
];
