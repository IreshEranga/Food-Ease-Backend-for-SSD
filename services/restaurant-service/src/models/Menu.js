const mongoose = require('mongoose');
const { Schema } = mongoose;

const menuSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  image: {
    type: String,
    trim: true
  },
  available: {
    type: Boolean,
    default: true
  },
  restaurants: [{
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  }],
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'RestaurantOwner',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Unique index to prevent duplicate menu items for the same restaurant chain
menuSchema.index({ name: 1, restaurants: 1 }, { unique: true });

module.exports = mongoose.model('Menu', menuSchema);