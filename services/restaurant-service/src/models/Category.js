const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  owners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantOwner',
    required: true,
  }],
  restaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Unique compound index
categorySchema.index({ name: 1, owners: 1, restaurants: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);