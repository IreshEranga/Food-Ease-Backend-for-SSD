const express = require('express');
const router = express.Router();
const riderController = require('../controllers/deliveryRiderController');
const { verifyToken, isRider } = require('../middlewares/authMiddleware'); // Import the existing auth middleware
const { isAdmin } = require("../middlewares/authMiddleware");






router
    .route('/')
    .post(riderController.createRider)
    .get(riderController.getAllRiders);

router
    .route('/:id')
    .get(riderController.getRiderById)
    .put(riderController.updateRider)
    .delete(riderController.deleteRider);

module.exports = router;



