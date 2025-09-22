const mongoose = require('mongoose');
const Counter = require('./Counter');

const RestaurantOwnerSchema = new mongoose.Schema({
    ownerID: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roleID: { type: mongoose.Schema.Types.String, ref: 'Role', required: true }
}, { timestamps: true });

// Generate ownerID before saving
RestaurantOwnerSchema.pre('save', async function (next) {
    if (!this.ownerID) {
        const counter = await Counter.findOneAndUpdate(
            { name: 'RestaurantOwner' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.ownerID = `restaurantOwner${counter.seq}`;
    }
    next();
});

module.exports = mongoose.model('RestaurantOwner', RestaurantOwnerSchema);
