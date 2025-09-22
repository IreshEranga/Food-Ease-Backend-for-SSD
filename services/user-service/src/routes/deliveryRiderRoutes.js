const express = require('express');
const router = express.Router();
const riderController = require('../controllers/deliveryRiderController');
const { verifyToken, isRider } = require('../middlewares/authMiddleware'); // Import the existing auth middleware
const { isAdmin } = require("../middlewares/authMiddleware");

// Route for fetching rider profile
router.get('/profile', verifyToken, isRider, riderController.getRiderProfile);
router.post('/create', verifyToken, isAdmin, riderController.getRiderProfile);
router.get("/all", verifyToken, isAdmin, riderController.getAllRiders);
router.get("/:id",  riderController.getRiderProfile);
router.put('/update/:id', verifyToken, isAdmin, riderController.updateRiderById);
router.put('/rupdate/:id', verifyToken, isRider, riderController.updateRiderById);
router.delete('/delete/:id', verifyToken, isAdmin, riderController.deleteRider);
router.delete('/rdelete/:id', verifyToken, isRider, riderController.deleteRider);
module.exports = router;
