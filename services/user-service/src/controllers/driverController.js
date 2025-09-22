const Driver = require("../models/Driver");
const mongoose = require('mongoose');

// Get the total count of drivers
exports.getDriverCount = async (req, res) => {
  try {
    const driverCount = await Driver.countDocuments();
    res.status(200).json({
      success: true,
      count: driverCount,
      message: "Driver count retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching driver count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve driver count",
      error: error.message,
    });
  }
};

// Get all drivers with details
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().select('-password'); // Exclude password field
    res.status(200).json({
      success: true,
      data: drivers,
      message: "Drivers retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve drivers",
      error: error.message,
    });
  }
};

// Update a driver by riderID
exports.updateDriver = async (req, res) => {
  try {
    const { riderID } = req.params;
    const updateData = req.body;

    // Prevent updating riderID or password directly
    delete updateData.riderID;
    delete updateData.password;

    // Validate status if provided
    if (updateData.status && !['active', 'inactive', 'on-delivery'].includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'active', 'inactive', or 'on-delivery'",
      });
    }

    // Check for unique fields if they are being updated
    if (updateData.mobileNumber) {
      const existingDriver = await Driver.findOne({ mobileNumber: updateData.mobileNumber, riderID: { $ne: riderID } });
      if (existingDriver) {
        return res.status(400).json({
          success: false,
          message: "Mobile number is already in use by another driver",
        });
      }
    }

    if (updateData.email) {
      const existingDriver = await Driver.findOne({ email: updateData.email, riderID: { $ne: riderID } });
      if (existingDriver) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another driver",
        });
      }
    }

    if (updateData.vehicleNumber) {
      const existingDriver = await Driver.findOne({ vehicleNumber: updateData.vehicleNumber, riderID: { $ne: riderID } });
      if (existingDriver) {
        return res.status(400).json({
          success: false,
          message: "Vehicle number is already in use by another driver",
        });
      }
    }

    const driver = await Driver.findOneAndUpdate(
      { riderID },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      success: true,
      data: driver,
      message: "Driver updated successfully",
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update driver",
      error: error.message,
    });
  }
};

// Delete a driver by riderID
exports.deleteDriver = async (req, res) => {
  try {
    const { riderID } = req.params;

    const driver = await Driver.findOne({ riderID });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    if (driver.status !== 'inactive') {
      return res.status(400).json({
        success: false,
        message: "Cannot delete driver. Driver status must be 'inactive'",
      });
    }

    await Driver.deleteOne({ riderID });

    res.status(200).json({
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete driver",
      error: error.message,
    });
  }
};