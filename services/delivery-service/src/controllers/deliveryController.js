const Delivery = require('../models/Delivery');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const axios = require('axios');
// Create a new delivery
exports.createDelivery = async (req, res) => {
  try {
    const { orderId, customerId, pickupAddress, dropAddress, deliveryRiderId } = req.body;

    // Validate required fields
    if (!orderId || !customerId || !pickupAddress || !dropAddress) {
      return res.status(400).json({ error: 'Missing required fields: orderId, customerId, pickupAddress, and dropAddress are required' });
    }

    const delivery = new Delivery({
      orderId,
      customerId,
      pickupAddress,
      dropAddress,
      deliveryRiderId,
      status: 'assigned',
      assignedAt: new Date()
    });

    await delivery.save();
    res.status(201).json({ message: 'Delivery created successfully', delivery });
  } catch (error) {
    console.error('Create delivery error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get all deliveries
exports.getAllDeliveries = async (req, res) => {
    try {
      const deliveries = await Delivery.find();
      res.status(200).json(deliveries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Get a single delivery by ID
  exports.getDeliveryById = async (req, res) => {
    try {
      const delivery = await Delivery.findById(req.params.id);
      
      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' });
      }
      
      res.status(200).json(delivery);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Update a delivery
  exports.updateDelivery = async (req, res) => {
    try {
      const { status, deliveryRiderId, pickupAddress, dropAddress } = req.body;
      
      const delivery = await Delivery.findById(req.params.id);
      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' });
      }
  
      // Update allowed fields
      if (status) {
        delivery.status = status;
        if (status === 'delivered') {
          delivery.deliveredAt = new Date();
        }
      }
      if (deliveryRiderId) delivery.deliveryRiderId = deliveryRiderId;
      if (pickupAddress) delivery.pickupAddress = pickupAddress;
      if (dropAddress) delivery.dropAddress = dropAddress;
  
      await delivery.save();
      res.status(200).json({ message: 'Delivery updated successfully', delivery });
    } catch (error) {
      console.error('Update delivery error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  };
  
  // Delete a delivery
  exports.deleteDelivery = async (req, res) => {
    try {
      const delivery = await Delivery.findByIdAndDelete(req.params.id);
      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' });
      }
      
      res.status(200).json({ message: 'Delivery deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // deliveryController.js
exports.getDeliveriesByDriverId = async (req, res) => {
  try {
    const { driverId } = req.params;
    const deliveries = await Delivery.find({ deliveryRiderId: driverId });

    if (!deliveries || deliveries.length === 0) {
      return res.status(404).json({ message: 'No deliveries found for this driver' });
    }

    res.status(200).json(deliveries);
  } catch (error) {
    console.error('Error fetching deliveries by driver:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.findNearestDriverAndNotify = async (req, res) => {
  try {
    const { orderId, restaurantId, restaurantAddress, customerId, dropAddress, deliveryRiderId } = req.body;

    // Validate input
    if (!orderId || !restaurantId || !restaurantAddress || !customerId || !dropAddress || !deliveryRiderId) {
      return res.status(400).json({ error: 'Order ID, Restaurant ID, Restaurant Address, Customer ID, Drop Address, and Delivery Rider ID are required' });
    }

    // Step 1: Fetch restaurant details for notification (optional, for richer notification content)
    let restaurantName = 'Unknown Restaurant';
    try {
      const restaurantResponse = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/api/restaurant/restaurants/${restaurantId}`, {
        headers: {
          Authorization: req.headers.authorization, // Forward auth token
        },
      });
      restaurantName = restaurantResponse.data.name || restaurantName;
    } catch (error) {
      logger.warn(`Failed to fetch restaurant details for ${restaurantId}: ${error.message}`);
    }

    // Step 2: Fetch driver details for notification (e.g., email)
    let driver;
    try {
      const driverResponse = await axios.get(`${process.env.DELIVERY_SERVICE_URL}/api/delivery-rider/riders/${deliveryRiderId}`, {
        headers: {
          Authorization: req.headers.authorization,
        },
      });
      driver = driverResponse.data;
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }
    } catch (error) {
      logger.error(`Failed to fetch driver details for ${deliveryRiderId}: ${error.message}`);
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Step 3: Send notification to the driver (placeholder implementation)
    const notificationPayload = {
      driverId: deliveryRiderId,
      orderId,
      restaurantId,
      restaurantName,
      restaurantAddress,
      message: `New delivery request for order ${orderId} from ${restaurantName}. Accept?`,
      type: 'delivery_request',
    };

    try {
      // Placeholder: Replace with your actual notification system
      console.log('Sending notification to driver:', notificationPayload);
      logger.info(`Notification sent to driver ${deliveryRiderId} for order ${orderId}`);
    } catch (error) {
      logger.error(`Failed to send notification to driver ${deliveryRiderId}: ${error.message}`);
      return res.status(500).json({ error: 'Failed to send notification to driver' });
    }

    // Step 4: Create a delivery record
    const delivery = new Delivery({
      orderId,
      customerId,
      pickupAddress: restaurantAddress,
      dropAddress,
      deliveryRiderId,
      status: 'assigned',
      assignedAt: new Date(),
    });

    await delivery.save();

    // Step 5: Update driver status via API (since we can't query the model directly)
    try {
      await axios.put(
        `${process.env.DELIVERY_SERVICE_URL}/api/users/deliveryrider/rupdate/${deliveryRiderId}`,
        {
          status: 'on-delivery',
          isAvailable: false,
        },
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
    } catch (error) {
      logger.error(`Failed to update driver status for ${deliveryRiderId}: ${error.message}`);
      // Continue even if this fails, but log the error
    }

    // Step 6: Return success response
    return res.status(200).json({
      message: 'Driver notified and delivery created successfully',
      driver: {
        riderID: deliveryRiderId,
        name: driver.name,
        mobileNumber: driver.mobileNumber,
      },
      delivery,
      orderId,
    });

  } catch (error) {
    logger.error(`Error in findNearestDriverAndNotify: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to find the nearest driver and send a notification
exports.findNearestDriverAndNotify = async (req, res) => {
  try {
    const { orderId, restaurantId, restaurantAddress, customerId, dropAddress, deliveryRiderId } = req.body;

    // Validate input
    if (!orderId || !restaurantId || !restaurantAddress || !customerId || !dropAddress || !deliveryRiderId) {
      return res.status(400).json({ error: 'Order ID, Restaurant ID, Restaurant Address, Customer ID, Drop Address, and Delivery Rider ID are required' });
    }

    // Step 1: Fetch restaurant details for notification (optional, for richer notification content)
    let restaurantName = 'Unknown Restaurant';
    try {
      const restaurantResponse = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/api/restaurant/restaurants/${restaurantId}`, {
        headers: {
          Authorization: req.headers.authorization, // Forward auth token
        },
      });
      restaurantName = restaurantResponse.data.name || restaurantName;
    } catch (error) {
      logger.warn(`Failed to fetch restaurant details for ${restaurantId}: ${error.message}`);
    }

    // Step 2: Fetch driver details for notification (e.g., email)
    let driver;
    try {
      const driverResponse = await axios.get(`${process.env.DELIVERY_SERVICE_URL}/api/users/deliveryrider/${deliveryRiderId}`, {
        headers: {
          Authorization: req.headers.authorization,
        },
      });
      driver = driverResponse.data;
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }
    } catch (error) {
      logger.error(`Failed to fetch driver details for ${deliveryRiderId}: ${error.message}`);
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Step 3: Send notification to the driver (placeholder implementation)
    const notificationPayload = {
      driverId: deliveryRiderId,
      orderId,
      restaurantId,
      restaurantName,
      restaurantAddress,
      message: `New delivery request for order ${orderId} from ${restaurantName}. Accept?`,
      type: 'delivery_request',
    };

    try {
      // Placeholder: Replace with your actual notification system
      console.log('Sending notification to driver:', notificationPayload);
      logger.info(`Notification sent to driver ${deliveryRiderId} for order ${orderId}`);
    } catch (error) {
      logger.error(`Failed to send notification to driver ${deliveryRiderId}: ${error.message}`);
      return res.status(500).json({ error: 'Failed to send notification to driver' });
    }

    // Step 4: Create a delivery record
    const delivery = new Delivery({
      orderId,
      customerId,
      pickupAddress: restaurantAddress,
      dropAddress,
      deliveryRiderId,
      status: 'assigned',
      assignedAt: new Date(),
    });

    await delivery.save();

    // Step 5: Update driver status via API (since we can't query the model directly)
    try {
      await axios.put(
        `${process.env.DELIVERY_SERVICE_URL}/api/users/deliveryrider/rupdate/${deliveryRiderId}`,
        {
          status: 'on-delivery',
          isAvailable: false,
        },
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
    } catch (error) {
      logger.error(`Failed to update driver status for ${deliveryRiderId}: ${error.message}`);
      // Continue even if this fails, but log the error
    }

    // Step 6: Return success response
    return res.status(200).json({
      message: 'Driver notified and delivery created successfully',
      driver: {
        riderID: deliveryRiderId,
        name: driver.name,
        mobileNumber: driver.mobileNumber,
      },
      delivery,
      orderId,
    });

  } catch (error) {
    logger.error(`Error in findNearestDriverAndNotify: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};