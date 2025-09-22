const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const nodemailer = require('nodemailer');
const geocodeAddress = require('../utils/geocode'); // adjust path as needed




const createOrder = async (req, res) => {
  try {
    const {
      userId,
      items,
      totalAmount,
      deliveryAddress,
      restaurantId,
      restaurantName,
      branchName
    } = req.body;

    const newOrder = new Order({
      userId,
      items,
      totalAmount,
      deliveryAddress,
      restaurantId,
      restaurantName,
      branchName
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching order', message: err.message });
  }
};

const updateOrderPaymentStatus = async (req, res) => {
  try {
    let { status, paymentStatus } = req.body;
    
    if (typeof paymentStatus === 'number') {
      if (paymentStatus === 2) paymentStatus = 'Paid';
      else paymentStatus = 'Unpaid';
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status, paymentStatus },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Error updating order', message: err.message });
  }
};

const getTotalOrderCount = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    res.status(200).json({ totalOrders });
  } catch (err) {
    res.status(500).json({ message: 'Error getting total order count', error: err.message });
  }
};

const getYesterdayOrderCount = async (req, res) => {
  try {
    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const yesterdayOrders = await Order.countDocuments({
      createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }
    });

    res.status(200).json({ yesterdayOrders });
  } catch (err) {
    res.status(500).json({ message: 'Error getting yesterday\'s order count', error: err.message });
  }
};

const getDailyOrderCounts = async (req, res) => {
  try {
    const dailyOrders = await Order.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json(dailyOrders);
  } catch (err) {
    res.status(500).json({ message: 'Error getting daily order counts', error: err.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { sortBy = 'createdAt', order = 'desc', restaurantId } = req.query;

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortCriteria = { [sortBy]: sortOrder };

    let query = {};
    if (restaurantId) {
      const restaurantIds = Array.isArray(restaurantId) ? restaurantId : [restaurantId];
      query.restaurantId = { $in: restaurantIds };
    }

    const orders = await Order.find(query)
      .sort(sortCriteria)
      .exec();

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      orders,
      totalOrders
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
};
/*
const geocodeAddress = async (address) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'TastiGo/1.0 (dinuska.g@example.com)', // Replace with your email
      },
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return [parseFloat(lon), parseFloat(lat)]; // [longitude, latitude]
    } else {
      throw new Error('No coordinates found for the address');
    }
  } catch (error) {
    console.error(`Geocoding failed for address "${address}": ${error.message}`);
    throw new Error('Failed to geocode restaurant address');
  }
};
*/
// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Bypass SSL verification for local development (remove in production)
  tls: {
    rejectUnauthorized: false, // Allows self-signed certificates
  },
});

// Helper function to send email
const sendOrderStatusEmail = async (email, orderId, status, restaurantName, branchName, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `🍽️ Your Order #${orderId} from ${restaurantName} - Status Update!`,
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #f28c38; border-radius: 12px; background-color: #fffaf5;">
          <div style="text-align: center;">
            <img src="https://drive.google.com/uc?export=view&id=1H6oMk_GcmZt7-wS5csnv18sN6-wxhDEw" alt="TastiGo Logo" style="max-width: 100px; margin-bottom: 5px; border: 2px solid #f28c38; border-radius: 8px;" />
          </div>
          <h2 style="color: #f28c38; text-align: center; margin-bottom: 5px;">Update from <span style="font-family: cursive; color: #FF7043;">TastiGo</span>!</h2>
          <p style="font-size: 18px; color: #333; text-align: center;">Hey, ${name}!</p>

          <p style="font-size: 16px; color: #555; text-align: center; margin: 20px 0;">
            We have an update on your order <br/>
            <strong>Order ID:</strong> <span style="color: #f28c38;">${orderId}</span><br/>
            <strong>Restaurant:</strong> <span style="color: #f28c38;">${restaurantName}</span> - <span style="color: #f28c38;">${branchName}</span>
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #f28c38; color: #ffffff; font-size: 22px; padding: 14px 28px; border-radius: 8px;">
              Status: <strong>${status}</strong>
            </div>
          </div>

          <p style="font-size: 16px; color: #777; text-align: center;">
            We're working hard to ensure your order is just perfect. Thanks for trusting <strong>TastiGo</strong> to deliver deliciousness to your doorstep!
          </p>

          <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px;">
            Stay hungry, stay happy!<br/>
            <strong>— The TastiGo Team 🧡</strong>
          </p>
        </div>
      `,
  };  

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email} for order ${orderId} status: ${status}`);
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
  }
};

