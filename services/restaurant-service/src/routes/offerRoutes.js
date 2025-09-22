const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { verifyToken, isOwner } = require('../middlewares/authMiddleware');

// Add a new offer (Owner only)
router.post('/add', verifyToken, isOwner, offerController.addOffer);

// Get all offers for owner's approved restaurants (Owner only)
router.get('/owner', verifyToken, isOwner, offerController.getOwnerOffers);

// Delete an offer (Owner only)
router.delete('/:offerId', verifyToken, isOwner, offerController.deleteOffer);

// Get all offers for a restaurant (Owner and Customer)
router.get('/restaurant/:restaurantId', offerController.getRestaurantOffers);

module.exports = router;