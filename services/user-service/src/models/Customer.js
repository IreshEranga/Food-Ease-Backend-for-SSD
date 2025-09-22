const mongoose = require('mongoose');
const Counter = require('./Counter');

const CustomerSchema = new mongoose.Schema({
    customerID: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    password: { type: String, required: true },
    roleID: { type: mongoose.Schema.Types.String, ref: 'Role', required: true }
}, { timestamps: true });

// Generate customerID before saving
CustomerSchema.pre('save', async function (next) {
    if (!this.customerID) {
        const counter = await Counter.findOneAndUpdate(
            { name: 'Customer' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.customerID = `customer${counter.seq}`;
    }
    next();
});

module.exports = mongoose.model('Customer', CustomerSchema);
