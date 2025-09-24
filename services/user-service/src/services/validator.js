const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting configurations
const createAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 account creation requests per windowMs
  message: {
    error: 'Too many account creation attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 forgot password requests per hour
  message: {
    error: 'Too many password reset attempts from this IP, please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character');

const emailValidation = body('email')
  .isEmail()
  .withMessage('Please provide a valid email address')
  .normalizeEmail()
  .isLength({ max: 100 })
  .withMessage('Email must not exceed 100 characters');

const nameValidation = body('name')
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage('Name must be between 2 and 50 characters')
  .matches(/^[a-zA-Z\s]+$/)
  .withMessage('Name can only contain letters and spaces');

const mobileNumberValidation = body('mobileNumber')
  .isMobilePhone('any')
  .withMessage('Please provide a valid mobile number')
  .isLength({ min: 10, max: 15 })
  .withMessage('Mobile number must be between 10 and 15 digits');

const addressValidation = body('address')
  .trim()
  .isLength({ min: 10, max: 200 })
  .withMessage('Address must be between 10 and 200 characters')
  .matches(/^[a-zA-Z0-9\s,.-]+$/)
  .withMessage('Address contains invalid characters');

const vehicleNumberValidation = body('vehicleNumber')
  .trim()
  .isLength({ min: 5, max: 15 })
  .withMessage('Vehicle number must be between 5 and 15 characters')
  .matches(/^[A-Z0-9-]+$/i)
  .withMessage('Vehicle number can only contain letters, numbers, and hyphens');

// Validation rule sets
const adminSignupValidation = [
  nameValidation,
  emailValidation,
  mobileNumberValidation,
  passwordValidation
];

const ownerSignupValidation = [
  nameValidation,
  emailValidation,
  mobileNumberValidation,
  passwordValidation
];

const customerSignupValidation = [
  nameValidation,
  emailValidation,
  mobileNumberValidation,
  addressValidation,
  passwordValidation
];

const riderSignupValidation = [
  nameValidation,
  emailValidation,
  mobileNumberValidation,
  vehicleNumberValidation,
  passwordValidation
];

const loginValidation = [
  emailValidation,
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  emailValidation
];

const resetPasswordValidation = [
  body('userID')
    .notEmpty()
    .withMessage('User ID is required')
    .isLength({ max: 50 })
    .withMessage('Invalid user ID format'),
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid token format'),
  passwordValidation
];

module.exports = {
  // Rate limiters
  createAccountLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  
  // Validation rule sets
  adminSignupValidation,
  ownerSignupValidation,
  customerSignupValidation,
  riderSignupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
};