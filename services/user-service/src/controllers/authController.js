const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

dotenv.config();

const Admin = require("../models/Admin");
const Customer = require("../models/Customer");
const RestaurantOwner = require("../models/RestaurantOwner");
const PasswordResetToken =  require("../models/PasswordResetToken");
const DeliveryRider = require("../models/Driver");

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Generate JWT token
const generateToken = (userID, roleID) => {
  return jwt.sign({ userID, roleID }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Admin Signup
exports.adminSignup = async (req, res) => {
  try {
    const { name, email, mobileNumber, password } = req.body;
    const hashedPassword = await hashPassword(password);
        //const adminID = `admin${Date.now()}`;

        const newAdmin = new Admin({name, email, mobileNumber, password: hashedPassword, roleID: "role1" });
        // await newAdmin.save();

    const savedAdmin = await newAdmin.save();

        const token = generateToken(savedAdmin.adminID, "role1");
    res.status(201).json({
      message: "Admin registered successfully!",
      token,
            adminID: savedAdmin.adminID
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering admin", error });
  }
};

// Restaurant Owner Signup
exports.ownerSignup = async (req, res) => {
  try {
        const { name, email,mobileNumber, password } = req.body;
    const hashedPassword = await hashPassword(password);

    const newOwner = new RestaurantOwner({
      name,
      email,
      mobileNumber,
      password: hashedPassword,
      roleID: "role2",
    });

    const savedOwner = await newOwner.save();

    const token = generateToken(savedOwner._id.toString(), "role2");

    res.status(201).json({
      message: "Restaurant Owner registered successfully!",
      token,
      ownerID: savedOwner._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering owner", error });
  }
};

// Customer Signup
exports.customerSignup = async (req, res) => {
  try {
    const { name, email, mobileNumber, address, password } = req.body;
    // Check for existing email or mobileNumber
    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { mobileNumber }],
    });
    if (existingCustomer) {
      return res.status(400).json({
        message: "Email or mobile number already registered",
      });
    }
    const hashedPassword = await hashPassword(password);
    const newCustomer = new Customer({
      name,
      email,
      mobileNumber,
      address,
      password: hashedPassword,
      roleID: "role3",
    });
    const savedCustomer = await newCustomer.save();
    const token = generateToken(savedCustomer.customerID, "role3");
    res.status(201).json({
      message: "Customer registered successfully!",
      token,
      customerID: savedCustomer.customerID,
    });
  } catch (error) {
    console.error("Customer signup error:", error);
    res.status(500).json({ message: "Error registering customer", error: error.message });
  }
};

// Login (for Admin, Owner, and Customer)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user =
      (await Admin.findOne({ email })) ||
      (await RestaurantOwner.findOne({ email })) ||
      (await DeliveryRider.findOne({ email })) ||
      (await Customer.findOne({ email }));

    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const userID = user._id.toString();
    const token = generateToken(userID, user.roleID);

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.riderSignup = async (req, res) => {
  try {
    const { name, email, mobileNumber, password, vehicleNumber } = req.body;

    // Check for existing email or mobileNumber
    const existingRider = await DeliveryRider.findOne({
      $or: [{ email }, { mobileNumber }, { vehicleNumber }],
    });
    if (existingRider) {
      return res.status(400).json({
        message: "Email, mobile number, or vehicle number already registered",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newRider = new DeliveryRider({
      name,
      email,
      mobileNumber,
      password: hashedPassword,
      vehicleNumber,
      roleID: "role4", 
    });

    const savedRider = await newRider.save();

    const token = generateToken(savedRider.riderID, "role4");

    res.status(201).json({
      message: "Delivery Rider registered successfully!",
      token,
      riderID: savedRider.riderID,
    });
  } catch (error) {
    console.error("Rider signup error:", error);
    res.status(500).json({ message: "Error registering rider", error: error.message });
  }
};

// exports.forgotPassword = async (req, res) => {
//     try {
//         const { email } = req.body;

//         // Check if user exists in any collection
//         let user = await Admin.findOne({ email }) ||
//                    await RestaurantOwner.findOne({ email }) ||
//                    await Customer.findOne({ email });

//         if (!user) {
//             return res.status(404).json({ message: 'No user found with this email' });
//         }

//         // Generate reset token
//         const resetToken = crypto.randomBytes(32).toString('hex');
//         const userID = user.adminID || user.ownerID || user.customerID;

//         // Save reset token to PasswordResetToken collection
//         await PasswordResetToken.create({
//             userID,
//             roleID: user.roleID,
//             token: resetToken,
//         });

//         // Create reset URL
//         const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&userID=${userID}`;

//         // Send email
//         const mailOptions = {
//             to: user.email,
//             from: process.env.EMAIL_USER,
//             subject: 'Password Reset Request',
//             text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.`,
//         };

//         await transporter.sendMail(mailOptions);

//         res.status(200).json({ message: 'Password reset link sent to your email' });
//     } catch (error) {
//         console.error('Error in forgotPassword:', error);
//         res.status(500).json({ message: 'Error sending reset link', error });
//     }
// };


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

        // Check if user exists in any collection
        let user = await Admin.findOne({ email }) ||
                   await RestaurantOwner.findOne({ email }) ||
                   await Customer.findOne({ email });

    if (!user) {
            return res.status(404).json({ message: 'No user found with this email' });
    }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const userID = user.adminID || user.ownerID || user.customerID;

        // Save reset token to PasswordResetToken collection
    await PasswordResetToken.create({
      userID,
      roleID: user.roleID,
      token: resetToken,
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
              Hi there,<br />
              We received a request to reset your TastiGo account password. Click the button below to set a new password. This link will expire in 1 hour.
            </p>
            <a href="${resetUrl}" class="btn">Reset Your Password</a>
            <p>
              If you didn’t request a password reset, please ignore this email or contact our support team.
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

        res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ message: 'Error sending reset link', error });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { userID, token, password } = req.body;

        // Verify token
    const resetToken = await PasswordResetToken.findOne({ userID, token });
    if (!resetToken) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

        // Hash new password
    const hashedPassword = await hashPassword(password);

        // Update password based on roleID
        if (resetToken.roleID === 'role1') {
            await Admin.findOneAndUpdate({ adminID: userID }, { password: hashedPassword });
        } else if (resetToken.roleID === 'role2') {
            await RestaurantOwner.findOneAndUpdate({ ownerID: userID }, { password: hashedPassword });
        } else if (resetToken.roleID === 'role3') {
            await Customer.findOneAndUpdate({ customerID: userID }, { password: hashedPassword });
    } else {
            return res.status(400).json({ message: 'Invalid role' });
    }

        // Delete used token
    await PasswordResetToken.deleteOne({ userID, token });

        res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({ message: 'Error resetting password', error });
  }
};