// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const dotenv = require("dotenv");
// const { validationResult } = require("express-validator");
// const crypto = require("crypto");
// const nodemailer = require("nodemailer");

// dotenv.config();

// const Admin = require("../models/Admin");
// const Customer = require("../models/Customer");
// const RestaurantOwner = require("../models/RestaurantOwner");
// const PasswordResetToken =  require("../models/PasswordResetToken");
// const DeliveryRider = require("../models/Driver");

// // Hash password
// const hashPassword = async (password) => {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash(password, salt);
// };

// // Generate JWT token
// const generateToken = (userID, roleID) => {
//   return jwt.sign({ userID, roleID }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN,
//   });
// };

// // Admin Signup
// exports.adminSignup = async (req, res) => {
//   try {
//     const { name, email, mobileNumber, password } = req.body;
//     const hashedPassword = await hashPassword(password);
//         //const adminID = `admin${Date.now()}`;

//         const newAdmin = new Admin({name, email, mobileNumber, password: hashedPassword, roleID: "role1" });
//         // await newAdmin.save();

//     const savedAdmin = await newAdmin.save();

//         const token = generateToken(savedAdmin.adminID, "role1");
//     res.status(201).json({
//       message: "Admin registered successfully!",
//       token,
//             adminID: savedAdmin.adminID
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error registering admin", error });
//   }
// };

// // Restaurant Owner Signup
// exports.ownerSignup = async (req, res) => {
//   try {
//         const { name, email,mobileNumber, password } = req.body;
//     const hashedPassword = await hashPassword(password);

//     const newOwner = new RestaurantOwner({
//       name,
//       email,
//       mobileNumber,
//       password: hashedPassword,
//       roleID: "role2",
//     });

//     const savedOwner = await newOwner.save();

//     const token = generateToken(savedOwner._id.toString(), "role2");

//     res.status(201).json({
//       message: "Restaurant Owner registered successfully!",
//       token,
//       ownerID: savedOwner._id,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error registering owner", error });
//   }
// };

// // Customer Signup
// exports.customerSignup = async (req, res) => {
//   try {
//     const { name, email, mobileNumber, address, password } = req.body;
//     // Check for existing email or mobileNumber
//     const existingCustomer = await Customer.findOne({
//       $or: [{ email }, { mobileNumber }],
//     });
//     if (existingCustomer) {
//       return res.status(400).json({
//         message: "Email or mobile number already registered",
//       });
//     }
//     const hashedPassword = await hashPassword(password);
//     const newCustomer = new Customer({
//       name,
//       email,
//       mobileNumber,
//       address,
//       password: hashedPassword,
//       roleID: "role3",
//     });
//     const savedCustomer = await newCustomer.save();
//     const token = generateToken(savedCustomer.customerID, "role3");
//     res.status(201).json({
//       message: "Customer registered successfully!",
//       token,
//       customerID: savedCustomer.customerID,
//     });
//   } catch (error) {
//     console.error("Customer signup error:", error);
//     res.status(500).json({ message: "Error registering customer", error: error.message });
//   }
// };

// // Login (for Admin, Owner, and Customer)
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     let user =
//       (await Admin.findOne({ email })) ||
//       (await RestaurantOwner.findOne({ email })) ||
//       (await DeliveryRider.findOne({ email })) ||
//       (await Customer.findOne({ email }));

//     if (!user) return res.status(400).json({ message: "Invalid email or password" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

//     const userID = user._id.toString();
//     const token = generateToken(userID, user.roleID);

//     res.status(200).json({ message: "Login successful", token });
//   } catch (error) {
//     res.status(500).json({ message: "Error logging in", error });
//   }
// };

// const transporter = nodemailer.createTransport({
//   service: "Gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// exports.riderSignup = async (req, res) => {
//   try {
//     const { name, email, mobileNumber, password, vehicleNumber } = req.body;

//     // Check for existing email or mobileNumber
//     const existingRider = await DeliveryRider.findOne({
//       $or: [{ email }, { mobileNumber }, { vehicleNumber }],
//     });
//     if (existingRider) {
//       return res.status(400).json({
//         message: "Email, mobile number, or vehicle number already registered",
//       });
//     }

//     const hashedPassword = await hashPassword(password);

//     const newRider = new DeliveryRider({
//       name,
//       email,
//       mobileNumber,
//       password: hashedPassword,
//       vehicleNumber,
//       roleID: "role4", 
//     });

//     const savedRider = await newRider.save();

//     const token = generateToken(savedRider.riderID, "role4");

