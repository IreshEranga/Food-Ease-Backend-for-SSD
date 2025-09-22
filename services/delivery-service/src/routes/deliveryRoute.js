const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { findNearestDriverAndNotify } = require('../controllers/findNearestDriverAndNotify');

// CRUD Routes
router.post('/', deliveryController.createDelivery);
router.get('/', deliveryController.getAllDeliveries);
router.post('/nearest', deliveryController.findNearestDriverAndNotify);
router.post('/create', deliveryController.createDelivery);
router.get('/:id', deliveryController.getDeliveryById);
router.put('/:id', deliveryController.updateDelivery);
router.delete('/:id', deliveryController.deleteDelivery);
router.get('/driver/:driverId', deliveryController.getDeliveriesByDriverId);


module.exports = router;