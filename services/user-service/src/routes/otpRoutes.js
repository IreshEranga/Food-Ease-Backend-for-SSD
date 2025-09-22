const express = require('express');
const router = express.Router();
const { sendOtpEmail, verifyOtp } = require('../../emailService');

// Route to send OTP
router.post('/send', async (req, res) => {
  const { to } = req.body; // Email address to send OTP to
  const result = await sendOtpEmail(to);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

// Route to verify OTP
router.post('/verify', (req, res) => {
  const { to, code } = req.body; // Email and OTP to verify
  const result = verifyOtp(to, code);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

module.exports = router;