//     res.status(201).json({
//       message: "Delivery Rider registered successfully!",
//       token,
//       riderID: savedRider.riderID,
//     });
//   } catch (error) {
//     console.error("Rider signup error:", error);
//     res.status(500).json({ message: "Error registering rider", error: error.message });
//   }
// };




// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//         // Check if user exists in any collection
//         let user = await Admin.findOne({ email }) ||
//                    await RestaurantOwner.findOne({ email }) ||
//                    await Customer.findOne({ email });

//     if (!user) {
//             return res.status(404).json({ message: 'No user found with this email' });
//     }

//         // Generate reset token
//         const resetToken = crypto.randomBytes(32).toString('hex');
//         const userID = user.adminID || user.ownerID || user.customerID;

//         // Save reset token to PasswordResetToken collection
//     await PasswordResetToken.create({
//       userID,
//       roleID: user.roleID,
//       token: resetToken,
//     });

//         // Create reset URL
//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&userID=${userID}`;

//         // HTML Email Template
//     const htmlTemplate = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Password Reset - TastiGo</title>
//         <style>
//           body {
//             font-family: 'Poppins', Arial, sans-serif;
//             background-color: #f4f4f4;
//             margin: 0;
//             padding: 0;
//             color: #333;
//           }
//           .container {
//             max-width: 600px;
//             margin: 20px auto;
//             background-color: #ffffff;
//             border-radius: 10px;
//             box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
//             overflow: hidden;
//           }
//           .header {
//             background-color: #ff5733;
//             padding: 20px;
//             text-align: center;
//             color: #ffffff;
//           }
//           .header img {
//             max-width: 150px;
//             display: flex;
//           }
//           .content {
//             padding: 30px;
//             text-align: center;
//           }
//           .content h1 {
//             color: #ff5733;
//             font-size: 24px;
//             margin-bottom: 20px;
//           }
//           .content p {
//             font-size: 16px;
//             line-height: 1.5;
//             margin-bottom: 20px;
//           }
//           .btn {
//             display: inline-block;
//             padding: 12px 24px;
//             background-color: #ff5733;
//             color: #ffffff;
//             text-decoration: none;
//             border-radius: 5px;
//             font-size: 16px;
//             font-weight: bold;
//             transition: background-color 0.3s ease;
//           }
//           .btn:hover {
//             background-color: #e64a19;
//           }
//           .footer {
//             background-color: #f4f4f4;
//             padding: 15px;
//             text-align: center;
//             font-size: 14px;
//             color: #777;
//           }
//           .footer a {
//             color: #ff5733;
//             text-decoration: none;
//           }
//           @media (max-width: 600px) {
//             .container {
//               margin: 10px;
//             }
//             .content {
//               padding: 20px;
//             }
//             .btn {
//               padding: 10px 20px;
//               font-size: 14px;
//             }
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <img src="https://drive.google.com/uc?export=view&id=1H6oMk_GcmZt7-wS5csnv18sN6-wxhDEw" alt="TastiGo Logo" style="max-width: 150px; margin-bottom: 20px;" />
//             <h1>TastiGo</h1>
//           </div>
//           <div class="content">
//             <h1>Password Reset Request</h1>
//             <p>
//               Hi there,<br />
//               We received a request to reset your TastiGo account password. Click the button below to set a new password. This link will expire in 1 hour.
//             </p>
//             <a href="${resetUrl}" class="btn">Reset Your Password</a>
//             <p>
//               If you didn’t request a password reset, please ignore this email or contact our support team.
//             </p>
//           </div>
//           <div class="footer">
//             <p>
//               Need help? <a href="mailto:support@tastigo.com">Contact Support</a><br />
//                             &copy; ${new Date().getFullYear()} TastiGo. All rights reserved.
//             </p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//         // Send email
//     const mailOptions = {
//       to: user.email,
//       from: process.env.EMAIL_USER,
//             subject: 'Password Reset Request - TastiGo',
//       text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.`,
//       html: htmlTemplate,
//     };

//     await transporter.sendMail(mailOptions);

//         res.status(200).json({ message: 'Password reset link sent to your email' });
//   } catch (error) {
//         console.error('Error in forgotPassword:', error);
//         res.status(500).json({ message: 'Error sending reset link', error });
//   }
// };

// // Reset Password
// exports.resetPassword = async (req, res) => {
//   try {
//     const { userID, token, password } = req.body;

