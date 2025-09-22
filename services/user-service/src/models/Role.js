const mongoose = require('mongoose');
const Counter = require('./Counter');

const RoleSchema = new mongoose.Schema({
    roleID: { type: String, unique: true },
    roleType: { type: String, required: true, unique: true }
}, { timestamps: true });

// Generate roleID before saving
RoleSchema.pre('save', async function (next) {
    if (!this.roleID) {
        const counter = await Counter.findOneAndUpdate(
            { name: 'Role' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.roleID = `role${counter.seq}`;
    }
    next();
});

module.exports = mongoose.model('Role', RoleSchema);
