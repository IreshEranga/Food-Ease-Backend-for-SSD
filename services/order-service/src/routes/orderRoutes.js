const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  updateOrderPaymentStatus,
  getTotalOrderCount,
  getYesterdayOrderCount,
  getDailyOrderCounts,
  getAllOrders,
  updateOrderStatusByOwner,
  getOrderCountsByStatus,
  getOrdersByUserId
} = require('../controllers/orderController');
const { verifyToken, isAdmin, isOwner } = require("../middlewares/authMiddleware");

router.post('/', createOrder);
router.get('/totalOrders', verifyToken, isAdmin, getTotalOrderCount);
router.get('/yesterday-orders', verifyToken, isAdmin, getYesterdayOrderCount);
router.get('/daily-orders', verifyToken, isAdmin, getDailyOrderCounts);
router.get('/', verifyToken, getAllOrders);
router.get('/:id', verifyToken, getOrderById);
router.put('/:id/status', verifyToken, isAdmin, updateOrderPaymentStatus);
router.put('/:id/status/owner', verifyToken, isOwner, updateOrderStatusByOwner);
router.get('/owner/:ownerId/status-counts', verifyToken, isOwner, getOrderCountsByStatus);
router.get('/user/:userId', getOrdersByUserId);

module.exports = router;