const Customer = require("../models/Customer");
const moment = require('moment');

exports.getCustomerCount = async (req, res) => {
  try {
    // Get the total count of customers from the database
    const customerCount = await Customer.countDocuments();

  
    res.status(200).json({
      success: true,
      count: customerCount,
      message: "Customer count retrieved successfully",
    });
  } catch (error) {
    
    console.error("Error fetching customer count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve customer count",
      error: error.message,
    });
  }
};

exports.getCustomerGrowthForWeek = async (req, res) => {
  try {
    const weekOffset = parseInt(req.params.weekOffset, 10);
    if (isNaN(weekOffset)) {
      return res.status(400).json({ success: false, message: "Invalid week offset" });
    }

    const startOfWeek = moment().subtract(weekOffset, 'weeks').startOf('isoWeek').toDate();
    const endOfWeek = moment().subtract(weekOffset, 'weeks').endOf('isoWeek').toDate();

    const growthData = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: growthData });
  } catch (error) {
    console.error("Error fetching customer growth:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getCustomers = async (req, res) => {
  try {
      const customers = await Customer.find();
      res.status(200).json(customers);
  } catch (error) {
      res.status(500).json({ message: "Error fetching customers", error });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.user.userID }).select('-password');
    
    const userId = req.user.userID;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update customer profile
exports.updateCustomerProfile = async (req, res) => {
  try {
    const userId = req.user.userID; 
    const { name, mobileNumber, address } = req.body;

    // Ensure the user is updating their own profile
    if (userId !== req.user.userID) {
      return res.status(403).json({ message: 'Unauthorized: You can only update your own profile' });
    }
    
    const customer = await Customer.findById(userId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.name = name || customer.name;
    customer.mobileNumber = mobileNumber || customer.mobileNumber;
    customer.address = address || customer.address;

    await customer.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      data: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        mobileNumber: customer.mobileNumber,
        address: customer.address,
      }
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('name email');
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};
