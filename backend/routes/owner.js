const router = require("express").Router();
const { body } = require("express-validator");
const ownerController = require("../controllers/ownerController");
const { authenticate, requireRoles } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

router.use(authenticate, requireRoles("OWNER", "ADMIN"));

router.post(
  "/spaces",
  [
    body("spaceName").trim().notEmpty().withMessage("spaceName is required"),
    body("address").trim().notEmpty().withMessage("address is required"),
    body("lat").isFloat({ min: -90, max: 90 }).withMessage("lat must be between -90 and 90"),
    body("lng").isFloat({ min: -180, max: 180 }).withMessage("lng must be between -180 and 180"),
    body("allowedRadius").isFloat({ gt: 0 }).withMessage("allowedRadius must be a positive number")
  ],
  validateRequest,
  ownerController.createSpace
);

router.get("/spaces", ownerController.listSpaces);
router.get("/requests", ownerController.listRequests);

module.exports = router;
