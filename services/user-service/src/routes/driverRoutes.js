const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driverController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

router.get("/count", verifyToken, isAdmin, driverController.getDriverCount);
router.get("/", verifyToken, isAdmin, driverController.getAllDrivers);
router.patch("/:riderID", verifyToken, isAdmin, driverController.updateDriver);
router.delete("/:riderID", verifyToken, isAdmin, driverController.deleteDriver);

module.exports = router;