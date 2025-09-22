const DeliveryRider = require('../models/Driver');
const bcrypt = require('bcryptjs');


// Create new rider
exports.createRider = async (req, res) => {
  try {
    const { name, email, mobileNumber, vehicleNumber, password } = req.body;

    const existingRider = await DeliveryRider.findOne({ email });
    if (existingRider) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password || 'defaultPassword123', 10);

    const newRider = new DeliveryRider({
      name,
      email,
      mobileNumber,
      vehicleNumber,
      password: hashedPassword,
      roleID: "role4",
      status: "active",
      isAvailable: true,
    });

    await newRider.save();
    res.status(201).json({ message: "Delivery Rider created successfully", rider: newRider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all riders (for admin)
exports.getAllRiders = async (req, res) => {
  try {
    const riders = await DeliveryRider.find();
    res.json(riders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single rider (for profile)

exports.getRiderProfile = async (req, res) => {
  try {
    const deliveryRider = await DeliveryRider.findOne({ _id: req.user.userID }).select('-password');

    if (!deliveryRider) {
      return res.status(404).json({ success: false, message: "DeliveryRider not found" });
    }

    res.status(200).json({
      success: true,
      data: deliveryRider,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.updateRiderById = async (req, res) => {
  try {
    const { name, email, mobileNumber, vehicleNumber } = req.body;
    const rider = await DeliveryRider.findByIdAndUpdate(
      req.params.id,
      { name, email, mobileNumber, vehicleNumber },
      { new: true }
    );
    if (!rider) return res.status(404).json({ message: "Rider not found" });
    res.json({ message: "Rider updated successfully", rider });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete rider
exports.deleteRider = async (req, res) => {
  try {
    await DeliveryRider.findByIdAndDelete(req.params.id);
    res.json({ message: "Rider deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
