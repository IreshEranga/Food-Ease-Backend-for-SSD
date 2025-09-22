const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    roleID: { type: String, required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 },
});

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);