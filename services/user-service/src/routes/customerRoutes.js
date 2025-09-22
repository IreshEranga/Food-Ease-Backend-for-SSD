const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const { verifyToken, isAdmin, isCustomer, isOwner } = require("../middlewares/authMiddleware");

router.get("/count", verifyToken, isAdmin, customerController.getCustomerCount);
router.get("/customerGrowth/:weekOffset", verifyToken, isAdmin, customerController.getCustomerGrowthForWeek);
router.get("/all", verifyToken, isAdmin, customerController.getCustomers);
router.get('/profile', verifyToken, isCustomer, customerController.getProfile);
router.put('/profile', verifyToken, isCustomer, customerController.updateCustomerProfile);
router.get('/:id', verifyToken, isOwner, customerController.getCustomerById);

module.exports = router;