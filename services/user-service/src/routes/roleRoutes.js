const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

router.post("/", verifyToken, isAdmin, roleController.createRole);
router.get("/", verifyToken, isAdmin, roleController.getRoles);
router.get("/:id", verifyToken, isAdmin, roleController.getRoleById);
router.put("/:id", verifyToken, isAdmin, roleController.updateRole);
router.delete("/:id", verifyToken, isAdmin, roleController.deleteRole);

module.exports = router;
