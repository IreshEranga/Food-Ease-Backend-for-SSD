const express = require("express");
const router = express.Router();
const ownerController = require("../controllers/ownerController");
const { verifyToken, isAdmin, isOwner } = require("../middlewares/authMiddleware");

router.get("/count", verifyToken, isAdmin, ownerController.getOwnerCount);
router.get("/all", verifyToken, isAdmin, ownerController.getOwners);
router.get('/:ownerId/name', verifyToken, isOwner, ownerController.getOwnerNameById);
router.get('/:ownerId/profile', verifyToken, isOwner, ownerController.getOwnerProfile);
router.put('/:ownerId/profile', verifyToken, isOwner, ownerController.updateOwnerProfile);

module.exports = router;