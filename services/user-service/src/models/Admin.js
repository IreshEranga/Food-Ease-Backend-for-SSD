const mongoose = require('mongoose');
const Counter = require('./Counter');

const AdminSchema = new mongoose.Schema({
    adminID: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roleID: { type: mongoose.Schema.Types.String, ref: 'Role', required: true }
}, { timestamps: true });

// Generate adminID before saving
AdminSchema.pre('save', async function (next) {
    if (!this.adminID) {
        const counter = await Counter.findOneAndUpdate(
            { name: 'Admin' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.adminID = `admin${counter.seq}`;
    }
    next();
});

module.exports = mongoose.model('Admin', AdminSchema);
