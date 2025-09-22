const express = require("express");
const { adminSignup, ownerSignup, customerSignup, login, forgotPassword, resetPassword, riderSignup } = require("../controllers/authController");

const router = express.Router();

router.post("/signup/admin", adminSignup);
router.post("/signup/owner", ownerSignup);
router.post("/signup/customer", customerSignup);
router.post("/signup/rider", riderSignup);
router.post("/login", login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
