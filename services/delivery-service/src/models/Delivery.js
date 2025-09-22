const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  deliveryRiderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DeliveryRider' 
  },
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  pickupAddress: {   
    type: String,
    required: true
  },
  dropAddress: {    
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'in-transit', 'delivered', 'cancelled'],
    default: 'assigned'
  },
  assignedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);