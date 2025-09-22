const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  restaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    trim: true,
    default: function () {
      return `Discount ${this.discountPercentage}%`;
    },
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure uniqueness on restaurants and title (optional, can be removed if not needed)
//offerSchema.index({ restaurants: 1, title: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Offer', offerSchema);