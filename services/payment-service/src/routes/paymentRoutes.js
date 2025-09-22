// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const {
  startPayment,
  handleNotification,
} = require("../controllers/paymentController");

router.post("/start", startPayment);
router.post("/notify", handleNotification);

module.exports = router;