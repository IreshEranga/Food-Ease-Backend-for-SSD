// const express = require("express");
// const { adminSignup, ownerSignup, customerSignup, login, forgotPassword, resetPassword, riderSignup } = require("../controllers/authController");

// const router = express.Router();

// router.post("/signup/admin", adminSignup);
// router.post("/signup/owner", ownerSignup);
// router.post("/signup/customer", customerSignup);
// router.post("/signup/rider", riderSignup);
// router.post("/login", login);
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);

// module.exports = router;


const express = require("express");
const passport = require("passport");

const { 
  adminSignup, 
  ownerSignup, 
  customerSignup, 
  login, 
  forgotPassword, 
  resetPassword, 
  riderSignup,
  googleLoginCallback 
} = require("../controllers/authController");

const {
  createAccountLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  adminSignupValidation,
  ownerSignupValidation,
  customerSignupValidation,
  riderSignupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} = require("../services/validator");

const router = express.Router();

// Apply rate limiting and validation to routes
router.post("/signup/admin", 
  createAccountLimiter, 
  adminSignupValidation, 
  adminSignup
);

router.post("/signup/owner", 
  createAccountLimiter, 
  ownerSignupValidation, 
  ownerSignup
);

router.post("/signup/customer", 
  createAccountLimiter, 
  customerSignupValidation, 
  customerSignup
);

router.post("/signup/rider", 
  createAccountLimiter, 
  riderSignupValidation, 
  riderSignup
);

router.post("/login", 
  loginLimiter, 
  loginValidation, 
  login
);

router.post('/forgot-password', 
  forgotPasswordLimiter, 
  forgotPasswordValidation, 
  forgotPassword
);

router.post('/reset-password', 
  resetPasswordValidation, 
  resetPassword
);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false, // Disable session for JWT-based auth,

  })
);

router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`
  }), 
  googleLoginCallback
);

module.exports = router;