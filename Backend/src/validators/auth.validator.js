import { body, validationResult } from "express-validator";

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

export const validateRegisterUser = [
  body("email").isEmail().withMessage("invalid email format"),
  body("contact")
    .notEmpty()
    .withMessage("Contact is required")
    .customSanitizer((value) => (value ? String(value).replace(/^(\+91|91|\+)/, "") : value))
    .matches(/^\d{10}$/)
    .withMessage("contact must be a 10-digit number"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("password must be atleast 6 characters long"),
  body("fullname")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3 })
    .withMessage("Full Name must be atleast 3 charaacters long"),
  body("isSeller").isBoolean().withMessage("IsSeller must be a boolean value"),
  validateRequest,
];


export const validateLoginUser = [
    body("identifier")
        .notEmpty()
        .withMessage("Email or Contact is required"),
    body("password").notEmpty().withMessage("Password is required"),
    validateRequest,
];
