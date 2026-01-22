const router = require("express").Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");
const { authenticate } = require("../middleware/authMiddleware");

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("email").isEmail().withMessage("valid email required"),
    body("password").isLength({ min: 8 }).withMessage("password must be at least 8 characters"),
    body("role").isIn(["VENDOR", "OWNER", "ADMIN"]).withMessage("role must be VENDOR, OWNER, or ADMIN"),
    body("phone").optional().isString()
  ],
  validateRequest,
  authController.register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("valid email required"),
    body("password").isLength({ min: 8 }).withMessage("password must be at least 8 characters")
  ],
  validateRequest,
  authController.login
);

router.get("/me", authenticate, authController.me);

module.exports = router;
