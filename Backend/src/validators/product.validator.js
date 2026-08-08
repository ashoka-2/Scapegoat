import { body, param, validationResult } from "express-validator";

export function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.error("Product Validation Errors:", JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({
      success: false,
      message: errors.array()[0]?.msg || "Validation error",
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
    .isLength({ max: 500 })
    .withMessage("Title cannot exceed 500 characters"),

  body("description")
    .notEmpty()
    .withMessage("Product description is required")
    .isString(),

  body("category")
    .notEmpty()
    .withMessage("Category is required"),

  validateRequest,
];

export const validateUpdateProduct = [
  param("id")
    .isMongoId()
    .withMessage("Invalid Product ID format"),

  body("title")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Title cannot exceed 500 characters"),

  body("description")
    .optional({ checkFalsy: true })
    .isString(),

  validateRequest,
];
