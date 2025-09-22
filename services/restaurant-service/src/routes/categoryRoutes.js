const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController'); 

router.get('/categoryCount', categoryController.getCategoryCount);

router.get('/getRestaurantsByCategory/:categoryName', categoryController.getRestaurantsByCategory);
// Add category for a restaurant
router.post('/add/:restaurantName', categoryController.addCategoryForRestaurant);

// Fetch all categories by owner
router.get('/owner/:ownerID', categoryController.getCategoriesByOwner);

// Fetch categories by owner and restaurant name
router.get('/owner/:ownerID/restaurant/:restaurantName', categoryController.getCategoriesByRestaurant);

module.exports = router;