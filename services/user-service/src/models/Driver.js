const mongoose = require("mongoose");
const Counter = require('./Counter');

const deliveryRiderSchema = new mongoose.Schema({
    riderID: { type: String, unique: true },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], 
      default: [0, 0]
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-delivery'],
    default: 'active'
  },
  roleID: { type: mongoose.Schema.Types.String, ref: 'Role', required: true }
}, { timestamps: true });

// Enable geospatial index
deliveryRiderSchema.index({ currentLocation: "2dsphere" });
deliveryRiderSchema.pre('save', async function (next) {
    if (!this.riderID) {
        const counter = await Counter.findOneAndUpdate(
            { name: 'Rider' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.riderID = `rider${counter.seq}`;
    }
    next();
});

module.exports = mongoose.model("DeliveryRider", deliveryRiderSchema);
