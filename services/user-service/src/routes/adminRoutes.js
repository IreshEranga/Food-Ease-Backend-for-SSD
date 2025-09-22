const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminControllers");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

router.get("/count", verifyToken, isAdmin, adminController.getAdminCount);


module.exports = router;