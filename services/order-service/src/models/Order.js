const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [
    {
      itemId: { type: String, required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      restaurantId: { type: String, required: true }
    }
  ],
  restaurantId: { type: String, required: true },
  restaurantName: { type: String, required: true },
  branchName: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  orderStatus: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Prepared', 'On Delivery', 'Completed'], 
    default: 'Pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Unpaid', 'Paid'], 
    default: 'Unpaid' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);