//         // Verify token
//     const resetToken = await PasswordResetToken.findOne({ userID, token });
//     if (!resetToken) {
//             return res.status(400).json({ message: 'Invalid or expired reset token' });
//     }

//         // Hash new password
//     const hashedPassword = await hashPassword(password);

//         // Update password based on roleID
//         if (resetToken.roleID === 'role1') {
//             await Admin.findOneAndUpdate({ adminID: userID }, { password: hashedPassword });
//         } else if (resetToken.roleID === 'role2') {
//             await RestaurantOwner.findOneAndUpdate({ ownerID: userID }, { password: hashedPassword });
//         } else if (resetToken.roleID === 'role3') {
//             await Customer.findOneAndUpdate({ customerID: userID }, { password: hashedPassword });
//     } else {
//             return res.status(400).json({ message: 'Invalid role' });
//     }

//         // Delete used token
//     await PasswordResetToken.deleteOne({ userID, token });

//         res.status(200).json({ message: 'Password reset successfully' });
//   } catch (error) {
//         console.error('Error in resetPassword:', error);
//         res.status(500).json({ message: 'Error resetting password', error });
//   }
// };


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const validator = require('validator');

dotenv.config();

const Admin = require("../models/Admin");
const Customer = require("../models/Customer");
const RestaurantOwner = require("../models/RestaurantOwner");
const PasswordResetToken = require("../models/PasswordResetToken");
const DeliveryRider = require("../models/Driver");

// Input sanitization helper
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Hash password with enhanced security
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
  return await bcrypt.hash(password, salt);
};

