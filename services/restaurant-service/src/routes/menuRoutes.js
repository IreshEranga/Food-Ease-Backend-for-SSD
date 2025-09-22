const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const upload = require('../middlewares/upload');
const { verifyToken, isOwner } = require("../middlewares/authMiddleware");

router.post('/', upload.single('image'), verifyToken, isOwner, menuController.createMenu);
router.get('/featuredMenu', menuController.getFeaturedMenu);
router.get('/restaurant/:restaurantID', menuController.getMenusByRestaurant);
router.get('/owner/:ownerID', verifyToken, menuController.getMenusByOwner);
router.delete('/:id', verifyToken, isOwner, menuController.deleteMenu);
router.put('/:id', upload.single('image'), verifyToken, isOwner, menuController.updateMenu); 
router.get('/owner/restaurant-counts', menuController.getMenuItemsCountByRestaurant);


module.exports = router;