// Update order status by restaurant owner
const updateOrderStatusByOwner = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Confirmed', 'Prepared'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status update by owner' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return pochres.status(404).json({ error: 'Order not found' });
    }

    if (status === 'Confirmed' && order.orderStatus !== 'Pending') {
      return res.status(400).json({ error: 'Only pending orders can be confirmed by owner' });
    }

    if (status === 'Prepared' && order.orderStatus !== 'Confirmed') {
      return res.status(400).json({ error: 'Only confirmed orders can be marked as prepared by owner' });
    }

    order.orderStatus = status;
    const updatedOrder = await order.save();

    // Fetch customer details from user service
    try {
      const userResponse = await axios.get(`${process.env.REACT_APP_BACKEND_API}/api/users/customers/${order.userId}`, {
        headers: { Authorization: req.headers.authorization },
      });
      const customer = userResponse.data;

      if (customer && customer.email) {
        // Send email to customer
        await sendOrderStatusEmail(customer.email, order._id, status, order.restaurantName, order.branchName, customer.name,);
      } else {
        console.warn(`No email found for userId: ${order.userId}`);
      }
    } catch (userError) {
      console.error('Failed to fetch customer details:', userError);
      // Continue with response even if email fails
    }

    // If status is 'Prepared', automatically assign a driver and create a delivery
    if (status === 'Prepared') {
      try {
        console.log(`Fetching restaurant: ${order.restaurantId}`);
        const restaurantResponse = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/api/restaurant/restaurants/getDetails/${order.restaurantId}`, {
          headers: {
            Authorization: req.headers.authorization,
          },
        });
    
        const restaurant = restaurantResponse.data;
        console.log('Restaurant data:', restaurant);
    
        if (!restaurant || !restaurant.address || !restaurant.address.coordinates) {
          console.error(`Restaurant or coordinates not found for restaurantId: ${order.restaurantId}`);
        } else {
          const { lat, lng } = restaurant.address.coordinates; // Extract latitude and longitude
          console.log('Restaurant coordinates:',  lng,lat);
    
          // Now, use the coordinates to find the nearest driver
          try {
            console.log(`Finding nearest driver using coordinates:  ${lng},${lat}`);
            const driverResponse = await axios.post(
              `${process.env.DELIVERY_SERVICE_URL}/api/delivery/nearest`,
              {
                coordinates: [lng, lat], // Pass coordinates as [longitude, latitude]
              },
              {
                headers: {
                  Authorization: req.headers.authorization, // Forward auth token
                },
              }
            );
            const driver = driverResponse.data;
            console.log('Nearest driver:', driver);
    
            if (driver && driver.riderID) {
              // Call delivery management microservice to notify driver and create delivery
              try {
                console.log('Assigning driver for order', order._id);
                const deliveryResponse = await axios.post(
                  `${process.env.DELIVERY_SERVICE_URL}/nearest`,
                  {
                    orderId: order._id,
                    restaurantId: order.restaurantId,
                    restaurantAddress: restaurant.address.fullAddress,
                    customerId: order.userId,
                    dropAddress: order.deliveryAddress,
                    deliveryRiderId: driver.riderID,
                  },
                  {
                    headers: {
                      Authorization: req.headers.authorization, // Forward auth token
                    },
                  }
                );
                console.log('Driver assigned:', deliveryResponse.data.driver);
              } catch (error) {
                console.error('Error assigning driver:', error.message);
              }
            } else {
              console.error('No driver found for order');
            }
          } catch (error) {
            console.error('Failed to find nearest driver:', error.message);
          }
        }
      } catch (error) {
        console.error('Error in driver assignment process:', error.message);
      }
    }
    
    res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status by owner:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

// Get order counts by status for a specific owner
const getOrderCountsByStatus = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { restaurantId } = req.query;

    // Validate ownerId
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: 'Invalid owner ID' });
    }

    let restaurantIds = [];

    if (restaurantId) {
      // If restaurantId is provided, use it
      restaurantIds = Array.isArray(restaurantId) ? restaurantId : [restaurantId];
    } else {
      // Otherwise, fetch approved restaurants for the owner
      const restaurants = await Restaurant.find({
        owner: ownerId,
        approvalStatus: 'approved'
      }).select('_id');
      restaurantIds = restaurants.map(r => r._id.toString());
    }

    // Aggregate order counts by status
    const counts = await Order.aggregate([
      {
        $match: {
          restaurantId: { $in: restaurantIds }
        }
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Initialize default counts
    const result = {
      Pending: 0,
      Confirmed: 0,
      Prepared: 0,
      'On Delivery': 0,
      Completed: 0
    };

    // Map aggregation results to the response
    counts.forEach(item => {
      result[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      message: 'Order counts by status retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error fetching order counts by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order counts',
      error: error.message
    });
  }
};

const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sortBy = 'createdAt', order = 'desc' } = req.query;

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortCriteria = { [sortBy]: sortOrder };

    const orders = await Order.find({ userId })
      .sort(sortCriteria)
      .exec();

    const totalOrders = await Order.countDocuments({ userId });

    res.status(200).json({
      orders,
      totalOrders,
    });
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ message: 'Error fetching user orders', error: err.message });
  }
};

module.exports = { createOrder, getOrderById, updateOrderPaymentStatus, getTotalOrderCount, getYesterdayOrderCount, getDailyOrderCounts, getAllOrders, updateOrderStatusByOwner,  getOrderCountsByStatus, getOrdersByUserId };