// Generate JWT token
const generateToken = (userID, roleID) => {
  return jwt.sign({ userID, roleID }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Helper function to get user type based on roleID
const getUserType = (roleID) => {
  switch (roleID) {
    case "role1": return "admin";
    case "role2": return "owner";
    case "role3": return "customer";
    case "role4": return "rider";
    default: return "unknown";
  }
};

// Admin Signup with enhanced security
exports.adminSignup = async (req, res) => {
  try {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, mobileNumber, password } = req.body;
    
    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email.toLowerCase()),
      mobileNumber: sanitizeInput(mobileNumber),
    };

    // Check for existing admin
    const existingAdmin = await Admin.findOne({
      $or: [{ email: sanitizedData.email }, { mobileNumber: sanitizedData.mobileNumber }],
    });
    if (existingAdmin) {
      return res.status(400).json({
        message: "Email or mobile number already registered",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = new Admin({
      name: sanitizedData.name,
      email: sanitizedData.email,
      mobileNumber: sanitizedData.mobileNumber,
      password: hashedPassword,
      roleID: "role1"
    });

    const savedAdmin = await newAdmin.save();
    const token = generateToken(savedAdmin.adminID, "role1");
    
    res.status(201).json({
      message: "Admin registered successfully!",
      token,
      user: {
        userID: savedAdmin.adminID,
        name: savedAdmin.name,
        email: savedAdmin.email,
        roleID: "role1",
        userType: "admin"
      }
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    res.status(500).json({ message: "Error registering admin", error: error.message });
  }
};

// Restaurant Owner Signup with enhanced security
exports.ownerSignup = async (req, res) => {
  try {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, mobileNumber, password } = req.body;
    
    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email.toLowerCase()),
      mobileNumber: sanitizeInput(mobileNumber),
    };

    // Check for existing owner
    const existingOwner = await RestaurantOwner.findOne({
      $or: [{ email: sanitizedData.email }, { mobileNumber: sanitizedData.mobileNumber }],
    });
    if (existingOwner) {
      return res.status(400).json({
        message: "Email or mobile number already registered",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newOwner = new RestaurantOwner({
      name: sanitizedData.name,
      email: sanitizedData.email,
      mobileNumber: sanitizedData.mobileNumber,
      password: hashedPassword,
      roleID: "role2",
    });

    const savedOwner = await newOwner.save();
    const token = generateToken(savedOwner.ownerID, "role2");

    res.status(201).json({
      message: "Restaurant Owner registered successfully!",
      token,
      user: {
        userID: savedOwner.ownerID,
        name: savedOwner.name,
        email: savedOwner.email,
        roleID: "role2",
        userType: "owner"
      }
    });
  } catch (error) {
    console.error("Owner signup error:", error);
    res.status(500).json({ message: "Error registering owner", error: error.message });
  }
};

// Customer Signup with enhanced security
exports.customerSignup = async (req, res) => {
  try {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, mobileNumber, address, password } = req.body;
    
    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email.toLowerCase()),
      mobileNumber: sanitizeInput(mobileNumber),
      address: sanitizeInput(address),
    };

    // Check for existing customer
    const existingCustomer = await Customer.findOne({
      $or: [{ email: sanitizedData.email }, { mobileNumber: sanitizedData.mobileNumber }],
    });
    if (existingCustomer) {
      return res.status(400).json({
        message: "Email or mobile number already registered",
      });
    }
    
    const hashedPassword = await hashPassword(password);
    const newCustomer = new Customer({
      name: sanitizedData.name,
      email: sanitizedData.email,
      mobileNumber: sanitizedData.mobileNumber,
      address: sanitizedData.address,
      password: hashedPassword,
      roleID: "role3",
    });
    
    const savedCustomer = await newCustomer.save();
    const token = generateToken(savedCustomer.customerID, "role3");
    
    res.status(201).json({
      message: "Customer registered successfully!",
      token,
      user: {
        userID: savedCustomer.customerID,
        name: savedCustomer.name,
        email: savedCustomer.email,
        address: savedCustomer.address,
        roleID: "role3",
        userType: "customer"
      }
    });
  } catch (error) {
    console.error("Customer signup error:", error);
    res.status(500).json({ message: "Error registering customer", error: error.message });
  }
};

// Rider Signup with enhanced security
exports.riderSignup = async (req, res) => {
  try {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, mobileNumber, password, vehicleNumber } = req.body;

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email.toLowerCase()),
      mobileNumber: sanitizeInput(mobileNumber),
      vehicleNumber: sanitizeInput(vehicleNumber.toUpperCase()),
    };

    // Check for existing rider
    const existingRider = await DeliveryRider.findOne({
      $or: [
        { email: sanitizedData.email }, 
        { mobileNumber: sanitizedData.mobileNumber }, 
        { vehicleNumber: sanitizedData.vehicleNumber }
      ],
    });
    if (existingRider) {
      return res.status(400).json({
        message: "Email, mobile number, or vehicle number already registered",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newRider = new DeliveryRider({
      name: sanitizedData.name,
      email: sanitizedData.email,
      mobileNumber: sanitizedData.mobileNumber,
      password: hashedPassword,
      vehicleNumber: sanitizedData.vehicleNumber,
      roleID: "role4",
    });

    const savedRider = await newRider.save();
    const token = generateToken(savedRider.riderID, "role4");

    res.status(201).json({
      message: "Delivery Rider registered successfully!",
      token,
      user: {
        userID: savedRider.riderID,
        name: savedRider.name,
        email: savedRider.email,
        vehicleNumber: savedRider.vehicleNumber,
        roleID: "role4",
        userType: "rider"
      }
    });
  } catch (error) {
    console.error("Rider signup error:", error);
    res.status(500).json({ message: "Error registering rider", error: error.message });
  }
};

// Enhanced Login with proper user information and security
exports.login = async (req, res) => {
  try {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    
    // Sanitize email input
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    
    // Find user in all collections
    let user = null;
    let userType = null;
    let userID = null;

    // Check Admin
    user = await Admin.findOne({ email: sanitizedEmail });
    if (user) {
      userType = "admin";
      userID = user.adminID;
    }

    // Check Restaurant Owner
    if (!user) {
      user = await RestaurantOwner.findOne({ email: sanitizedEmail });
      if (user) {
        userType = "owner";
        userID = user.ownerID;
      }
    }

    // Check Delivery Rider
    if (!user) {
      user = await DeliveryRider.findOne({ email: sanitizedEmail });
      if (user) {
        userType = "rider";
        userID = user.riderID;
      }
    }

    // Check Customer
    if (!user) {
      user = await Customer.findOne({ email: sanitizedEmail });
      if (user) {
        userType = "customer";
        userID = user.customerID;
      }
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(userID, user.roleID);

    // Return comprehensive user information
    const responseUser = {
      userID: userID,
      name: user.name,
      email: user.email,
      roleID: user.roleID,
      userType: userType
    };

    // Add specific fields based on user type
    if (userType === "customer" && user.address) {
      responseUser.address = user.address;
    }
    if (userType === "rider" && user.vehicleNumber) {
      responseUser.vehicleNumber = user.vehicleNumber;
      responseUser.isAvailable = user.isAvailable;
      responseUser.status = user.status;
    }

    res.status(200).json({
      message: "Login successful",
      token,
      user: responseUser
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Enhanced Forgot Password with rate limiting and validation
exports.forgotPassword = async (req, res) => {
  try {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const sanitizedEmail = sanitizeInput(email.toLowerCase());

    // Check if user exists in any collection
    let user = await Admin.findOne({ email: sanitizedEmail }) ||
               await RestaurantOwner.findOne({ email: sanitizedEmail }) ||
               await Customer.findOne({ email: sanitizedEmail }) ||
               await DeliveryRider.findOne({ email: sanitizedEmail });

    // Always return success message to prevent email enumeration
    if (!user) {
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Check if there's already a recent reset token
    const existingToken = await PasswordResetToken.findOne({ 
      userID: user.adminID || user.ownerID || user.customerID || user.riderID 
    });
    
    if (existingToken) {
      const timeDiff = Date.now() - existingToken.createdAt.getTime();
      if (timeDiff < 300000) { // 5 minutes
        return res.status(429).json({ 
          message: 'Password reset already requested. Please wait 5 minutes before requesting again.' 
        });
      }
      // Remove old token
      await PasswordResetToken.deleteOne({ _id: existingToken._id });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const userID = user.adminID || user.ownerID || user.customerID || user.riderID;

    // Save reset token to PasswordResetToken collection
    await PasswordResetToken.create({
      userID,
      roleID: user.roleID,
      token: resetToken,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&userID=${userID}`;

    // HTML Email Template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - TastiGo</title>
        <style>
          body {
            font-family: 'Poppins', Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #ff5733;
            padding: 20px;
            text-align: center;
            color: #ffffff;
          }
          .header img {
            max-width: 150px;
            display: flex;
          }
          .content {
            padding: 30px;
            text-align: center;
          }
          .content h1 {
            color: #ff5733;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .content p {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #ff5733;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            transition: background-color 0.3s ease;
          }
          .btn:hover {
            background-color: #e64a19;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            font-size: 14px;
            color: #777;
          }
          .footer a {
            color: #ff5733;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .container {
              margin: 10px;
            }
            .content {
              padding: 20px;
            }
            .btn {
              padding: 10px 20px;
              font-size: 14px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://drive.google.com/uc?export=view&id=1H6oMk_GcmZt7-wS5csnv18sN6-wxhDEw" alt="TastiGo Logo" style="max-width: 150px; margin-bottom: 20px;" />
            <h1>TastiGo</h1>
          </div>
          <div class="content">
            <h1>Password Reset Request</h1>
            <p>
              Hi ${user.name},<br />
              We received a request to reset your TastiGo account password. Click the button below to set a new password. This link will expire in 1 hour.
            </p>
            <a href="${resetUrl}" class="btn">Reset Your Password</a>
            <p>
              If you didn't request a password reset, please ignore this email or contact our support team.
            </p>
            <p style="font-size: 12px; color: #999;">
              For security reasons, this link will expire in 1 hour and can only be used once.
            </p>
          </div>
          <div class="footer">
            <p>
              Need help? <a href="mailto:support@tastigo.com">Contact Support</a><br />
              &copy; ${new Date().getFullYear()} TastiGo. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request - TastiGo',
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.`,
      html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
};

// Enhanced Reset Password with validation
exports.resetPassword = async (req, res) => {
  try {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userID, token, password } = req.body;

    // Sanitize inputs
    const sanitizedUserID = sanitizeInput(userID);
    const sanitizedToken = sanitizeInput(token);

    // Verify token and check expiry
    const resetToken = await PasswordResetToken.findOne({ 
      userID: sanitizedUserID, 
      token: sanitizedToken 
    });
    
    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Check if token has expired
    if (resetToken.expiresAt && resetToken.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ _id: resetToken._id });
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password based on roleID
    let updateResult;
    if (resetToken.roleID === 'role1') {
      updateResult = await Admin.findOneAndUpdate(
        { adminID: sanitizedUserID }, 
        { password: hashedPassword }
      );
    } else if (resetToken.roleID === 'role2') {
      updateResult = await RestaurantOwner.findOneAndUpdate(
        { ownerID: sanitizedUserID }, 
        { password: hashedPassword }
      );
    } else if (resetToken.roleID === 'role3') {
      updateResult = await Customer.findOneAndUpdate(
        { customerID: sanitizedUserID }, 
        { password: hashedPassword }
      );
    } else if (resetToken.roleID === 'role4') {
      updateResult = await DeliveryRider.findOneAndUpdate(
        { riderID: sanitizedUserID }, 
        { password: hashedPassword }
      );
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (!updateResult) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Delete used token
    await PasswordResetToken.deleteOne({ userID: sanitizedUserID, token: sanitizedToken });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};