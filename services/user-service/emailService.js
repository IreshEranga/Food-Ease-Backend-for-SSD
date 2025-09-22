require('dotenv').config();
const nodemailer = require('nodemailer');

// Configure NodeMailer with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Add TLS configuration to handle self-signed certificate issue
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// Store OTPs temporarily (in a real app, use a database or Redis)
const otps = new Map();

// Function to send OTP email
const sendOtpEmail = async (to) => {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps.set(to, otp); // Store OTP temporarily

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Verify Your Email with Your OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f28c38; border-radius: 10px;">
        <div style="text-align: center;">
          <img src="https://drive.google.com/uc?export=view&id=1H6oMk_GcmZt7-wS5csnv18sN6-wxhDEw" alt="App Logo" style="max-width: 150px; margin-bottom: 20px;" />
        </div>
        <h2 style="color: #f28c38; text-align: center;">Welcome to <span style="font-family: cursive; font-size: 50px; color: #FF7043">T</span>asti
                        <span style="font-family: cursive; font-size: 50px; color: #FF7043">G</span>o!</h2>
        <p style="font-size: 16px; color: #333; text-align: center;">
          Thank you for signing up. To complete your email verification, please use the following One-Time Password (OTP):
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; background-color: #f28c38; color: white; font-size: 24px; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">
          This OTP is valid for 10 minutes. If you did not request this, please ignore this email.
        </p>
        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
          Best regards,<br/>
          The TastiGo Team.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
};

// Function to verify OTP
const verifyOtp = (to, code) => {
  const storedOtp = otps.get(to);
  if (!storedOtp) {
    return { success: false, message: 'OTP not found or expired' };
  }

  if (storedOtp === code) {
    otps.delete(to); // Clear OTP after successful verification
    return { success: true, message: 'OTP verified successfully' };
  } else {
    return { success: false, message: 'Invalid OTP' };
  }
};

module.exports = { sendOtpEmail, verifyOtp };