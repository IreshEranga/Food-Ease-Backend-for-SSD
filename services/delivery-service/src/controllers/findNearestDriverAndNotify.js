const mongoose = require('mongoose');
const axios = require('axios');
const DeliveryRider = require('../models/DeliveryRider'); // Path to your driver model
const { sendNotification } = require('../utils/notificationService'); // Hypothetical notification service
const logger = require('../utils/logger'); // Hypothetical logger (e.g., Winston)

// Helper function to convert degrees to radians
const toRadians = (degrees) => degrees * (Math.PI / 180);

// Function to geocode a string address using Nominatim (OpenStreetMap)
async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'TastiGo/1.0 (dinuska.g@gmail.com)', // Replace with your app name and email
      },
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return [parseFloat(lon), parseFloat(lat)]; // [longitude, latitude]
    } else {
      throw new Error('No coordinates found for the address');
    }
  } catch (error) {
    logger.error(`Geocoding failed for address "${address}": ${error.message}`);
    throw new Error('Failed to geocode restaurant address');
  }
}

// Main function to find the nearest driver and send delivery notification
async function findNearestDriverAndNotify(req, res) {
  try {
    const { orderId, restaurantId, restaurantAddress } = req.body;

    // Validate input
    if (!orderId || !restaurantId || !restaurantAddress) {
      return res.status(400).json({ error: 'Order ID, Restaurant ID, and Restaurant Address are required' });
    }

    // Step 1: Geocode the restaurant's string address
    let restaurantLocation;
    try {
      restaurantLocation = await geocodeAddress(restaurantAddress);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Step 2: Find the nearest available driver
    const maxDistanceKm = 50; // Maximum search radius (adjust as needed)
    const maxDistanceMeters = maxDistanceKm * 1000; // Convert km to meters for MongoDB

    const nearestDrivers = await DeliveryRider.find({
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: restaurantLocation, // [longitude, latitude]
          },
          $maxDistance: maxDistanceMeters,
        },
      },
      isAvailable: true,
      status: 'active',
    })
      .limit(1) // Get the closest driver
      .exec();

    if (!nearestDrivers || nearestDrivers.length === 0) {
      logger.warn(`No available drivers found near restaurant ${restaurantId}`);
      return res.status(404).json({ error: 'No available drivers found' });
    }

    const driver = nearestDrivers[0];

    // Step 3: Fetch restaurant details for notification (optional, for richer notification content)
    let restaurantName = 'Unknown Restaurant';
    try {
      const restaurantResponse = await axios.get(`${process.env.REACT_APP_BACKEND_API}/api/restaurant/restaurants/getDetails/${restaurantId}`, {
        headers: {
          Authorization: req.headers.authorization, // Forward auth token
        },
      });
      restaurantName = restaurantResponse.data.name || restaurantName;
    } catch (error) {
      logger.warn(`Failed to fetch restaurant details for ${restaurantId}: ${error.message}`);
    }

    // Step 4: Send notification to the driver
    const notificationPayload = {
      driverId: driver.riderID,
      orderId,
      restaurantId,
      restaurantName,
      restaurantAddress,
      message: `New delivery request for order ${orderId} from ${restaurantName}. Accept?`,
      type: 'delivery_request',
    };
    
    try {
      await sendNotification(notificationPayload);
      logger.info(`Notification sent to driver ${driver.riderID} for order ${orderId}`);
    } catch (error) {
      logger.error(`Failed to send notification to driver ${driver.riderID}: ${error.message}`);
      return res.status(500).json({ error: 'Failed to send notification to driver' });
    }

    // Step 5: Update driver status
    driver.status = 'on-delivery';
    driver.isAvailable = false;
    await driver.save();

    // Step 6: Return success response
    return res.status(200).json({
      message: 'Driver notified successfully',
      driver: {
        riderID: driver.riderID,
        name: driver.name,
        mobileNumber: driver.mobileNumber,
        currentLocation: driver.currentLocation,
      },
      orderId,
    });

  } catch (error) {
    logger.error(`Error in findNearestDriverAndNotify: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  findNearestDriverAndNotify,
};